import { Router } from "express";
import {
  TaskController,
  TaskResponseController,
} from "@/modules/task/task.controller";
import { IServer } from "@/types";

export function taskRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new TaskController(server);
  const responseCtrl = new TaskResponseController(server);
  router.post("/", server.requireAuth(), ctrl.create);
  router.get("/", server.optionalAuth(), ctrl.getAll);
  router.get("/:id", server.optionalAuth(), ctrl.getOne);
  router.patch("/:id", server.requireAuth(), ctrl.update);
  router.delete("/:id", server.requireAuth(), ctrl.delete);
  router.post("/:id/cancel", server.requireAuth(), ctrl.cancel);
  router.post("/:id/complete", server.requireAuth(), ctrl.complete);
  router.post("/:id/responses", server.requireAuth(), responseCtrl.create);
  router.get("/:id/responses", server.requireAuth(), responseCtrl.getForTask);
  router.post(
    "/:id/responses/:responseId/accept",
    server.requireAuth(),
    responseCtrl.accept,
  );
  router.post(
    "/:id/responses/:responseId/decline",
    server.requireAuth(),
    responseCtrl.decline,
  );
  router.delete(
    "/:id/responses/:responseId",
    server.requireAuth(),
    responseCtrl.withdraw,
  );
  return router;
}
