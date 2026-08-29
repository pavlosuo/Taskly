import { Router } from "express";
import { IServer } from "@/types";
import { OtpController } from "@/modules/otp/otp.controller";
import { otpLimiter } from "@/utils/limiters";
import { asAuthOptional } from "@/utils";

export function otpRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new OtpController(server);
  router.post(
    "/send",
    server.optionalAuth(),
    otpLimiter,
    asAuthOptional(ctrl.send),
  );
  return router;
}
