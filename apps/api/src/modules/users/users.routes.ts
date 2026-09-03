import { Router } from "express";
import { IServer } from "@/types";
import { UsersController } from "@/modules/users/users.controller";
import { asAuth, asAuthOptional } from "@/utils";

export function usersRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new UsersController(server);
  router.put("/", server.requireAuth(), asAuth(ctrl.updateProfile));
  router.delete("/", server.requireAuth(), asAuth(ctrl.deactivateAccount));
  router.post(
    "/phone/verify-otp",
    server.requireAuth(),
    asAuth(ctrl.verifyPhoneOtp),
  );
  router.post(
    "/email/verify-otp",
    server.requireAuth(),
    asAuth(ctrl.verifyEmailOtp),
  );
  router.put("/password", server.requireAuth(), asAuth(ctrl.changePassword));
  router.post(
    "/get-user-by-username",
    server.optionalAuth(),
    asAuthOptional(ctrl.getUserByUsername),
  );
  return router;
}
