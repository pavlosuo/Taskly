import { Router } from "express";
import { IServer } from "@/types";
import { OtpController } from "@/modules/otp/otp.controller";
import { otpLimiter } from "@/utils";

export function otpRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new OtpController(server);
  router.post("/send", server.optionalAuth(), otpLimiter, ctrl.send);
  return router;
}
