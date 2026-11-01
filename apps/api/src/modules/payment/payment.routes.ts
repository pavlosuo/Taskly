import { Router } from "express";
import { PaymentController } from "@/modules/payment/payment.controller";
import { IServer } from "@/types";

export function paymentRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new PaymentController(server);
  router.get("/", server.requireAuth(), ctrl.history);
  return router;
}
