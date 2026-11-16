import {
  MONGODB_URI,
  JWT_SECRET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  PORT_API,
  CLIENT_URL,
  NEXT_PUBLIC_API_URL,
  CHAT_ID,
  BOT_TOKEN,
} from "@/env";
import { LAST_SEEN_THROTTLE_MS } from "shared/data";
import { MongoClient, ServerApiVersion, ObjectId, Db } from "mongodb";
import { Response, Request, NextFunction } from "express";
import { createApp } from "@/app";
import { IServer, User } from "@/types";
import nodemailer, { Transporter } from "nodemailer";
import jwt from "jsonwebtoken";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { parseCookieHeader, toObjectId, clearCookieOptions } from "@/utils";
import dns from "node:dns/promises";
import axios from "axios";

if (process.env.NODE_ENV !== "production") {
  dns.setServers(["1.1.1.1", "1.0.0.1"]);
}

export class Server implements IServer {
  readonly port: number;
  private _client: MongoClient | null = null;
  private _dbPromise: Promise<Db> | null = null;
  private _io: SocketIOServer | null = null;
  private mailer: Transporter | null = null;
  private authCache = new WeakMap<Request, Promise<User | null>>();

  constructor(port = 5050) {
    this.port = port;
  }

  private async sendToTg(text: string): Promise<void> {
    try {
      await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID,
        text: text,
      });
    } catch (error) {
      console.error(error);
    }
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
    try {
      this.sendToTg(`Email sent to ${to}: ${subject} ${text}`);
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
      this.mailer.sendMail({
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
    this.sendToTg(`SMS to ${phone}: ${text}`);
    return Promise.resolve();
  }

  getClient(): MongoClient {
    if (!this._client) {
      this._client = new MongoClient(MONGODB_URI || "", {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: true,
        },
      });
    }
    return this._client;
  }

  getDb(): Promise<Db> {
    if (!this._dbPromise) {
      this._dbPromise = this.getClient()
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

  getIO(): SocketIOServer {
    if (!this._io) {
      console.error("Socket.io not initialized");
      throw new Error("general.unknown");
    }
    return this._io;
  }

  private async getUserFromToken(
    token: string | undefined,
  ): Promise<User | null> {
    if (!token) return null;
    let decoded: jwt.JwtPayload;

    try {
      const d = jwt.verify(token, JWT_SECRET || "", { algorithms: ["HS256"] });
      if (typeof d === "string") return null;
      decoded = d;
    } catch {
      return null;
    }

    if (
      decoded.typ !== "access" ||
      typeof decoded.id !== "string" ||
      !ObjectId.isValid(decoded.id)
    ) {
      return null;
    }

    try {
      const db = await this.getDb();
      const users = db.collection("users");
      const user = (await users.findOne({
        _id: new ObjectId(decoded.id),
      })) as User | null;
      if (!user || user.deletedAt) return null;
      if (decoded.tv !== (user.tokenVersion ?? 0)) return null;
      const last = user.lastSeenAt ? new Date(user.lastSeenAt).getTime() : 0;
      if (Date.now() - last > LAST_SEEN_THROTTLE_MS) {
        users
          .updateOne({ _id: user._id }, { $set: { lastSeenAt: new Date() } })
          .catch((e) => console.error("lastSeenAt update error:", e));
      }
      return user;
    } catch (error) {
      console.error("AUTH DB ERROR:", error);
      return null;
    }
  }

  private async getUserFromCookie(req: Request): Promise<User | null> {
    let p = this.authCache.get(req);
    if (!p) {
      p = this.getUserFromToken(req.cookies?.token);
      this.authCache.set(req, p);
    }
    return p;
  }

  async revokeSessions(userId: ObjectId): Promise<void> {
    const db = await this.getDb();
    await db
      .collection("users")
      .updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
    this.getIO()?.in(`user:${userId.toString()}`).disconnectSockets(true);
  }

  issueToken(res: Response, user: User): string {
    const token = jwt.sign(
      {
        id: user._id.toString(),
        tv: user.tokenVersion ?? 0,
        typ: "access",
      },
      JWT_SECRET || "",
      { expiresIn: "7d" },
    );
    res.cookie("token", token, {
      ...clearCookieOptions,
      maxAge: 60 * 60 * 24 * 7 * 1000,
    });
    return token;
  }

  setPresenceVisibility(userId: string, hidden: boolean): void {
    const io = this.getIO();
    if (!io) return;
    const room = io.sockets.adapter.rooms.get(`user:${userId}`);
    if (!room || room.size === 0) return;
    let isAdmin = false;
    for (const sid of room) {
      const s = io.sockets.sockets.get(sid);
      if (!s) continue;
      s.data.noOnlineStatus = hidden;
      if (s.data.role === "admin") isAdmin = true;
    }
    if (isAdmin) return;
    io.emit(hidden ? "presence:offline" : "presence:online", { userId });
  }

  requireAuth() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = await this.getUserFromCookie(req);
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "general.unauthorized" });
      req.user = user;
      next();
    };
  }

  optionalAuth() {
    return async (req: Request, _: Response, next: NextFunction) => {
      const user = await this.getUserFromCookie(req);
      if (user) req.user = user;
      next();
    };
  }

  requireAdmin() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = await this.getUserFromCookie(req);
      if (user?.role !== "admin")
        return res
          .status(403)
          .json({ success: false, message: "general.forbidden" });
      req.user = user;
      next();
    };
  }

  requireClient() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = await this.getUserFromCookie(req);
      if (user?.role !== "client")
        return res
          .status(403)
          .json({ success: false, message: "general.forbidden" });
      req.user = user;
      next();
    };
  }

  requireTasker() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = await this.getUserFromCookie(req);
      if (user?.role !== "tasker")
        return res
          .status(403)
          .json({ success: false, message: "general.forbidden" });
      req.user = user;
      next();
    };
  }

  private initSockets(httpServer: HTTPServer) {
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: CLIENT_URL,
        credentials: true,
      },
    });
    io.use(async (socket: Socket, next) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader) return next(new Error("unauthorized"));
        const cookies = parseCookieHeader(cookieHeader);
        const user = await this.getUserFromToken(cookies["token"]);
        if (!user) return next(new Error("unauthorized"));
        socket.data.userId = user._id.toString();
        socket.data.role = user.role;
        socket.data.noOnlineStatus =
          user.settings?.checkboxes?.noOnlineStatus ?? false;
        next();
      } catch (err) {
        console.error("SOCKET AUTH ERROR:", err);
        next(new Error("unauthorized"));
      }
    });
    io.on("connection", (socket: Socket) => {
      const userId = socket.data.userId as string;
      const isAdmin = socket.data.role === "admin";
      const onlineUserIds = new Set<string>();
      for (const [_, s] of io.sockets.sockets) {
        if (
          s.data.role !== "admin" &&
          typeof s.data.userId === "string" &&
          !s.data.noOnlineStatus
        ) {
          onlineUserIds.add(s.data.userId);
        }
      }
      socket.data.chats = new Map<string, string>();
      socket.join(`user:${userId}`);
      socket.emit("presence:initial", { userIds: [...onlineUserIds] });
      if (!isAdmin && !socket.data.noOnlineStatus) {
        socket.broadcast.emit("presence:online", { userId });
      }
      socket.on("chat:join", async (chatId: string) => {
        try {
          const _id = toObjectId(chatId);
          if (!_id) return;
          const me = new ObjectId(userId);
          const db = await this.getDb();
          const chat = await db
            .collection("chats")
            .findOne(
              { _id, participants: me, deletedBy: { $ne: me } },
              { projection: { participants: 1 } },
            );
          if (!chat) return;
          const other = (chat.participants as ObjectId[]).find(
            (p) => !p.equals(me),
          );
          if (!other) return;
          (socket.data.chats as Map<string, string>).set(
            chatId,
            other.toString(),
          );
          socket.join(`chat:${chatId}`);
        } catch (e) {
          console.error("chat:join error:", e);
        }
      });
      socket.on("chat:leave", (chatId: string) => {
        (socket.data.chats as Map<string, string>).delete(chatId);
        socket.leave(`chat:${chatId}`);
      });
      socket.on("typing:start", ({ chatId }: { chatId: string }) => {
        const memberId = (socket.data.chats as Map<string, string>).get(chatId);
        if (!memberId) return;
        socket.to(`user:${memberId}`).emit("typing:start", { chatId, userId });
      });
      socket.on("typing:stop", ({ chatId }: { chatId: string }) => {
        const memberId = (socket.data.chats as Map<string, string>).get(chatId);
        if (!memberId) return;
        socket.to(`user:${memberId}`).emit("typing:stop", { chatId, userId });
      });
      socket.on("disconnect", async () => {
        const room = io.sockets.adapter.rooms.get(`user:${userId}`);
        const stillHasOtherConnections = room && room.size > 0;
        if (!stillHasOtherConnections) {
          try {
            const db = await this.getDb();
            await db
              .collection("users")
              .updateOne(
                { _id: new ObjectId(userId) },
                { $set: { lastSeenAt: new Date() } },
              );
          } catch (e) {
            console.error("Update lastSeenAt on disconnect error:", e);
          }
          if (!isAdmin && !socket.data.noOnlineStatus) {
            io.emit("presence:offline", { userId });
          }
        }
      });
    });
    this._io = io;
  }

  private async indexesConfig() {
    const db = await this.getDb();

    await Promise.all([
      db.collection("skills").createIndex({ label: "text" }),
      db.collection("skills").createIndex({ count: -1 }),
      db.collection("certificates").createIndex({ label: "text" }),
      db.collection("certificates").createIndex({ count: -1 }),

      db.collection("chats").createIndex({ participants: 1 }),
      db.collection("chats").createIndex({ updatedAt: -1 }),
      db.collection("messages").createIndex({ chatId: 1, _id: -1 }),

      db.collection("tasks").createIndex({ geo: "2dsphere" }),
      db.collection("tasks").createIndex({ status: 1, createdAt: -1 }),
      db.collection("tasks").createIndex({ status: 1, deadlineAt: 1 }),
      db.collection("tasks").createIndex({ status: 1, autoConfirmAt: 1 }),
      db.collection("tasks").createIndex({ clientId: 1, createdAt: -1 }),
      db.collection("tasks").createIndex({ assignedTaskerId: 1 }),

      db
        .collection("payments")
        .createIndex(
          { taskId: 1 },
          { unique: true, partialFilterExpression: { status: "held" } },
        ),
      db.collection("payments").createIndex({ clientId: 1, createdAt: -1 }),
      db.collection("payments").createIndex({ taskerId: 1, createdAt: -1 }),

      db
        .collection("reviews")
        .createIndex({ taskId: 1, authorId: 1 }, { unique: true }),
      db.collection("reviews").createIndex({ targetId: 1, authorRole: 1 }),

      db.collection("notifications").createIndex({ userId: 1, createdAt: -1 }),
      db
        .collection("notifications")
        .createIndex(
          { createdAt: 1 },
          { expireAfterSeconds: 60 * 60 * 24 * 30 },
        ),

      db.collection("notifications").createIndex(
        { userId: 1, chatId: 1 },
        {
          unique: true,
          partialFilterExpression: { type: "chat_message", read: false },
          name: "uniq_unread_chat_message",
        },
      ),

      db.collection("users").createIndex(
        { username: 1 },
        {
          unique: true,
          collation: { locale: "en", strength: 2 },
          name: "uniq_username_ci",
        },
      ),

      db.collection("users").createIndex(
        { email: 1 },
        {
          unique: true,
          collation: { locale: "en", strength: 2 },
          name: "uniq_email_ci",
        },
      ),

      db.collection("users").createIndex(
        { "profile.fullPhone": 1 },
        {
          unique: true,
          name: "uniq_full_phone",
          partialFilterExpression: {
            "profile.fullPhone": { $type: "string", $gt: "" },
          },
        },
      ),

      db.collection("chats").createIndex(
        { pairKey: 1 },
        {
          unique: true,
          name: "uniq_chat_pair",
          partialFilterExpression: { pairKey: { $type: "string" } },
        },
      ),

      db.collection("taskResponses").createIndex({ taskerId: 1, createdAt: 1 }),
      db
        .collection("taskResponses")
        .createIndex({ taskId: 1, taskerId: 1 }, { unique: true }),
      db.collection("taskResponses").createIndex({ taskId: 1, status: 1 }),
      db.collection("messages").createIndex({ mediaIds: 1 }),
      db.collection("media").createIndex({ ownerId: 1 }),

      db
        .collection("users")
        .createIndex({ newEmail: 1 }, { sparse: true, name: "idx_new_email" }),
      db
        .collection("users")
        .createIndex(
          { "profile.newFullPhone": 1 },
          { sparse: true, name: "idx_new_full_phone" },
        ),

      db.collection("skills").createIndex(
        { label: 1 },
        {
          unique: true,
          collation: { locale: "en", strength: 2 },
          name: "uniq_skill_label_ci",
        },
      ),
      db.collection("certificates").createIndex(
        { label: 1 },
        {
          unique: true,
          collation: { locale: "en", strength: 2 },
          name: "uniq_certificate_label_ci",
        },
      ),
    ]);
  }

  async start() {
    if (!MONGODB_URI || !JWT_SECRET || !CLIENT_URL || !NEXT_PUBLIC_API_URL) {
      console.error("Missing env variables");
      process.exit(1);
    }
    await this.indexesConfig();
    console.log("MongoDB OK, indexes created");
    const app = createApp(this).listen(this.port, "0.0.0.0", () => {
      console.log(`API listening on ${this.port}`);
    });
    this.initSockets(app);
  }
}

new Server(Number(PORT_API)).start().catch(() => {
  console.error("SERVER ERROR");
  process.exit(1);
});
