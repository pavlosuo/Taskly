import { Router } from "express";
import { IServer } from "@/types";
import { AuthController } from "@/modules/auth/auth.controller";
import { asAuth } from "@/utils";
import { authLimiter, otpLimiter } from "@/utils/limiters";

export function authRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new AuthController(server);
  router.post("/register", authLimiter, ctrl.register);
  router.post("/login", authLimiter, ctrl.login);
  router.post("/logout", server.requireAuth(), asAuth(ctrl.logout));
  router.get("/me", server.requireAuth(), asAuth(ctrl.me));
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
