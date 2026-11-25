import bcrypt from "bcrypt";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  CLIENT_URL,
  JWT_SECRET,
} from "@/env";
import {
  loginSchema,
  adminRegisterSchema,
  registerSchema,
  verifyResetOtpSchema,
  forgotPasswordEmailSchema,
  resetPasswordSchema,
  ServiceResult,
} from "shared/index";
import { IServer, User } from "@/types";
import jwt from "jsonwebtoken";
import { ObjectId, MongoServerError } from "mongodb";
import { hashToken } from "@/utils";
import { OtpService } from "@/modules/otp/otp.service";

export class AuthService {
  private otpService: OtpService;
  private dummyPassword: string;

  constructor(private server: IServer) {
    this.dummyPassword = bcrypt.hashSync("timing-equalizer", 10);
    this.otpService = new OtpService(server);
    this.registerAdmin({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      username: ADMIN_USERNAME,
    })
      .then((r) => {
        if (!r.success && r.message !== "user.usernameExists") {
          console.error("Admin bootstrap failed:", r.status, r.message);
        }
      })
      .catch((e) => console.error("Error registering admin:", e));
  }

  private readResetToken(
    token: string,
  ): { ok: true; id: ObjectId } | { ok: false; reason: "expired" | "invalid" } {
    try {
      const d = jwt.verify(token, JWT_SECRET || "", { algorithms: ["HS256"] });
      if (
        typeof d === "string" ||
        d.typ !== "reset" ||
        typeof d.id !== "string" ||
        !ObjectId.isValid(d.id)
      ) {
        return { ok: false, reason: "invalid" };
      }
      return { ok: true, id: new ObjectId(d.id) };
    } catch (e) {
      return {
        ok: false,
        reason: e instanceof jwt.TokenExpiredError ? "expired" : "invalid",
      };
    }
  }

