import { ObjectId } from "mongodb";
import { generateOtp, hashOtp, safeEqual } from "@/utils";
import {
  OtpPurpose,
  ServiceResult,
  sendOtpSchema,
  OTP_TTL_MINUTES,
  OTP_RESEND_SECONDS,
  OTP_MAX_ATTEMPTS,
} from "shared/index";
import { IServer, User, SendOtpParams, ConsumeResult } from "@/types";

export class OtpService {
  constructor(private server: IServer) {}

  async dispatch(
    user: User | undefined,
    body: unknown,
  ): Promise<ServiceResult> {
    try {
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
          return {
            success: false,
            status: 401,
            message: "general.unauthorized",
          };
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
          return {
            success: false,
            status: 401,
            message: "general.unauthorized",
          };
        const destination =
          user.profile?.newFullPhone ?? user.profile?.fullPhone;
        if (!destination)
          return {
            success: false,
            status: 400,
            message: "otp.missingFullPhone",
          };
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
      if (!found) return { success: true, status: 200 };

      return this.send({
        userId: found._id,
        purpose: "reset-password",
        channel: "phone",
        destination: data.fullPhone,
      });
    } catch (e) {
      console.error("Send OTP error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async send({
    userId,
    purpose,
    channel,
    destination,
  }: SendOtpParams): Promise<ServiceResult> {
    try {
      const path = `otps.${purpose}`;
      const code = generateOtp();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60_000);
      const cooldownEdge = new Date(now.getTime() - OTP_RESEND_SECONDS * 1000);
      const db = await this.server.getDb();
      const users = db.collection("users");
      const res = await users.updateOne(
        {
          _id: userId,
          $or: [
            { [`${path}.sentAt`]: { $exists: false } },
            { [`${path}.sentAt`]: { $lte: cooldownEdge } },
          ],
        },
        {
          $set: {
            [path]: {
              codeHash: hashOtp(userId, purpose, destination, code),
              channel,
              destination,
              expiresAt,
              sentAt: now,
              attempts: 0,
            },
          },
        },
      );
      if (res.matchedCount === 0) {
        return { success: false, status: 429, message: "otp.resendTooSoon" };
      }

      try {
        if (channel === "email") {
          await this.server.sendEmail({
            to: destination,
            subject: "Your OTP Code",
            text: `Your OTP code is: ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`,
          });
        } else {
          await this.server.sendSms(destination, code);
        }
      } catch (e) {
        await users.updateOne({ _id: userId }, { $unset: { [path]: "" } });
        throw e;
      }
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Send OTP error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async consume(
    userId: ObjectId,
    purpose: OtpPurpose,
    code: string,
    expectedDestination?: string,
  ): Promise<ConsumeResult> {
    try {
      const db = await this.server.getDb();
      const users = db.collection("users");
      const path = `otps.${purpose}`;
      const now = new Date();

      const filter: Record<string, unknown> = {
        _id: userId,
        [`${path}.expiresAt`]: { $gt: now },
        [`${path}.attempts`]: { $lt: OTP_MAX_ATTEMPTS },
      };
      if (expectedDestination !== undefined)
        filter[`${path}.destination`] = expectedDestination;

      const after = await users.findOneAndUpdate(
        filter,
        { $inc: { [`${path}.attempts`]: 1 } },
        { returnDocument: "after", projection: { [path]: 1 } },
      );
      const rec = after?.otps?.[purpose];

      if (!rec) {
        const cur = await users.findOne(
          { _id: userId },
          { projection: { [path]: 1 } },
        );
        const r = cur?.otps?.[purpose];
        if (!r) return { ok: false, status: 400, message: "otp.notFound" };
        if (
          expectedDestination !== undefined &&
          r.destination !== expectedDestination
        )
          return { ok: false, status: 400, message: "otp.notFound" };
        if (new Date() > new Date(r.expiresAt)) {
          await users.updateOne(
            { _id: userId, [`${path}.codeHash`]: r.codeHash },
            { $unset: { [path]: "" } },
          );
          return { ok: false, status: 400, message: "otp.expired" };
        }
        await users.updateOne(
          { _id: userId, [`${path}.codeHash`]: r.codeHash },
          { $unset: { [path]: "" } },
        );
        return { ok: false, status: 429, message: "otp.tooManyAttempts" };
      }

      const candidate = hashOtp(userId, purpose, rec.destination, code);

      if (!rec.codeHash || !safeEqual(rec.codeHash, candidate)) {
        if (rec.attempts >= OTP_MAX_ATTEMPTS) {
          await users.updateOne(
            { _id: userId, [`${path}.codeHash`]: rec.codeHash },
            { $unset: { [path]: "" } },
          );
          return { ok: false, status: 429, message: "otp.tooManyAttempts" };
        }
        return { ok: false, status: 400, message: "otp.invalid" };
      }

      const burn = await users.updateOne(
        { _id: userId, [`${path}.codeHash`]: rec.codeHash },
        { $unset: { [path]: "" } },
      );
      if (burn.modifiedCount === 0)
        return { ok: false, status: 400, message: "otp.notFound" };

      return {
        ok: true,
        record: {
          userId,
          purpose,
          channel: rec.channel,
          destination: rec.destination,
        },
      };
    } catch (e) {
      console.error("Consume OTP error:", e);
      return { ok: false, status: 500, message: "general.unknown" };
    }
  }
}
