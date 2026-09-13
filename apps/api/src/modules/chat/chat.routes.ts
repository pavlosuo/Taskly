import { Router } from "express";
import { ChatController } from "./chat.controller";
import { IServer } from "@/types";

export function chatRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new ChatController(server);
  router.post("/", server.requireAuth(), ctrl.create);
  router.get("/", server.requireAuth(), ctrl.getAll);
  router.get("/:id", server.requireAuth(), ctrl.getById);
  router.delete("/:id", server.requireAuth(), ctrl.delete);
  router.get("/:id/messages", server.requireAuth(), ctrl.getMessages);
  router.post("/:id/messages", server.requireAuth(), ctrl.sendMessage);
  router.patch("/:id/messages/read", server.requireAuth(), ctrl.markRead);
  router.patch(
    "/:id/messages/:messageId",
    server.requireAuth(),
    ctrl.editMessage,
  );
  router.delete(
    "/:id/messages/:messageId",
    server.requireAuth(),
    ctrl.deleteMessage,
  );
  router.post(
    "/:id/messages/:messageId/react",
    server.requireAuth(),
    ctrl.manageReaction,
  );
  return router;
}
