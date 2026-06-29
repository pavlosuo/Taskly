import jwt from "jsonwebtoken";
import { IServer, User } from "../include/types.ts";
import {
  otpVerifySchema,
  sendResetOtpSchema,
  verifyResetOtpSchema,
} from "../include/schemas.ts";
import { generateOtp, hashToken, safeEqual } from "../include/utils.ts";
import { Request, Response } from "express";

export class OtpController {
  server: IServer;
  constructor(server: IServer) {
    this.server = server;
  }

  async sendOtp(req: Request, res: Response) {
    try {
      if(!req.user) return res.status(401).json({ success: false, message: "Unauthorized." });
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + this.server.time);
      const db = await this.server.getDb();
      await db
        .collection("users")
        .updateOne(
          { _id: req.user._id },
          { $set: { otp: { code: otp, expiresAt } } },
        );
      await this.server.getTransporter().sendMail({
        from: process.env.SMTP_USER,
        to: req.user.email,
        subject: "Your OTP Code",
        text: `Your OTP code is: ${otp}. Valid for 15 minutes.`,
      });
      return res.json({ success: true, message: "OTP sent." });
    } catch (error) {
      console.error("Send OTP error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async verifyOtp(req: Request, res: Response) {
    const parsed = otpVerifySchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      if(!req.user) return res.status(401).json({ success: false, message: "Unauthorized." });
      const { otp } = parsed.data;
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({ _id: req.user._id }) as User;
      if (!user.otp)
        return res
          .status(400)
          .json({ success: false, message: "No OTP requested." });
      if (new Date() > new Date(user.otp.expiresAt))
        return res
          .status(400)
          .json({ success: false, message: "OTP expired." });
      if (!safeEqual(user.otp.code, otp))
        return res
          .status(400)
          .json({ success: false, message: "Invalid OTP." });

      await db
        .collection("users")
        .updateOne(
          { _id: req.user._id },
          { $unset: { otp: "" }, $set: { "acceptance.emailVerified": true } },
        );
      return res.json({ success: true, message: "OTP verified." });
    } catch (error) {
      console.error("Verify OTP error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async sendResetOtp(req: Request, res: Response) {
    const parsed = sendResetOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { phone } = parsed.data;
      const db = await this.server.getDb();
      const user = await db
        .collection("users")
        .findOne({ "profile.fullPhone": phone });
      if (!user)
        return res.json({
          success: true,
          message: "Code sent if phone exists.",
        });

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + this.server.time);
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { resetOtp: { code: otp, phone, expiresAt } } },
        );
      return res.json({ success: true, message: "Code sent if phone exists." });
    } catch (error) {
      console.error("Send reset OTP error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async verifyResetOtp(req: Request, res: Response) {
    const parsed = verifyResetOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { phone, otp } = parsed.data;
      const db = await this.server.getDb();
      const user = await db
        .collection("users")
        .findOne({ "resetOtp.phone": phone });
      if (!user?.resetOtp)
        return res
          .status(400)
          .json({ success: false, message: "No OTP requested." });
      if (new Date() > new Date(user.resetOtp.expiresAt))
        return res
          .status(400)
          .json({ success: false, message: "OTP expired." });
      if (!safeEqual(user.resetOtp.code, otp))
        return res
          .status(400)
          .json({ success: false, message: "Invalid code." });

      const resetToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET || "",
        { expiresIn: "15m" },
      );

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $unset: { resetOtp: "" },
          $set: { resetTokenHash: hashToken(resetToken) },
        },
      );
      return res.json({ success: true, resetToken });
    } catch (error) {
      console.error("Verify reset OTP error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
}
