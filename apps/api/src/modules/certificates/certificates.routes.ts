import { Router } from "express";
import { CertificatesController } from "@/modules/certificates/certificates.controller";
import { IServer } from "@/types";
import { searchLimiter, tagCreateLimiter } from "@/utils";

export function certificatesRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new CertificatesController(server);
  router.get("/", server.requireAuth(), searchLimiter, ctrl.search);
  router.post("/", server.requireAuth(), tagCreateLimiter, ctrl.upsert);
  return router;
}
