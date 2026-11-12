import { Router } from "express";
import { MediaController } from "@/modules/media/media.controller";
import { upload, uploadLimiter } from "@/utils";
import { IServer } from "@/types";

export function mediaRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new MediaController(server);
  router.post(
    "/",
    server.requireAuth(),
    uploadLimiter,
    upload.single("file"),
    ctrl.upload,
  );
  router.get("/", server.requireAuth(), ctrl.getAll);
  router.delete("/:id", server.requireAuth(), ctrl.delete);
  router.get("/:id/file", server.optionalAuth(), ctrl.serveFile);
  router.get("/:id/poster", server.optionalAuth(), ctrl.servePoster);
  return router;
}
