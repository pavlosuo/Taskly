import { Router } from "express";
import { IServer } from "@/types";
import { UsersController } from "@/modules/users/users.controller";
import { searchLimiter } from "@/utils/limiters";

export function usersRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new UsersController(server);
  router.put("/", server.requireAuth(), ctrl.updateProfile);
  router.delete("/", server.requireAuth(), ctrl.deactivateAccount);
  router.post("/phone/verify-otp", server.requireAuth(), ctrl.verifyPhoneOtp);
  router.post("/email/verify-otp", server.requireAuth(), ctrl.verifyEmailOtp);
  router.put("/password", server.requireAuth(), ctrl.changePassword);
  router.post(
    "/get-user-for-profile-page",
    server.optionalAuth(),
    ctrl.getUserForProfilePage,
  );
  router.get("/search", server.requireAuth(), searchLimiter, ctrl.search);
  return router;
}
