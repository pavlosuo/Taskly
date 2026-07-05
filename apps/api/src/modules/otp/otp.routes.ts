import { Router } from "express";
import { IServer } from "@shared/types";
import { OtpController } from "@/modules/otp/otp.controller";
import { otpLimiter } from "@/utils/limiters";

export function otpRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new OtpController(server);
  router.post("/send", otpLimiter, ctrl.send);
  return router;
}
