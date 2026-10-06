import { Router } from "express";
import { IServer } from "@/types";
import { PolicyController } from "@/modules/policy/policy.controller";

export function policyRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new PolicyController(server);
  router.get("/", ctrl.getPolicy);
  router.put("/", server.requireAdmin(), ctrl.updatePolicy);
  return router;
}
