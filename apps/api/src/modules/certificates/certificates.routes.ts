import { Router } from "express";
import { CertificatesController } from "@/modules/certificates/certificates.controller";
import { IServer } from "@/types";
import { searchLimiter } from "@/utils/limiters";

export function certificatesRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new CertificatesController(server);
  router.get("/", server.requireAuth(), searchLimiter, ctrl.search);
  router.post("/", server.requireAuth(), ctrl.upsert);
  return router;
}
