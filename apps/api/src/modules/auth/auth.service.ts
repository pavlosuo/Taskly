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
} from "@shared/index";
import { IServer, User } from "@/types";
import { ServiceResult } from "@shared/types";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { hashToken } from "@/utils";
import { OtpService } from "@/modules/otp/otp.service";

export class AuthService {
  private otpService: OtpService;

  constructor(private server: IServer) {
    this.otpService = new OtpService(server);
    try {
      this.registerAdmin({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        username: ADMIN_USERNAME,
      });
    } catch (error) {
      console.log("Error registering admin:", error);
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
      const existing = await users.findOne({
        $or: [{ email }, { username }, { "profile.fullPhone": fullPhone }],
      });

      if (existing)
        return {
          success: false,
          status: 400,
          message: "User already exists.",
        };
      const passwordHash = await bcrypt.hash(password, 10);

      const initials = (fullName ?? username ?? "")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const doc = {
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
          lang: "en",
          theme: "light",
          checkboxes: {
            email: true,
            privateProfile: false,
          },
        },
        publicProfile: {
          bio: "",
          skills: [],
          certificates: [],
          languages: [],
          header: null,
        },
        passwordHash,
      } as Omit<User, "_id">;
      const result = await users.insertOne(doc);
      const fullUser = { _id: result.insertedId, ...doc };
      return {
        success: true,
        status: 200,
        data: { user: fullUser, fullUser },
      };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, status: 500, message: "Server error." };
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
      const existing = await users.findOne({ $or: [{ email }, { username }] });
      if (existing)
        return { success: false, status: 400, message: "User already exists." };
      const passwordHash = await bcrypt.hash(password, 10);
      const doc = {
        email,
        username,
        passwordHash,
        role: "admin",
        createdAt: new Date(),
      };
      const result = await users.insertOne(doc);
      return {
        success: true,
        status: 200,
        data: { user: result },
      };
    } catch (error) {
      console.error("Register admin error:", error);
      return { success: false, status: 500, message: "Server error." };
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
      const user = (await db
        .collection("users")
        .findOne({ email })) as User | null;
      const isPasswordValid =
        user && (await bcrypt.compare(password, user.passwordHash));

      if (!user || !isPasswordValid)
        return {
          success: false,
          status: 401,
          message: "Invalid email or password.",
        };
      return {
        success: true,
        status: 200,
        data: { user },
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, status: 500, message: "Server error." };
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
        return { success: false, status: 400, message: "No OTP requested." };

      const check = await this.otpService.consume(
        user._id,
        "reset-password",
        otp,
      );
      if (!check.ok)
        return { success: false, status: check.status, message: check.message };
      const resetToken = jwt.sign(
        { id: user._id.toString() },
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
    } catch (error) {
      console.error("Verify reset OTP error:", error);
      return { success: false, status: 500, message: "Server error." };
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
      const user = await db.collection("users").findOne({ email });
      if (!user) return { success: true, status: 200 };
      const resetToken = jwt.sign(
        { id: user._id.toString() },
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
    } catch (error) {
      console.error("Forgot password error:", error);
      return { success: false, status: 500, message: "Server error." };
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
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET || "");
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
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return {
          success: false,
          status: 400,
          message: "Invalid or expired token.",
        };
      const passwordHash = await bcrypt.hash(password, 10);
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { passwordHash }, $unset: { resetTokenHash: "" } },
        );
      return { success: true, status: 200 };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async verifyPasswordResetToken(token: unknown): Promise<ServiceResult> {
    try {
      if (!token || typeof token !== "string")
        return { success: false, status: 400, message: "Token is required." };
      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET || "");
      } catch (e: any) {
        const reason = e.name === "TokenExpiredError" ? "expired" : "invalid";
        return {
          success: false,
          status: 400,
          message: "Invalid or expired token.",
          data: { reason },
        };
      }
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.id),
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return {
          success: false,
          status: 400,
          message: "Invalid or expired token.",
          data: { reason: "invalid" },
        };
      return { success: true, status: 200 };
    } catch (error) {
      console.error("Verify reset token error:", error);
      return {
        success: false,
        status: 500,
        message: "Server error.",
        data: { reason: "error" },
      };
    }
  }
}
