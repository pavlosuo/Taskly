import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { updateEmailRequestSchema } from "../include/schemas.ts";
import { hashToken } from "../include/utils.ts";
import { Request, Response } from "express";
import { IServer } from "../include/types.ts";

export class EmailController {
  server: IServer;
  constructor(server: IServer) {
    this.server = server;
  }

  async requestEmailChange(req: Request, res: Response) {
    const parsed = updateEmailRequestSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { newEmail } = parsed.data;
      const db = await this.server.getDb();
      const users = db.collection("users");

      const exists = await users.findOne({ email: newEmail });
      if (exists)
        return res
          .status(400)
          .json({ success: false, message: "Email already in use." });

      if (!req.user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });

      const token = jwt.sign(
        { id: req.user._id.toString(), newEmail },
        process.env.JWT_SECRET || "",
        { expiresIn: "30m" },
      );

      await users.updateOne(
        { _id: req.user._id },
        { $set: { pendingEmailHash: hashToken(token) } },
      );

      const confirmUrl = `${process.env.CLIENT_URL}/confirm-email?token=${token}`;
      await this.server.getTransporter().sendMail({
        from: process.env.SMTP_USER,
        to: newEmail,
        subject: "Confirm your new email",
        text: `Confirm your new email: ${confirmUrl}\n\nLink expires in 30 minutes.`,
      });

      return res.json({
        success: true,
        message: "Confirmation link sent to new email.",
      });
    } catch (error) {
      console.error("Request email change error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async confirmEmailChange(req: Request, res: Response) {
    const { token } = req.body;
    if (!token)
      return res
        .status(400)
        .json({ success: false, message: "Token is required." });

    try {
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
      const users = db.collection("users");
      const user = await users.findOne({
        _id: new ObjectId(decoded.id),
        pendingEmailHash: hashToken(token),
      });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token." });

      await users.updateOne(
        { _id: user._id },
        {
          $set: { email: decoded.newEmail, "acceptance.emailVerified": true },
          $unset: { pendingEmailHash: "" },
        },
      );

      return res.json({
        success: true,
        message: "Email updated successfully.",
      });
    } catch (error) {
      console.error("Confirm email change error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
}
