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
  router.post("/", server.requireClient(), ctrl.create);
  router.get("/", server.requireAuth(), ctrl.getAll);
  router.get("/:id", server.requireAuth(), ctrl.getOne);
  router.patch("/:id", server.requireClient(), ctrl.update);
  router.delete("/:id", server.requireClient(), ctrl.delete);
  router.post("/:id/cancel", server.requireClient(), ctrl.cancel);
  router.post("/:id/complete", server.requireClient(), ctrl.complete);
  router.post("/:id/responses", server.requireTasker(), responseCtrl.create);
  router.get("/:id/responses", server.requireAuth(), responseCtrl.getForTask);
  router.post(
    "/:id/responses/:responseId/accept",
    server.requireClient(),
    responseCtrl.accept,
  );
  router.post(
    "/:id/responses/:responseId/decline",
    server.requireClient(),
    responseCtrl.decline,
  );
  router.delete(
    "/:id/responses/:responseId",
    server.requireTasker(),
    responseCtrl.withdraw,
  );
  router.patch("/:id/done", server.requireAuth(), ctrl.markDone);
  router.patch("/:id/abandon", server.requireAuth(), ctrl.abandon);
  return router;
}
