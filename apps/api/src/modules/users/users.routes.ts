import { Router } from "express";
import { IServer } from "@shared/types";
import { UsersController } from "@/modules/users/users.controller";
import { asAuth } from "@/utils";

export function usersRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new UsersController(server);
  router.put("/", server.requireAuth(), asAuth(ctrl.updateProfile));
  router.delete("/", server.requireAuth(), asAuth(ctrl.deactivateAccount));
  router.post(
    "/email/request",
    server.requireAuth(),
    asAuth(ctrl.requestEmailChange),
  );
  router.post("/email/confirm", ctrl.confirmEmailChange);
  router.post(
    "/phone/send-otp",
    server.requireAuth(),
    asAuth(ctrl.sendPhoneOtp),
  );
  router.post(
    "/phone/verify-otp",
    server.requireAuth(),
    asAuth(ctrl.verifyPhoneOtp),
  );
  return router;
}
