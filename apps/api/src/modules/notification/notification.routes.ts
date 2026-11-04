import { Router } from "express";
import { NotificationController } from "@/modules/notification/notification.controller";
import { IServer } from "@/types";

export function notificationRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new NotificationController(server);
  router.get("/", server.requireAuth(), ctrl.list);
  router.patch("/read-all", server.requireAuth(), ctrl.markAllRead);
  router.patch("/:id/read", server.requireAuth(), ctrl.markRead);
  router.delete("/:id", server.requireAuth(), ctrl.remove);
  return router;
}
