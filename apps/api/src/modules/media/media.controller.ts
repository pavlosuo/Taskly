import { Request, Response } from "express";
import { MediaService } from "@/modules/media/media.service";
import { AuthRequest, IServer } from "@/types";
import path from "path";

export class MediaController {
  private service: MediaService;

  constructor(private server: IServer) {
    this.service = new MediaService(this.server);
    this.upload = this.upload.bind(this);
    this.getAll = this.getAll.bind(this);
    this.delete = this.delete.bind(this);
    this.serveFile = this.serveFile.bind(this);
  }

  async upload(req: AuthRequest, res: Response) {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file provided." });
    const result = await this.service.upload(req.user, req.file);
    return res.status(result.status).json(result);
  }

  async getAll(req: AuthRequest, res: Response) {
    const result = await this.service.getAll(req.user);
    return res.status(result.status).json(result);
  }

  async delete(req: AuthRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.delete(req.user, id);
    return res.status(result.status).json(result);
  }

  async serveFile(req: Request, res: Response) {
    const user = (req as AuthRequest).user ?? null;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.serveFile(id, user);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    const { filePath: fp, mimeType } = result.data!;
    res.setHeader("Content-Type", mimeType);
    res.setHeader(
      "Cache-Control",
      user ? "private, max-age=3600" : "public, max-age=86400",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(path.resolve(fp), (err) => {
      if (err)
        res.status(404).json({ success: false, message: "File not found." });
    });
  }
}
