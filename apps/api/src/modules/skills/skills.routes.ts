import { Router } from "express";
import { SkillsController } from "@/modules/skills/skills.controller";
import { IServer } from "@/types";
import { searchLimiter, tagCreateLimiter } from "@/utils";

export function skillsRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new SkillsController(server);
  router.get("/", server.requireAuth(), searchLimiter, ctrl.search);
  router.post("/", server.requireAuth(), tagCreateLimiter, ctrl.upsert);
  return router;
}
