import { Response } from "express";
import { MediaService } from "@/modules/media/media.service";
import { AuthRequest, IServer } from "@/types";
import path from "path";

export class MediaController {
  private service: MediaService;

  constructor(private server: IServer) {
    this.service = new MediaService(this.server);
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
    const result = await this.service.delete(req.user, req.params.id);
    return res.status(result.status).json(result);
  }

  async serveFile(req: AuthRequest, res: Response) {
    const result = await this.service.serveFile(req.user, req.params.id);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    const { filePath, mimeType } = result.data!;
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        res.status(404).json({ success: false, message: "File not found." });
      }
    });
  }
}
