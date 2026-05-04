import env from "dotenv";
env.config();

import fs from "fs";
import path from "path";
import express from "express";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import {
  loginSchema,
  adminRegisterSchema,
  taskerRegisterSchema,
  resetPasswordSchema,
  otpVerifySchema,
  sendResetOtpSchema,
  verifyResetOtpSchema,
  forgotPasswordEmailSchema,
} from "./include/schemas.js";
import { authLimiter, globalLimiter } from "./include/limiters.js";
import {
  getClientIp,
  getDeviceInfo,
  uploadAgreementLocally,
  hashToken,
  generateOtp,
  safeEqual,
  upload,
} from "./include/utils.js";

import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

export class Server {
  constructor(PORT) {
    this.time = 15 * 60 * 1000;

    this.nodemailer = null;
    this.app = express();
    this.app.set("trust proxy", true);
    this.port = PORT || 5050;
    this._client = null;
    this._dbPromise = null;

    this.app.use(helmet());
    this.app.use(express.json());
    this.app.use(cookieParser());
    this.app.use(
      cors({
        origin: process.env.CLIENT_URL || "http://localhost:3000/",
        credentials: true,
      }),
    );
    this.app.use(globalLimiter);
  }

  getDb() {
    if (!this._dbPromise) {
      this._client = new MongoClient(process.env.MONGODB_URI, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
      this._dbPromise = this._client
        .connect()
        .then((c) => c.db("app"))
        .catch(async (err) => {
          await this._client?.close().catch(() => {});
          this._dbPromise = null;
          this._client = null;
          return Promise.reject(err);
        });
    }
    return this._dbPromise;
  }

  getTransporter() {
    if (this.nodemailer) return this.nodemailer;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    transporter.verify().catch((err) => {
      console.error("SMTP configuration error:", err);
    });
    this.nodemailer = transporter;
    return this.nodemailer;
  }

  requireAuth() {
    return async (req, res, next) => {
      const user = await this.getUserFromCookie(req);
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      req.user = user;
      next();
    };
  }

  requireAdmin() {
    return async (req, res, next) => {
      if (req?.user?.role !== "admin")
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      next();
    };
  }

  initRoutes() {
    this.app.post(
      "/api/auth/register/tasker",
      authLimiter,
      upload.single("agreementFile"),
      this.registerTasker.bind(this),
    );
    this.app.post("/api/auth/login", authLimiter, this.login.bind(this));
    this.app.post("/api/auth/logout", this.logout.bind(this));
    this.app.get("/api/auth/me", this.requireAuth(), this.me.bind(this));
    this.app.post(
      "/api/auth/otp/send-reset",
      authLimiter,
      this.sendResetOtp.bind(this),
    );
    this.app.post(
      "/api/auth/otp/verify-reset",
      authLimiter,
      this.verifyResetOtp.bind(this),
    );
    this.app.post(
      "/api/auth/reset-email",
      authLimiter,
      this.forgotPassword.bind(this),
    );
    this.app.post(
      "/api/auth/reset-password",
      authLimiter,
      this.resetPassword.bind(this),
    );
    this.app.post(
      "/api/auth/verify-reset-token",
      authLimiter,
      this.verifyResetToken.bind(this),
    );
    this.app.post(
      "/api/auth/otp/send",
      this.requireAuth(),
      this.sendOtp.bind(this),
    );
    this.app.post(
      "/api/auth/otp/verify",
      this.requireAuth(),
      this.verifyOtp.bind(this),
    );
    this.app.get("/api/policy", this.getPolicy.bind(this));
    this.app.put(
      "/api/policy",
      this.requireAuth(),
      this.requireAdmin(),
      this.updatePolicy.bind(this),
    );
    this.app.get(
      "/api/agreement/pdf",
      this.requireAuth(),
      this.getPdf.bind(this),
    );
  }

  async getUserFromCookie(req) {
    const token = req.cookies?.token;
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const db = await this.getDb();
      const user = await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(decoded.id) },
          { projection: { passwordHash: 0 } },
        );
      return user ?? null;
    } catch {
      return null;
    }
  }

  issueToken(res, user) {
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    return token;
  }

  async me(req, res) {
    return res.json({ success: true, user: req.user });
  }

  async getPdf(req, res) {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      if (!user.agreement?.pdfKey) {
        return res
          .status(404)
          .json({ success: false, message: "PDF not found" });
      }

      const filePath = path.join(
        process.cwd(),
        "uploads",
        user.agreement.pdfKey,
      );

      if (!fs.existsSync(filePath)) {
        return res
          .status(404)
          .json({ success: false, message: "File missing" });
      }
      const filename = `${user.profile.fullName}-agreement.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
      );
      res.setHeader("Cache-Control", "no-store");
      const stream = fs.createReadStream(filePath);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        res.sendStatus(500);
      });
      stream.pipe(res);
    } catch (err) {
      console.error("getPdf error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { email, password } = parsed.data;
      const db = await this.getDb();
      const user = await db.collection("users").findOne({ email });
      const isPasswordValid =
        user && (await bcrypt.compare(password, user.passwordHash));
      if (!user || !isPasswordValid)
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password." });

      this.issueToken(res, user);
      const { passwordHash: _, ...loggedUser } = user;
      return res.json({
        success: true,
        message: "Login successful.",
        user: loggedUser,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  logout(_, res) {
    res.clearCookie("token", { path: "/" });
    return res.json({ success: true });
  }

  async registerAdmin(body) {
    const parsed = adminRegisterSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    try {
      const { email, password, username } = parsed.data;
      const db = await this.getDb();
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
      const user = { _id: result.insertedId, ...doc };
      return {
        success: true,
        message: "Admin registered successfully.",
        user: { username: user.username, role: user.role },
      };
    } catch (error) {
      console.error("Register admin error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async registerTasker(req, res) {
    let body = {
      ...req.body,
    };
    try {
      body = {
        ...body,
        agreementAccepted: body.agreementAccepted === "true",
      };
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid data format." });
    }
    const parsed = taskerRegisterSchema.safeParse(body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const {
        email,
        password,
        username,
        fullName,
        phone,
        HETU,
        agreementAccepted,
      } = parsed.data;
      const db = await this.getDb();
      const users = db.collection("users");
      const existing = await users.findOne({
        $or: [{ email }, { username }, { HETU }, { phone }],
      });

      if (existing)
        return res
          .status(400)
          .json({ success: false, message: "User already exists.", existing });

      let agreement = null;
      if (req.file) {
        const ip = getClientIp(req);
        const userAgent = getDeviceInfo(req);
        const tempName = `agreement-${Date.now()}-${Buffer.from(email).toString("hex").slice(0, 8)}.pdf`;
        try {
          const { key } = await uploadAgreementLocally(
            req.file.buffer,
            tempName,
          );
          agreement = {
            pdfKey: key,
            acceptedAt: new Date(),
            ip,
            userAgent,
            agreementAccepted,
          };
        } catch (uploadErr) {
          console.error("Agreement PDF upload failed:", uploadErr.message);
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const doc = {
        email,
        username,
        passwordHash,
        role: "tasker",
        profile: {
          fullName,
          phone,
          HETU,
          verified: false,
        },
        agreement,
        createdAt: new Date(),
      };

      const result = await users.insertOne(doc);
      const { passwordHash: _, ...userSecure } = {
        _id: result.insertedId,
        ...doc,
      };
      this.issueToken(res, { _id: result.insertedId, ...doc });
      return res.json({
        success: true,
        message: "Tasker registered successfully.",
        user: userSecure,
      });
    } catch (error) {
      console.error("Register tasker error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async sendOtp(req, res) {
    try {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + this.time);
      const db = await this.getDb();
      await db
        .collection("users")
        .updateOne(
          { _id: req.user._id },
          { $set: { otp: { code: otp, expiresAt } } },
        );
      await this.getTransporter().sendMail({
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

  async verifyOtp(req, res) {
    const parsed = otpVerifySchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { otp } = parsed.data;
      const db = await this.getDb();
      const user = await db.collection("users").findOne({ _id: req.user._id });
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
          { $unset: { otp: "" }, $set: { emailVerified: true } },
        );
      return res.json({ success: true, message: "OTP verified." });
    } catch (error) {
      console.error("Verify OTP error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async sendResetOtp(req, res) {
    const parsed = sendResetOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { phone } = parsed.data;
      const db = await this.getDb();
      const user = await db
        .collection("users")
        .findOne({ "profile.phone": phone });
      if (!user)
        return res.json({
          success: true,
          message: "Code sent if phone exists.",
        });

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + this.time);
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

  async verifyResetOtp(req, res) {
    const parsed = verifyResetOtpSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { phone, otp } = parsed.data;
      const db = await this.getDb();
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
        process.env.JWT_SECRET,
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

  async resetPassword(req, res) {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { token, password } = parsed.data;
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token." });
      }

      const db = await this.getDb();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.id),
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token." });

      const passwordHash = await bcrypt.hash(password, 10);
      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { passwordHash }, $unset: { resetTokenHash: "" } },
        );
      return res.json({
        success: true,
        message: "Password reset successfully.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async forgotPassword(req, res) {
    const parsed = forgotPasswordEmailSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { email } = parsed.data;
      const db = await this.getDb();
      const user = await db.collection("users").findOne({ email });
      if (!user)
        return res.json({
          success: true,
          message: "If this email exists, a reset link has been sent.",
        });

      const resetToken = jwt.sign(
        { id: user._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      await db
        .collection("users")
        .updateOne(
          { _id: user._id },
          { $set: { resetTokenHash: hashToken(resetToken) } },
        );

      const resetUrl = `${process.env.CLIENT_URL}/forgot-password?token=${resetToken}`;
      await this.getTransporter().sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Password Reset",
        text: `Reset your password: ${resetUrl}\n\nLink expires in 1 hour.`,
      });
      return res.json({
        success: true,
        message: "If this email exists, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async verifyResetToken(req, res) {
    const { token } = req.body;
    if (!token)
      return res.status(400).json({
        success: false,
        message: "Token is required.",
        reason: "invalid",
      });

    try {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        const reason = e.name === "TokenExpiredError" ? "expired" : "invalid";
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token.",
          reason,
        });
      }

      const db = await this.getDb();
      const user = await db.collection("users").findOne({
        _id: new ObjectId(decoded.id),
        resetTokenHash: hashToken(token),
      });
      if (!user)
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token.",
          reason: "invalid",
        });

      return res.json({ success: true });
    } catch (error) {
      console.error("Verify reset token error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error.", reason: "error" });
    }
  }

  async getPolicy(_, res) {
    try {
      const db = await this.getDb();
      const doc = await db.collection("settings").findOne({ key: "policy" });
      if (!doc)
        return res.json({
          success: true,
          data: { policyTitle: "", policyContent: "" },
        });
      return res.json({ success: true, data: doc.data });
    } catch (e) {
      console.error("getPolicy error:", e);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async updatePolicy(req, res) {
    try {
      const { policyTitle, policyContent } = req.body;
      if (typeof policyTitle !== "string" || typeof policyContent !== "string")
        return res
          .status(400)
          .json({ success: false, message: "Invalid data." });

      const db = await this.getDb();
      await db.collection("settings").updateOne(
        { key: "policy" },
        {
          $set: {
            data: { policyTitle, policyContent },
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
      return res.json({ success: true, message: "Policy updated." });
    } catch (e) {
      console.error("updatePolicy error:", e);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async start() {
    this.initRoutes();
    try {
      await this.getDb();
      await this.registerAdmin({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        username: process.env.ADMIN_USERNAME,
      });
    } catch (err) {
      console.error("DB init error:", err);
    }
    await this.listen();
  }

  listen() {
    return new Promise((resolve, reject) => {
      this.app
        .listen(this.port, () => {
          console.log(`Server running on port ${this.port}`);
          resolve(true);
        })
        .on("error", reject);
    });
  }
}

const server = new Server(5050);
server.start();
export default server.app;
