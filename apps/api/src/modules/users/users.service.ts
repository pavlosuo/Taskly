import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import {
  updateProfileSchema,
  updateEmailRequestSchema,
  verifyPhoneOtpSchema,
} from "@shared/schemas";
import { hashToken } from "@shared/utils";
import { IServer, PublicUser, ServiceResult } from "@shared/types";
import { OtpService } from "@/modules/otp/otp.service";

export class UsersService {
  private otpService: OtpService;

  constructor(private server: IServer) {
    this.otpService = new OtpService(server);
  }

  async updateProfile(user: PublicUser, body: unknown): Promise<ServiceResult> {
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

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
      const updates: Record<string, unknown> = {};

      if (username !== undefined && username !== user.username) {
        const exists = await users.findOne({
          username,
          _id: { $ne: user._id },
        });
        if (exists)
          return {
            success: false,
            status: 400,
            message: "Username already taken.",
          };
        updates.username = username;
      }

      if (fullName !== undefined) updates["profile.fullName"] = fullName;
      if (avatar !== undefined) updates["profile.avatar"] = avatar;

      if (fullPhone !== undefined && fullPhone !== user.profile?.fullPhone) {
        const phoneTaken = await users.findOne({
          "profile.fullPhone": fullPhone,
          _id: { $ne: user._id },
        });
        if (phoneTaken)
          return {
            success: false,
            status: 400,
            message: "Phone already in use.",
          };
        updates["profile.fullPhone"] = fullPhone;
        updates["profile.phone"] = phone;
        updates["profile.code"] = code;
        updates["acceptance.phoneVerified"] = false;
      }

      if (email !== undefined && email !== user.email) {
        const emailTaken = await users.findOne({
          email,
          _id: { $ne: user._id },
        });
        if (emailTaken)
          return {
            success: false,
            status: 400,
            message: "Email already in use.",
          };
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
        return {
          success: true,
          status: 200,
          data: { message: "Nothing to update." },
        };

      await users.updateOne({ _id: user._id }, { $set: updates });
      const updated = await users.findOne(
        { _id: user._id },
        { projection: { passwordHash: 0 } },
      );
      return { success: true, status: 200, data: { user: updated } };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async deactivateAccount(user: PublicUser): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      await db.collection("users").deleteOne({ _id: user._id });
      return { success: true, status: 200, data: {} };
    } catch (error) {
      console.error("Deactivate account error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async requestEmailChange(
    user: PublicUser,
    body: unknown,
  ): Promise<ServiceResult> {
    const parsed = updateEmailRequestSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
      const { newEmail } = parsed.data;
      const db = await this.server.getDb();
      const exists = await db.collection("users").findOne({ email: newEmail });
      if (exists)
        return {
          success: false,
          status: 400,
          message: "Email already in use.",
        };

      const token = jwt.sign(
        { id: user._id.toString(), newEmail },
        process.env.JWT_SECRET || "",
        { expiresIn: "30m" },
      );
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { pendingEmailHash: hashToken(token) } },
        );
      const confirmUrl = `${process.env.CLIENT_URL}/confirm-email?token=${token}`;
      await this.server.getTransporter().sendMail({
        from: process.env.SMTP_USER,
        to: newEmail,
        subject: "Confirm your new email",
        text: `Confirm your new email: ${confirmUrl}\n\nLink expires in 30 minutes.`,
      });
      return { success: true, status: 200, data: {} };
    } catch (error) {
      console.error("Request email change error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async confirmEmailChange(body: unknown): Promise<ServiceResult> {
    const { token } = body as { token?: string };
    if (!token)
      return { success: false, status: 400, message: "Token is required." };

    try {
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "");
      } catch {
        return {
          success: false,
          status: 400,
          message: "Invalid or expired token.",
        };
      }
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.id),
        pendingEmailHash: hashToken(token),
      });
      if (!user)
        return {
          success: false,
          status: 400,
          message: "Invalid or expired token.",
        };

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: { email: decoded.newEmail, "acceptance.emailVerified": true },
          $unset: { pendingEmailHash: "" },
        },
      );
      return { success: true, status: 200, data: {} };
    } catch (error) {
      console.error("Confirm email change error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async verifyPhoneOtp(
    user: PublicUser,
    body: unknown,
  ): Promise<ServiceResult> {
    const parsed = verifyPhoneOtpSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    const check = await this.otpService.consume(
      user._id,
      "verify-phone",
      parsed.data.otp,
    );
    if (!check.ok)
      return { success: false, status: check.status, message: check.message };

    try {
      const db = await this.server.getDb();
      const updated = await db
        .collection("users")
        .findOneAndUpdate(
          { _id: user._id },
          { $set: { "acceptance.phoneVerified": true } },
          { returnDocument: "after", projection: { passwordHash: 0 } },
        );
      return { success: true, status: 200, data: { user: updated } };
    } catch (error) {
      console.error("Verify phone OTP error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }
}
