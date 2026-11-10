import { Request, Response } from "express";
import { MediaService } from "@/modules/media/media.service";
import { IServer } from "@/types";

export class MediaController {
  private service: MediaService;

  constructor(private server: IServer) {
    this.service = new MediaService(this.server);
    this.upload = this.upload.bind(this);
    this.getAll = this.getAll.bind(this);
    this.delete = this.delete.bind(this);
    this.serveFile = this.serveFile.bind(this);
  }

  private send(res: Response, result: any) {
    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        status: result.status,
        message: result.message,
      });
    }
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async upload(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: (req as any).fileRejected
          ? "media.typeNotAllowed"
          : "media.noFile",
      });
    }
    return this.send(res, await this.service.upload(req.user, req.file));
  }

  async getAll(req: Request, res: Response) {
    return this.send(res, await this.service.getAll(req.user));
  }

  async delete(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return this.send(res, await this.service.delete(req.user, id));
  }

  async serveFile(req: Request, res: Response) {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const result = await this.service.serveFile(id, req.user ?? null);
      if (!result.success) return this.send(res, result);
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "private, max-age=240");
      return res.redirect(302, result.data!.url);
    } catch {
      return res
        .status(500)
        .json({ success: false, status: 500, message: "general.unknown" });
    }
  }
}
