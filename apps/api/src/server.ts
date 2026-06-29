import env from "dotenv";
env.config();
import express, { Request, Response, Application, NextFunction } from "express";
import { MongoClient, ServerApiVersion, ObjectId, Db } from "mongodb";
import { User } from "./include/types.ts";
import jwt from "jsonwebtoken";
import nodemailer, { Transporter } from "nodemailer";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { authLimiter, globalLimiter } from "./include/limiters.ts";
import { AuthController } from "./modules/auth.controller.js";
import { OtpController } from "./modules/otp.controller.js";
import { PasswordController } from "./modules/password.controller.js";
import { ProfileController } from "./modules/profile.controller.js";
import { EmailController } from "./modules/email.controller.js";
import { PhoneController } from "./modules/phone.controller.js";
import { PolicyController } from "./modules/policy.controller.js";
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

export class Server {
  time: number;
  nodemailer: Transporter | null;
  app: Application;
  port: number;
  _client: MongoClient | null;
  _dbPromise: Promise<Db> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  smsSender: any;

  constructor(PORT: number | undefined) {
    this.time = 15 * 60 * 1000;
    this.nodemailer = null;
    this.app = express();
    this.port = PORT || 5050;
    this._client = null;
    this._dbPromise = null;
    this.smsSender = null;
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

  getDb(): Promise<Db> {
    if (!this._dbPromise) {
      this._client = new MongoClient(process.env.MONGODB_URI || "", {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      });
      this._dbPromise = this._client
        .connect()
        .then((c: MongoClient) => c.db("app"))
        .catch(async (err) => {
          await this._client?.close().catch(() => {});
          this._dbPromise = null;
          this._client = null;
          return Promise.reject(err);
        });
    }
    return this._dbPromise;
  }

  getTransporter(): Transporter {
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

  issueToken(res: Response, user: User): string {
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || "",
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

  async getUserFromCookie(req: Request): Promise<User | null> {
    const token = req.cookies?.token;
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
      if (!decoded || typeof decoded !== "object") return null;
      const db = await this.getDb();
      const user = (await db
        .collection("users")
        .findOne(
          { _id: new ObjectId(decoded.id) },
          { projection: { passwordHash: 0 } },
        )) as User | null;
      return user ?? null;
    } catch {
      return null;
    }
  }

  requireAuth() {
    return async (req: Request, res: Response, next: NextFunction) => {
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
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req?.user?.role !== "admin")
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized." });
      next();
    };
  }

  initRoutes() {
    const auth = new AuthController(this);
    console.log(auth)
    const otp = new OtpController(this);
    const password = new PasswordController(this);
    const profile = new ProfileController(this);
    const email = new EmailController(this);
    const phone = new PhoneController(this);
    const policy = new PolicyController(this);

    this.app.post("/api/auth/register", authLimiter, auth.register.bind(auth));
    this.app.post("/api/auth/login", authLimiter, auth.login.bind(auth));
    this.app.post("/api/auth/logout", auth.logout.bind(auth));
    this.app.get("/api/auth/me", this.requireAuth(), auth.me.bind(auth));

    this.app.post(
      "/api/auth/otp/send",
      this.requireAuth(),
      otp.sendOtp.bind(otp),
    );
    this.app.post(
      "/api/auth/otp/verify",
      this.requireAuth(),
      otp.verifyOtp.bind(otp),
    );
    this.app.post(
      "/api/auth/otp/send-reset",
      authLimiter,
      otp.sendResetOtp.bind(otp),
    );
    this.app.post(
      "/api/auth/otp/verify-reset",
      authLimiter,
      otp.verifyResetOtp.bind(otp),
    );

    this.app.post(
      "/api/auth/reset-email",
      authLimiter,
      password.forgotPassword.bind(password),
    );
    this.app.post(
      "/api/auth/reset-password",
      authLimiter,
      password.resetPassword.bind(password),
    );
    this.app.post(
      "/api/auth/verify-reset-token",
      authLimiter,
      password.verifyResetToken.bind(password),
    );

    this.app.put(
      "/api/profile",
      this.requireAuth(),
      profile.updateProfile.bind(profile),
    );
    this.app.delete(
      "/api/profile",
      this.requireAuth(),
      profile.deactivateAccount.bind(profile),
    );

    this.app.post(
      "/api/profile/email/request",
      this.requireAuth(),
      email.requestEmailChange.bind(email),
    );
    this.app.post(
      "/api/profile/email/confirm",
      email.confirmEmailChange.bind(email),
    );

    this.app.post(
      "/api/profile/phone/send-otp",
      this.requireAuth(),
      phone.sendPhoneOtp.bind(phone),
    );
    this.app.post(
      "/api/profile/phone/verify-otp",
      this.requireAuth(),
      phone.verifyPhoneOtp.bind(phone),
    );

    this.app.get("/api/policy", policy.getPolicy.bind(policy));
    this.app.put(
      "/api/policy",
      this.requireAuth(),
      this.requireAdmin(),
      policy.updatePolicy.bind(policy),
    );
  }

  async start() {
    this.initRoutes();
    try {
      await this.getDb();
      const auth = new AuthController(this);
      await auth.registerAdmin({
        email: process.env.ADMIN_EMAIL || "",
        password: process.env.ADMIN_PASSWORD || "",
        username: process.env.ADMIN_USERNAME || "admin",
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
