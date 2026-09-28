import { Request, Response } from "express";
import { GeocodingService } from "@/modules/geocoding/geocoding.service";

export class GeocodingController {
  private service: GeocodingService;

  constructor() {
    this.service = new GeocodingService();
  }

  searchAddress = async (req: Request, res: Response) => {
    const result = await this.service.searchAddress(req.query.q as string);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };

  reverseGeocode = async (req: Request, res: Response) => {
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);
    const result = await this.service.reverseGeocode(lat, lng);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  };
}
