import { NODE_ENV, CLIENT_URL } from "@/env";
import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { Server } from "@/server";
import { globalLimiter } from "@/utils/limiters";
import { authRoutes } from "@/modules/auth/auth.routes";
import { policyRoutes } from "@/modules/policy/policy.routes";
import { usersRoutes } from "@/modules/users/users.routes";
import { otpRoutes } from "@/modules/otp/otp.routes";
import { mediaRoutes } from "@/modules/media/media.routes";
import { skillsRoutes } from "@/modules/skills/skills.routes";
import { certificatesRoutes } from "@/modules/certificates/certificates.routes";

export function createApp(server: Server): Application {
  const app = express();
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(globalLimiter);
  app.use("/api/auth", authRoutes(server));
  app.use("/api/otp", otpRoutes(server));
  app.use("/api/profile", usersRoutes(server));
  app.use("/api/policy", policyRoutes(server));
  app.use("/api/media", mediaRoutes(server));
  app.use("/api/skills", skillsRoutes(server));
  app.use("/api/certificates", certificatesRoutes(server));
  app.post("/api/preferences", (req, res) => {
    const { theme, lang } = req.body;
    const cookieOptions = {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
    };
    if (theme) {
      res.cookie("theme", theme, cookieOptions);
    }
    if (lang) {
      res.cookie("lang", lang, cookieOptions);
    }
    return res.json({
      success: true,
      theme,
      lang,
    });
  });
  app.use((req, res) => {
    const data = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      time: new Date().toISOString(),
    };
    console.log(data);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Server error.",
    });
  });
  return app;
}
