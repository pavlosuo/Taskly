import { Router } from "express";
import { ReviewController } from "@/modules/review/review.controller";
import { IServer } from "@/types";

export function reviewRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new ReviewController(server);
  router.get("/:taskId", server.requireAuth(), ctrl.getForTask);
  router.post("/:taskId", server.requireAuth(), ctrl.create);
  return router;
}
