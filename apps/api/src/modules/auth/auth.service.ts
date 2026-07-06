import bcrypt from "bcrypt";
import {
  loginSchema,
  adminRegisterSchema,
  registerSchema,
  verifyResetOtpSchema,
  forgotPasswordEmailSchema,
  resetPasswordSchema,
} from "@shared/index";
import { IServer, User, ServiceResult } from "@shared/types";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { hashToken } from "@/utils";
import { OtpService } from "@/modules/otp/otp.service";

export class AuthService {
  private otpService: OtpService;

  constructor(private server: IServer) {
    this.otpService = new OtpService(server);
    this.registerAdmin({
      email: process.env.ADMIN_EMAIL || "",
      password: process.env.ADMIN_PASSWORD || "",
      username: process.env.ADMIN_USERNAME || "admin",
    });
  }

  async register(body: unknown): Promise<ServiceResult> {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
      const {
        email,
        password,
        username,
        fullName,
        phone,
        role,
        code,
        fullPhone,
      } = parsed.data;
      const db = await this.server.getDb();
      const users = db.collection("users");
      const existing = await users.findOne({
        $or: [{ email }, { username }, { "profile.fullPhone": fullPhone }],
      });
      console.log(existing);
      if (existing)
        return {
          success: false,
          status: 400,
          message: "User already exists.",
          data: {},
        };
      const passwordHash = await bcrypt.hash(password, 10);
      const doc = {
        username,
        email,
        role,
        createdAt: new Date(),
        acceptance: {
          phoneVerified: false,
          emailVerified: false,
          personVerified: false,
          agreementAccepted: false,
        },
        profile: {
          fullName,
          phone,
          code,
          fullPhone,
          avatar: null,
        },
        settings: {
          lang: "en",
          theme: "light",
        },
        passwordHash,
      };
      const result = await users.insertOne(doc);
      const fullUser = { _id: result.insertedId, ...doc };
      const { passwordHash: _, ...userSecure } = fullUser;
      return {
        success: true,
        status: 200,
        data: { user: userSecure, fullUser },
      };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async registerAdmin(body: unknown): Promise<ServiceResult> {
    const parsed = adminRegisterSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
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
      const user = this.server.getUserPublic(result.insertedId);
      return {
        success: true,
        status: 200,
        data: { user },
      };
    } catch (error) {
      console.error("Register admin error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async login(body: unknown): Promise<ServiceResult> {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
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

      const { passwordHash: _, ...loggedUser } = user;
      return {
        success: true,
        status: 200,
        data: { user: loggedUser, fullUser: user },
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async verifyPasswordResetOtp(body: unknown): Promise<ServiceResult> {
    const parsed = verifyResetOtpSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
      const { phone, otp } = parsed.data;
      const db = await this.server.getDb();
      const user = await db
        .collection("users")
        .findOne({ "profile.fullPhone": phone });
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
        process.env.JWT_SECRET || "",
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
    const parsed = forgotPasswordEmailSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
      const { email } = parsed.data;
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne({ email });
      if (!user) return { success: true, status: 200, data: {} };

      const resetToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET || "",
        { expiresIn: "1h" },
      );
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { resetTokenHash: hashToken(resetToken) } },
        );
      const resetUrl = `${process.env.CLIENT_URL}/forgot-password?token=${resetToken}`;
      await this.server.getTransporter().sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Password Reset",
        text: `Reset your password: ${resetUrl}\n\nLink expires in 1 hour.`,
      });
      return { success: true, status: 200, data: {} };
    } catch (error) {
      console.error("Forgot password error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async resetPassword(body: unknown): Promise<ServiceResult> {
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
      const { token, password } = parsed.data;
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
      return { success: true, status: 200, data: {} };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async verifyPasswordResetToken(token: unknown): Promise<ServiceResult> {
    if (!token || typeof token !== "string")
      return { success: false, status: 400, message: "Token is required." };

    try {
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "");
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

      return { success: true, status: 200, data: {} };
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
