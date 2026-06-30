import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { Server } from "@/server";
import { globalLimiter } from "@/utils";
import { authRoutes } from "@/modules/auth/auth.routes";
import { policyRoutes } from "@/modules/policy/policy.routes";
import { usersRoutes } from "@/modules/users/users.routes";

export function createApp(server: Server): Application {
  const app = express();
  app.use(helmet());
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(globalLimiter);
  app.use("/api/auth", authRoutes(server));
  app.use("/api/profile", usersRoutes(server));
  app.use("/api/policy", policyRoutes(server));
  return app;
}
