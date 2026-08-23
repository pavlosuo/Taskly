import { Router } from "express";
import { MediaController } from "./media.controller";
import { upload, asAuth } from "@/utils";
import { IServer } from "@/types";

export function mediaRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new MediaController(server);
  router.post(
    "/",
    server.requireAuth(),
    upload.single("file"),
    asAuth(ctrl.upload),
  );
  router.get("/", server.requireAuth(), asAuth(ctrl.getAll));
  router.delete("/:id", server.requireAuth(), asAuth(ctrl.delete));
  router.get("/:id/file", server.optionalAuth(), ctrl.serveFile);
  return router;
}
