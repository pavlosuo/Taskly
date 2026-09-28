import { Router } from "express";
import { IServer } from "@/types";
import { GeocodingController } from "@/modules/geocoding/geocoding.controller";

export function geocodingRoutes(server: IServer): Router {
  const router = Router();
  const ctrl = new GeocodingController();
  router.post("/search", server.requireAuth(), ctrl.searchAddress);
  router.post("/reverse", server.requireAuth(), ctrl.reverseGeocode);
  return router;
}
