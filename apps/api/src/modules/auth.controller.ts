import bcrypt from "bcrypt";
import {
  loginSchema,
  adminRegisterSchema,
  registerSchema,
} from "@shared/index";
import { Request, Response } from "express";
import { IServer, User, Lang, Theme } from "../include/types.ts";

export class AuthController {
  server: IServer;
  constructor(server: IServer) {
    this.server = server;
  }

  async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);
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
        role,
        code,
        fullPhone,
      } = parsed.data;
      const db = await this.server.getDb();
      const users = db.collection("users");
      const existing = await users.findOne({
        $or: [{ email }, { username }, { "profile.fullPhone": fullPhone }],
      });
      if (existing)
        return res
          .status(400)
          .json({ success: false, message: "User already exists.", existing });

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
          avatar: undefined,
        },
        settings: {
          lang: "en" as Lang,
          theme: "light" as Theme,
        },
        passwordHash,
      };
      const result = await users.insertOne(doc);
      const { passwordHash: _, ...userSecure } = {
        _id: result.insertedId,
        ...doc,
      };
      this.server.issueToken(res, { _id: result.insertedId, ...doc });
      return res.json({
        success: true,
        message: "User registered successfully.",
        user: userSecure,
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async registerAdmin(body: {
    email: string;
    password: string;
    username: string;
  }) {
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

  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, message: parsed.error.issues[0].message });

    try {
      const { email, password } = parsed.data;
      console.log(email, password);
      const db = await this.server.getDb();
      const user = (await db
        .collection("users")
        .findOne({ email })) as User | null;
      const isPasswordValid =
        user && (await bcrypt.compare(password, user.passwordHash));
      if (!user || !isPasswordValid)
        return res
          .status(401)
          .json({ success: false, message: "Invalid email or password." });

      this.server.issueToken(res, user);
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

  logout(_: Request, res: Response) {
    res.clearCookie("token", { path: "/" });
    return res.json({ success: true });
  }

  async me(req: Request, res: Response) {
    return res.json({ success: true, user: req.user });
  }
}