  async register(body: unknown): Promise<ServiceResult> {
    try {
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const {
        email,
        password,
        username,
        fullName,
        phone,
        role,
        code,
        fullPhone,
        agreementAccepted,
      } = parsed.data;
      const db = await this.server.getDb();
      const users = db.collection("users");
      const existingName = await users.findOne(
        { username },
        { collation: { locale: "en", strength: 2 } },
      );
      if (existingName)
        return {
          success: false,
          status: 400,
          message: "user.usernameExists",
        };
      const existing = await users.findOne(
        {
          $or: [
            { email },
            { newEmail: email },
            { "profile.fullPhone": fullPhone },
            { "profile.newFullPhone": fullPhone },
          ],
        },
        { collation: { locale: "en", strength: 2 } },
      );

      if (existing)
        return {
          success: false,
          status: 400,
          message: "user.unavailableData",
        };
      const passwordHash = await bcrypt.hash(password, 10);
      const initials = (fullName ?? username ?? "")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const doc: Omit<User, "_id"> = {
        username,
        publicLink: `${CLIENT_URL}/@${username}`,
        email,
        role,
        createdAt: new Date(),
        acceptance: {
          phoneVerified: false,
          emailVerified: false,
          personVerified: false,
          agreementAccepted: agreementAccepted,
        },
        payout: {
          iban: "",
          bankName: "",
        },
        profile: {
          fullName,
          phone,
          code,
          fullPhone,
          avatar: null,
          initials: initials,
        },
        settings: {
          lang: "fi-FI",
          theme: "light",
          checkboxes: {
            email: true,
            phone: true,
            privateProfile: false,
            noOnlineStatus: false,
          },
        },
        publicProfile: {
          bio: "",
          skills: [],
          certificates: [],
          languages: [],
          header: null,
          introduction: null,
        },
        passwordHash,
        tokenVersion: 0,
      };
      const result = await users.insertOne(doc);
      const fullUser = { _id: result.insertedId, ...doc };
      return {
        success: true,
        status: 200,
        data: { user: fullUser, fullUser },
      };
    } catch (e: unknown) {
      if (e instanceof MongoServerError && e.code === 11000) {
        const key = Object.keys(e.keyPattern ?? {})[0];
        return {
          success: false,
          status: 400,
          message:
            key === "username" ? "user.usernameExists" : "user.unavailableData",
        };
      }
      console.error("Register error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async registerAdmin(body: unknown): Promise<ServiceResult> {
    try {
      const parsed = adminRegisterSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const { email, password, username } = parsed.data;
      const db = await this.server.getDb();
      const users = db.collection("users");
      const existing = await users.findOne(
        { $or: [{ email }, { username }] },
        { collation: { locale: "en", strength: 2 } },
      );
      if (existing)
        return { success: false, status: 400, message: "user.usernameExists" };
      const passwordHash = await bcrypt.hash(password, 10);
      const doc = {
        email,
        username,
        passwordHash,
        role: "admin",
        createdAt: new Date(),
        tokenVersion: 0,
        acceptance: {
          phoneVerified: false,
          emailVerified: false,
          personVerified: false,
          agreementAccepted: true,
        },
        payout: { iban: "", bankName: "" },
        profile: {
          fullName: username,
          phone: "",
          code: "",
          fullPhone: "",
          avatar: null,
          initials: username.slice(0, 2).toUpperCase(),
        },
        settings: {
          lang: "en",
          theme: "light",
          checkboxes: {
            email: true,
            phone: true,
            privateProfile: false,
            noOnlineStatus: false,
          },
        },
        publicProfile: {
          bio: "",
          skills: [],
          certificates: [],
          languages: [],
          header: null,
          introduction: null,
        },
      };
      const result = await users.insertOne(doc);
      return {
        success: true,
        status: 200,
        data: { user: { _id: result.insertedId, ...doc } },
      };
    } catch (e) {
      console.error("Register admin error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async login(body: unknown): Promise<ServiceResult> {
    try {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const { email, password } = parsed.data;
      const db = await this.server.getDb();
      const user = await db
        .collection("users")
        .findOne({ email }, { collation: { locale: "en", strength: 2 } });

      const isPasswordValid = await bcrypt.compare(
        password,
        user?.passwordHash ?? this.dummyPassword,
      );

      if (!user || !isPasswordValid)
        return {
          success: false,
          status: 401,
          message: "user.invalidCredentials",
        };
      return {
        success: true,
        status: 200,
        data: { user },
      };
    } catch (e) {
      console.error("Login error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async verifyPasswordResetOtp(body: unknown): Promise<ServiceResult> {
    try {
      const parsed = verifyResetOtpSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const { fullPhone, otp } = parsed.data;
      const db = await this.server.getDb();
      const user = await db
        .collection("users")
        .findOne({ "profile.fullPhone": fullPhone });
      if (!user)
        return { success: false, status: 400, message: "otp.notFound" };
      const check = await this.otpService.consume(
        user._id,
        "reset-password",
        otp,
        fullPhone,
      );
      if (!check.ok)
        return { success: false, status: check.status, message: check.message };
      const resetToken = jwt.sign(
        { id: user._id.toString(), typ: "reset" },
        JWT_SECRET || "",
        { expiresIn: "15m" },
      );
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { resetTokenHash: hashToken(resetToken) } },
        );
      return { success: true, status: 200, data: { resetToken } };
    } catch (e) {
      console.error("Verify reset OTP error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async sendPasswordResetLink(body: unknown): Promise<ServiceResult> {
    try {
      const parsed = forgotPasswordEmailSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const { email } = parsed.data;
      const db = await this.server.getDb();
      const user = await db
        .collection("users")
        .findOne({ email }, { collation: { locale: "en", strength: 2 } });
      if (!user) return { success: true, status: 200 };
      const resetToken = jwt.sign(
        { id: user._id.toString(), typ: "reset" },
        JWT_SECRET || "",
        { expiresIn: "1h" },
      );
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { resetTokenHash: hashToken(resetToken) } },
        );
      const resetUrl = `${CLIENT_URL}/forgot-password?token=${resetToken}`;
      await this.server.sendEmail({
        to: email,
        subject: "Password Reset",
        text: `Reset your password: ${resetUrl}\n\nLink expires in 1 hour.`,
      });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Forgot password error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async resetPassword(body: unknown): Promise<ServiceResult> {
    try {
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };
      const { token, password } = parsed.data;
      const read = this.readResetToken(token);
      if (!read.ok)
        return { success: false, status: 400, message: "general.unknown" };
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({
        _id: read.id,
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return {
          success: false,
          status: 400,
          message: "general.unknown",
        };
      const passwordHash = await bcrypt.hash(password, 10);
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { passwordHash }, $unset: { resetTokenHash: "" } },
        );
      await this.server.revokeSessions(user._id);
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Reset password error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async verifyPasswordResetToken(token: unknown): Promise<ServiceResult> {
    try {
      if (!token || typeof token !== "string")
        return { success: false, status: 400, message: "token.required" };
      const read = this.readResetToken(token);
      if (!read.ok)
        return {
          success: false,
          status: 400,
          message: "general.unknown",
          data: { reason: read.reason },
        };
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({
        _id: read.id,
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return {
          success: false,
          status: 400,
          message: "general.unknown",
          data: { reason: "invalid" },
        };
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Verify reset token error:", e);
      return {
        success: false,
        status: 500,
        message: "general.unknown",
        data: { reason: "error" },
      };
    }
  }
}
