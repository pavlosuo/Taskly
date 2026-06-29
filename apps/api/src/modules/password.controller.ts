/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import {
  forgotPasswordEmailSchema,
  resetPasswordSchema,
} from "../include/schemas.ts";
import { hashToken } from "../include/utils.ts";
import { IServer } from "../include/types.ts";
import { Request, Response } from "express";

export class PasswordController {
  server: IServer;
  server: IServer;
  constructor(server: IServer) {
    this.server = server;
  }

  async forgotPassword(req: Request, res: Response) {
    const parsed = forgotPasswordEmailSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { email } = parsed.data;
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({ email });
      if (!user)
        return res.json({
          success: true,
          message: "If this email exists, a reset link has been sent.",
        });

      const resetToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET || "",
        { expiresIn: "1h" },
      );

      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { resetTokenHash: hashToken(resetToken) } },
        );

      const resetUrl = `${process.env.CLIENT_URL}/forgot-password?token=${resetToken}`;
      await this.server.getTransporter().sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Password Reset",
        text: `Reset your password: ${resetUrl}\n\nLink expires in 1 hour.`,
      });
      return res.json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async resetPassword(req: Request, res: Response) {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { token, password } = parsed.data;
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "");
      } catch {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token." });
      }
      if (!decoded || typeof decoded !== "object") return null;
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.id),
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token." });

      const passwordHash = await bcrypt.hash(password, 10);
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { passwordHash }, $unset: { resetTokenHash: "" } },
        );
      return res.json({
        success: true,
        message: "Password reset successfully.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async verifyResetToken(req: Request, res: Response) {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({
        success: false,
        message: "Token is required.",
        reason: "invalid",
      });

    try {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "");
      } catch (e: any) {
        const reason = e.name === "TokenExpiredError" ? "expired" : "invalid";
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token.",
          reason,
        });
      }
      if (!decoded || typeof decoded !== "object") return null;
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.id),
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token.",
          reason: "invalid",
        });

      return res.json({ success: true });
    } catch (error) {
      console.error("Verify reset token error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error.", reason: "error" });
    }
  }
}
