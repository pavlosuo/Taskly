import { Router } from "express";
import { SkillsController } from "@/modules/skills/skills.controller";
import { IServer } from "@/types";
import rateLimit from "express-rate-limit";

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export function skillsRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new SkillsController(server);
  router.get("/", server.requireAuth(), searchLimiter, ctrl.search);
  router.post("/", server.requireAuth(), ctrl.upsert);
  return router;
}
