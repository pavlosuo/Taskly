import { Request, Response } from "express";
import { MediaService } from "@/modules/media/media.service";
import { IServer } from "@/types";
import fs from "fs";
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

  async upload(req: Request, res: Response) {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file provided." });
    const result = await this.service.upload(req.user, req.file);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  }

  async getAll(req: Request, res: Response) {
    const result = await this.service.getAll(req.user);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  }

  async delete(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.delete(req.user, id);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.json({
      success: true,
      ...(result.data ?? {}),
    });
  }

  async serveFile(req: Request, res: Response) {
    try {
      const user = req.user ?? null;

      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      const result = await this.service.serveFile(id, user);

      if (!result.success) {
        return res.status(result.status).json({
          success: false,
          message: result.message,
        });
      }

      const { filePath: fp, mimeType, fileSize } = result.data!;
      const filePath = path.resolve(fp);
      const range = req.headers.range;

      if (fs.existsSync(filePath) === false) {
        return res.status(404).end();
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader(
        "Cache-Control",
        user ? "private, max-age=3600" : "public, max-age=86400",
      );

      if (!range) {
        res.setHeader("Content-Length", fileSize);
        const stream = fs.createReadStream(filePath);
        stream.on("error", (err) => {
          if (!res.headersSent) {
            res.status(404).end();
          } else {
            res.destroy(err);
          }
        });
        stream.pipe(res);
        return;
      }

      const match = range.match(/^bytes=(\d*)-(\d*)$/);

      if (!match) {
        res.status(416);
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }

      let start: number;
      let end: number;

      if (match[1] === "") {
        const suffixLength = Number(match[2]);
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
      } else {
        start = Number(match[1]);
        end = match[2] === "" ? fileSize - 1 : Number(match[2]);
      }
      if (start < 0 || start >= fileSize || end < start || end >= fileSize) {
        res.status(416);
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Content-Length", chunkSize);
      const stream = fs.createReadStream(filePath, {
        start,
        end,
      });
      stream.on("error", (err) => {
        res.destroy(err);
      });
      stream.pipe(res);
    } catch (error) {
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "general.unknown",
        });
      }
      res.destroy();
    }
  }
}
