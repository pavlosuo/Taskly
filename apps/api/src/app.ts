import { CLIENT_URL } from "@/env";
import { cookieOptions } from "@/utils";
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
import { chatRoutes } from "@/modules/chat/chat.routes";
import { taskRoutes } from "@/modules/task/task.routes";
import { notificationRoutes } from "@/modules/notification/notification.routes";
import { reviewRoutes } from "@/modules/review/review.routes";
import { paymentRoutes } from "@/modules/payment/payment.routes";
import { settingsSchema } from "shared/index";

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
  app.use("/api/users", usersRoutes(server));
  app.use("/api/policy", policyRoutes(server));
  app.use("/api/media", mediaRoutes(server));
  app.use("/api/skills", skillsRoutes(server));
  app.use("/api/certificates", certificatesRoutes(server));
  app.use("/api/chats", chatRoutes(server));
  app.use("/api/tasks", taskRoutes(server));
  app.use("/api/notifications", notificationRoutes(server));
  app.use("/api/reviews", reviewRoutes(server));
  app.use("/api/payments", paymentRoutes(server));
  app.post("/api/preferences", (req, res) => {
    try {
      const parsed = settingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        });
      }
      const { theme, lang } = parsed.data;
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
    } catch {
      return res.status(500).json({
        success: false,
        status: 500,
        message: "general.unknown",
      });
    }
  });
  app.use((_, res) => {
    res.status(404).json({
      success: false,
      message: "general.unknown",
    });
  });
  return app;
}
