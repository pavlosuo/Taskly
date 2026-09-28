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
import { IServer, User } from "@/types";
import nodemailer, { Transporter } from "nodemailer";
import jwt from "jsonwebtoken";
import dns from "node:dns/promises";
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { parseCookieHeader } from "@/utils";

dns.setServers(["1.1.1.1", "1.0.0.1"]);

export class Server implements IServer {
  readonly time = 15 * 60 * 1000;
  readonly port: number;
  private _client: MongoClient | null = null;
  private _dbPromise: Promise<Db> | null = null;
  private _io: SocketIOServer | null = null;
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
    try {
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

  private async getUserFromToken(
    token: string | undefined,
  ): Promise<User | null> {
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, JWT_SECRET || "") as jwt.JwtPayload;
      const db = await this.getDb();
      const user = (await db
        .collection("users")
        .findOneAndUpdate(
          { _id: new ObjectId(decoded.id) },
          { $set: { lastSeenAt: new Date() } },
          { returnDocument: "after" },
        )) as User | null;
      return user;
    } catch (error) {
      console.error("VERIFY ERROR:", error);
      return null;
    }
  }

  async getUserFromCookie(req: Request): Promise<User | null> {
    return this.getUserFromToken(req.cookies?.token);
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

  optionalAuth() {
    return async (req: Request, _: Response, next: NextFunction) => {
      const user = await this.getUserFromCookie(req);
      if (user) req.user = user;
      next();
    };
  }

  requireAdmin() {
    return (req: Request, res: Response, next: NextFunction) => {
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
    db.collection("chats").createIndex({ participants: 1 });
    db.collection("chats").createIndex({ updatedAt: -1 });
    db.collection("messages").createIndex({ chatId: 1, _id: -1 });
    db.collection("users").createIndex({ username: 1 });
    return Promise.resolve();
  }

  emitToUser(userId: ObjectId, event: string, payload: unknown) {
    this.getIO().to(`user:${userId.toString()}`).emit(event, payload);
  }

  getIO(): SocketIOServer {
    if (!this._io) {
      throw new Error(
        "Socket.io server not initialized yet — call initSockets() first.",
      );
    }
    return this._io;
  }

  private initSockets(httpServer: HTTPServer) {
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL,
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
        socket.data.noOnlineStatus = user.settings.checkboxes.noOnlineStatus;
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
      socket.join(`user:${userId}`);

      for (const [_, s] of io.sockets.sockets) {
        if (
          s.data.role !== "admin" &&
          typeof s.data.userId === "string" &&
          !s.data.noOnlineStatus
        ) {
          onlineUserIds.add(s.data.userId);
        }
      }

      socket.emit("presence:initial", { userIds: [...onlineUserIds] });

      if (!isAdmin) {
        socket.broadcast.emit("presence:online", { userId });
      }

      socket.on("chat:join", (chatId: string) => {
        socket.join(`chat:${chatId}`);
      });

      socket.on("chat:leave", (chatId: string) => {
        socket.leave(`chat:${chatId}`);
      });

      socket.on(
        "typing:start",
        ({ chatId, memberId }: { chatId: string; memberId: string }) => {
          socket
            .to(`user:${memberId}`)
            .emit("typing:start", { chatId, userId });
        },
      );

      socket.on(
        "typing:stop",
        ({ chatId, memberId }: { chatId: string; memberId: string }) => {
          socket.to(`user:${memberId}`).emit("typing:stop", { chatId, userId });
        },
      );

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

          if (!isAdmin) {
            io.emit("presence:offline", { userId });
          }
        }
      });
    });

    this._io = io;
  }

  async start() {
    await this.indexesConfig();
    this.initSockets(createApp(this).listen(this.port));
  }
}

new Server(5050).start().catch(console.error);
