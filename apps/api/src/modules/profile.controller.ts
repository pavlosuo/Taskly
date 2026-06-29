import { updateProfileSchema } from "../include/schemas.ts";
import { Request, Response } from "express";
import { IServer } from "../include/types.ts";

export class ProfileController {
  server: IServer;
  constructor(server: IServer) {
    this.server = server;
  }

  async updateProfile(req: Request, res: Response) {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const {
        username,
        fullName,
        fullPhone,
        phone,
        code,
        email,
        avatar,
        payout,
      } = parsed.data;
      const db = await this.server.getDb();
      const users = db.collection("users");
      const updates: {
        username?: string;
        "profile.fullName"?: string;
        "profile.avatar"?: string;
        "profile.fullPhone"?: string;
        "profile.phone"?: string;
        "profile.code"?: string;
        "acceptance.phoneVerified"?: boolean;
        "acceptance.emailVerified"?: boolean;
        "acceptance.personVerified"?: boolean;
        "acceptance.agreementAccepted"?: boolean;
        "profile.payout"?: number;
        email?: string;
        payout?: {
          iban: string;
          bankName: string;
        };
      } = {};
      if(!req.user) return res.status(401).json({ success: false, message: "Unauthorized." });
      if (username !== undefined && username !== req.user.username) {
        const exists = await users.findOne({
          username,
          _id: { $ne: req.user._id },
        });
        if (exists)
          return res
            .status(400)
            .json({ success: false, message: "Username already taken." });
        updates.username = username;
      }

      if (fullName !== undefined) updates["profile.fullName"] = fullName;
      if (avatar !== undefined) updates["profile.avatar"] = avatar;

      if (
        fullPhone !== undefined &&
        fullPhone !== req.user.profile?.fullPhone
      ) {
        const phoneTaken = await users.findOne({
          "profile.fullPhone": fullPhone,
          _id: { $ne: req.user._id },
        });
        if (phoneTaken)
          return res
            .status(400)
            .json({ success: false, message: "Phone already in use." });
        updates["profile.fullPhone"] = fullPhone;
        updates["profile.phone"] = phone;
        updates["profile.code"] = code;
        updates["acceptance.phoneVerified"] = false;
      }

      if (email !== undefined && email !== req.user.email) {
        const emailTaken = await users.findOne({
          email,
          _id: { $ne: req.user._id },
        });
        if (emailTaken)
          return res
            .status(400)
            .json({ success: false, message: "Email already in use." });
        updates.email = email;
        updates["acceptance.emailVerified"] = false;
      }

      if (payout !== undefined) {
        updates.payout = {
          iban: payout.iban.replace(/\s/g, "").toUpperCase(),
          bankName: payout.bankName,
        };
      }

      if (Object.keys(updates).length === 0)
        return res.json({ success: true, message: "Nothing to update." });

      await users.updateOne({ _id: req.user._id }, { $set: updates });
      const updatedUser = await users.findOne(
        { _id: req.user._id },
        { projection: { passwordHash: 0 } },
      );

      return res.json({
        success: true,
        message: "Profile updated.",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async deactivateAccount(req: Request, res: Response) {
    try {
      if(!req.user) return res.status(401).json({ success: false, message: "Unauthorized." });
      const db = await this.server.getDb();
      await db.collection("users").deleteOne({ _id: req.user._id });
      res.clearCookie("token", { path: "/" });
      return res.json({ success: true, message: "Account deactivated." });
    } catch (error) {
      console.error("Deactivate account error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
}
