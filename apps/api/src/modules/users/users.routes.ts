import { Router } from "express";
import { IServer } from "@/types";
import { UsersController } from "@/modules/users/users.controller";
import { searchLimiter, otpLimiter } from "@/utils/limiters";

export function usersRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new UsersController(server);
  router.put("/", server.requireAuth(), ctrl.updateProfile);
  router.delete("/", server.requireAuth(), ctrl.deactivateAccount);
  router.post(
    "/phone/verify-otp",
    server.requireAuth(),
    otpLimiter,
    ctrl.verifyPhoneOtp,
  );
  router.post(
    "/email/verify-otp",
    server.requireAuth(),
    otpLimiter,
    ctrl.verifyEmailOtp,
  );
  router.put("/password", server.requireAuth(), ctrl.changePassword);
  router.get("/search", server.requireAuth(), searchLimiter, ctrl.search);
  router.get(
    "/by-username/:username",
    server.optionalAuth(),
    searchLimiter,
    ctrl.getUserForProfilePage,
  );
  return router;
}
