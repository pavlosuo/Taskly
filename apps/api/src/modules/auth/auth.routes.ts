import { Router } from "express";
import { IServer } from "@/types";
import { AuthController } from "@/modules/auth/auth.controller";
import {
  authLimiter,
  otpLimiter,
  authLimiterIp,
  registerLimiter,
} from "@/utils/limiters";

export function authRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new AuthController(server);
  router.post("/register", authLimiter, registerLimiter, ctrl.register);
  router.post("/login", authLimiter, authLimiterIp, ctrl.login);
  router.post("/logout", server.requireAuth(), ctrl.logout);
  router.get("/me", server.optionalAuth(), ctrl.me);
  router.post(
    "/otp/verify-password-reset",
    otpLimiter,
    ctrl.verifyPasswordResetOtp,
  );
  router.post(
    "/password-reset/send-link",
    otpLimiter,
    ctrl.sendPasswordResetLink,
  );
  router.post(
    "/password-reset/verify-token",
    otpLimiter,
    ctrl.verifyPasswordResetToken,
  );
  router.post("/password-reset/confirm", otpLimiter, ctrl.resetPassword);
  return router;
}
