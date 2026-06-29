import { verifyPhoneOtpSchema } from "../include/schemas.ts";
import { generateOtp, safeEqual } from "../include/utils.ts";
import { IServer } from "../include/types.ts";
import { Request, Response } from "express";

export class PhoneController {
  server: IServer;
  constructor(server: IServer) {
    this.server = server;
  }

  async sendPhoneOtp(req: Request, res: Response) {
    try {
      if(!req.user) return res.status(401).json({ success: false, message: "Unauthorized." });
      const phone = req.user.profile?.fullPhone;
      if (!phone)
        return res
          .status(400)
          .json({ success: false, message: "No phone number set." });

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + this.server.time);
      const db = await this.server.getDb();
      await db
        .collection("users")
        .updateOne(
          { _id: req.user._id },
          { $set: { phoneOtp: { code: otp, expiresAt } } },
        );

      await this.server.smsSender.sendOtp(phone, `${otp}`);
      return res.json({ success: true, message: "Code sent." });
    } catch (error) {
      console.error("Send phone OTP error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async verifyPhoneOtp(req: Request, res: Response) {
    const parsed = verifyPhoneOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      if(!req.user) return res.status(401).json({ success: false, message: "Unauthorized." });
      const { otp } = parsed.data;
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({ _id: req.user._id });
      if(!user) return res.status(401).json({ success: false, message: "Unauthorized." });
      if (!user.phoneOtp)
        return res
          .status(400)
          .json({ success: false, message: "No code requested." });
      if (new Date() > new Date(user.phoneOtp.expiresAt))
        return res
          .status(400)
          .json({ success: false, message: "Code expired." });
      if (!safeEqual(user.phoneOtp.code, otp))
        return res
          .status(400)
          .json({ success: false, message: "Invalid code." });
      const updatedUser = await db.collection("users").findOneAndUpdate(
        { _id: req.user._id },
        {
          $unset: { phoneOtp: "" },
          $set: { "acceptance.phoneVerified": true },
        },
        { returnDocument: "after", projection: { passwordHash: 0 } },
      );

      return res.json({
        success: true,
        message: "Phone verified.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Verify phone OTP error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
}
