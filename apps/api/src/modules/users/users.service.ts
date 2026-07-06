import {
  updateProfileSchema,
  verifyPhoneOtpSchema,
  otpVerifySchema,
} from "@shared/schemas";
import { IServer, PublicUser, ServiceResult } from "@shared/types";
import { OtpService } from "@/modules/otp/otp.service";
import { toPublicUser } from "@/utils";

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
        avatar,
        payout,
        newEmail,
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
      console.log(newEmail);
      if (newEmail !== undefined && newEmail !== user.email) {
        const exists = await users.findOne({
          email: newEmail,
        });
        console.log(exists);
        if (exists)
          return {
            success: false,
            status: 400,
            message: "Email already in use.",
          };
        updates.newEmail = newEmail;
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
      const updated = await this.server.getUserPublic(user._id);
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
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
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { "acceptance.phoneVerified": true } },
        );
      const updated = await this.server.getUserPublic(user._id);
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (error) {
      console.error("Verify phone OTP error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async verifyEmailOtp(
    user: PublicUser,
    body: unknown,
  ): Promise<ServiceResult> {
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    const check = await this.otpService.consume(
      user._id,
      "verify-email",
      parsed.data.otp,
    );
    if (!check.ok)
      return { success: false, status: check.status, message: check.message };

    try {
      const db = await this.server.getDb();
      const confirmedEmail = check.record.destination;
      const updates: Record<string, unknown> = {
        "acceptance.emailVerified": true,
      };
      if (confirmedEmail !== user.email) {
        updates.email = confirmedEmail;
      }
      await db
        .collection("users")
        .updateOne({ _id: user._id }, { $set: updates });
      const updated = await this.server.getUserPublic(user._id);
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (error) {
      console.error("Verify email OTP error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }
}
