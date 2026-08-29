import {
  MONGODB_URI,
  JWT_SECRET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  NODE_ENV,
} from "@/env";
import { MongoClient, ServerApiVersion, ObjectId, Db } from "mongodb";
import { Response, Request, NextFunction } from "express";
import { createApp } from "@/app";
import { IServer, User, AuthRequest } from "@/types";
import nodemailer, { Transporter } from "nodemailer";
import jwt from "jsonwebtoken";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1", "1.0.0.1"]);

export class Server implements IServer {
  readonly time = 15 * 60 * 1000;
  readonly port: number;
  private _client: MongoClient | null = null;
  private _dbPromise: Promise<Db> | null = null;
  public mailer: Transporter | null = null;

  constructor(port = 5050) {
    this.port = port;
  }

  getDb(): Promise<Db> {
    if (!this._dbPromise) {
      this._client = new MongoClient(MONGODB_URI || "", {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        },
      });
      this._dbPromise = this._client
        .connect()
        .then((c) => c.db("app"))
        .catch(async (err) => {
          await this._client?.close().catch(() => {});
          this._client = null;
          this._dbPromise = null;
          return Promise.reject(err);
        });
    }
    return this._dbPromise;
  }

  async sendEmail({
    to,
    subject,
    text,
  }: {
    to: string;
    subject: string;
    text: string;
  }): Promise<void> {
    console.log(`Email sent to ${to}: ${subject} ${text}`);
    if (!this.mailer) {
      const t = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT),
        secure: SMTP_SECURE === "true",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      t.verify().catch((err) => console.error("SMTP error:", err));
      this.mailer = t;
    }
    try {
      await this.mailer.sendMail({
        from: SMTP_USER,
        to,
        subject,
        text,
      });
    } catch (err) {
      console.error("SMTP error:", err);
    }
  }

  async sendSms(phone: string, text: string): Promise<void> {
    console.log(`SMS to ${phone}: ${text}`);
    return Promise.resolve();
  }

  issueToken(res: Response, user: User): string {
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET || "",
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    return token;
  }

  async getUserFromCookie(req: Request): Promise<User | null> {
    const token = req.cookies?.token;
    if (!token) {
      return null;
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET || "") as jwt.JwtPayload;
      const db = await this.getDb();
      const user = (await db.collection("users").findOne({
        _id: new ObjectId(decoded.id),
      })) as User | null;
      return user;
    } catch (error) {
      console.error("VERIFY ERROR:", error);
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
      (req as AuthRequest).user = user;
      next();
    };
  }

  optionalAuth() {
    return async (req: Request, _: Response, next: NextFunction) => {
      const user = await this.getUserFromCookie(req);
      if (user) (req as AuthRequest).user = user;
      next();
    };
  }

  requireAdmin() {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (req?.user?.role !== "admin")
        return res.status(403).json({ success: false, message: "Forbidden." });
      next();
    };
  }

  async indexesConfig() {
    const db = await this.getDb();
    db.collection("skills").createIndex({ label: "text" });
    db.collection("skills").createIndex({ count: -1 });
    db.collection("certificates").createIndex({ label: "text" });
    db.collection("certificates").createIndex({ count: -1 });
    return Promise.resolve();
  }

  async start() {
    await this.getDb();
    await this.indexesConfig();
    const app = createApp(this);
    app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

new Server(5050).start().catch(console.error);
