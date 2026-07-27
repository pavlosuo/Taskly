import { Router } from "express";
import { MediaController } from "./media.controller";
import { upload } from "@/utils";
import { IServer } from "@/types";

export function mediaRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new MediaController(server);
  router.post("/", server.requireAuth(), upload.single("file"), (req, res) =>
    ctrl.upload(req as any, res),
  );
  router.get("/", server.requireAuth(), (req, res) =>
    ctrl.getAll(req as any, res),
  );
  router.delete("/:id", server.requireAuth(), (req, res) =>
    ctrl.delete(req as any, res),
  );
  router.get("/:id/file", server.requireAuth(), (req, res) =>
    ctrl.serveFile(req as any, res),
  );
  return router;
}
