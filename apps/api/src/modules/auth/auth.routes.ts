import { Router } from "express";
import { IServer } from "@shared/types";
import { AuthController } from "@/modules/auth/auth.controller";
import { authLimiter, asAuth } from "@/utils";

export function authRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new AuthController(server);
  router.post("/register", authLimiter, ctrl.register);
  router.post("/login", authLimiter, ctrl.login);
  router.post("/logout", ctrl.logout);
  router.get("/me", server.requireAuth(), ctrl.me);
  router.post("/otp/send", server.requireAuth(), asAuth(ctrl.sendOtp));
  router.post("/otp/verify", server.requireAuth(), asAuth(ctrl.verifyOtp));
  router.post("/otp/send-reset", authLimiter, ctrl.sendResetOtp);
  router.post("/otp/verify-reset", authLimiter, ctrl.verifyResetOtp);
  router.post("/reset-email", authLimiter, ctrl.forgotPassword);
  router.post("/reset-password", authLimiter, ctrl.resetPassword);
  router.post("/verify-reset-token", authLimiter, ctrl.verifyResetToken);
  return router;
}
