import { ObjectId } from "mongodb";
import { generateOtp, safeEqual } from "@/utils";
import { OtpChannel, OtpPurpose, ServiceResult } from "@shared/types";
import { sendOtpSchema } from "@shared/schemas";
import { IServer, User } from "@/types";

interface SendOtpParams {
  userId: ObjectId;
  purpose: OtpPurpose;
  channel: OtpChannel;
  destination: string;
}

type ConsumeResult =
  | { ok: true; record: SendOtpParams }
  | { ok: false; status: number; message: string };

export class OtpService {
  constructor(private server: IServer) {}

  async dispatch(
    user: User | undefined,
    body: unknown,
  ): Promise<ServiceResult> {
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    const data = parsed.data;

    if (data.purpose === "verify-email") {
      if (!user)
        return { success: false, status: 401, message: "Unauthorized." };
      const destination = user.newEmail ?? user.email;
      return this.send({
        userId: user._id,
        purpose: "verify-email",
        channel: "email",
        destination,
      });
    }

    if (data.purpose === "verify-phone") {
      if (!user)
        return { success: false, status: 401, message: "Unauthorized." };
      const destination = user.profile?.newFullPhone ?? user.profile?.fullPhone;
      if (!destination)
        return { success: false, status: 400, message: "No phone number set." };
      return this.send({
        userId: user._id,
        purpose: "verify-phone",
        channel: "phone",
        destination,
      });
    }

    const db = await this.server.getDb();
    const found = await db
      .collection("users")
      .findOne({ "profile.fullPhone": data.fullPhone });
    if (!found) return { success: true, status: 200, data: {} };

    return this.send({
      userId: found._id,
      purpose: "reset-password",
      channel: "phone",
      destination: data.fullPhone,
    });
  }

  async send({
    userId,
    purpose,
    channel,
    destination,
  }: SendOtpParams): Promise<ServiceResult> {
    try {
      const code = generateOtp();
      const expiresAt = new Date(Date.now() + this.server.time);
      const db = await this.server.getDb();

      await db.collection("users").updateOne(
        { _id: userId },
        {
          $set: {
            [`otps.${purpose}`]: { code, channel, destination, expiresAt },
          },
        },
      );

      if (channel === "email") {
        await this.server.sendEmail({
          to: destination,
          subject: "Your OTP Code",
          text: `Your OTP code is: ${code}. Valid for 15 minutes.`,
        });
      } else {
        await this.server.sendSms(destination, code);
      }

      return { success: true, status: 200, data: {} };
    } catch (error) {
      console.error("Send OTP error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async consume(
    userId: ObjectId,
    purpose: OtpPurpose,
    code: string,
  ): Promise<ConsumeResult> {
    const db = await this.server.getDb();
    const user = await db.collection("users").findOne({ _id: userId });
    const record = user?.otps?.[purpose];

    if (!record)
      return { ok: false, status: 400, message: "No OTP requested." };
    if (new Date() > new Date(record.expiresAt))
      return { ok: false, status: 400, message: "OTP expired." };
    if (!safeEqual(record.code, code))
      return { ok: false, status: 400, message: "Invalid OTP." };

    await db
      .collection("users")
      .updateOne({ _id: userId }, { $unset: { [`otps.${purpose}`]: "" } });
    return { ok: true, record };
  }
}
