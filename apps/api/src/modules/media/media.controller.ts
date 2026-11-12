import { Request, Response } from "express";
import { MediaService } from "@/modules/media/media.service";
import { IServer } from "@/types";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import path from "path";

export class MediaController {
  private service: MediaService;

  constructor(private server: IServer) {
    this.service = new MediaService(this.server);
    this.upload = this.upload.bind(this);
    this.getAll = this.getAll.bind(this);
    this.delete = this.delete.bind(this);
    this.handleServe = this.handleServe.bind(this);
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
        message: "media.noFile",
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

  async handleServe(req: Request, res: Response, retry = true): Promise<void> {
    try {
      const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const result = await this.service.serveFile(id, req.user ?? null);
      if (!result.success) return void this.send(res, result);
      const file = result.data!;
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Cache-Control", "private, max-age=240");
      if (file.kind === "local") {
        res.setHeader("Content-Type", file.mimeType);
        res.setHeader("Content-Disposition", file.disposition);
        return res.sendFile(
          path.basename(file.path),
          {
            root: path.dirname(file.path),
            dotfiles: "allow",
            cacheControl: false,
          },
          (err: any) => {
            if (!err || res.headersSent) return;
            if (err.code === "ENOENT" && retry)
              return void this.handleServe(req, res, false);
            res.status(err.code === "ENOENT" ? 404 : 500).json({
              success: false,
              status: err.code === "ENOENT" ? 404 : 500,
              message: "general.unknown",
            });
          },
        );
      }
      const headers: Record<string, string> = {};
      for (const h of [
        "range",
        "if-range",
        "if-none-match",
        "if-modified-since",
      ]) {
        const v = req.headers[h];
        if (typeof v === "string") headers[h] = v;
      }
      const ac = new AbortController();
      res.on("close", () => ac.abort());
      const upstream = await fetch(file.url, { headers, signal: ac.signal });
      if (upstream.status === 304) return void res.status(304).end();
      if (upstream.status === 404 && retry)
        return void this.handleServe(req, res, false);
      if (!upstream.ok && upstream.status !== 416) {
        const status = upstream.status === 404 ? 404 : 502;
        return void res
          .status(status)
          .json({ success: false, status, message: "general.unknown" });
      }
      res.status(upstream.status);
      for (const h of [
        "content-type",
        "content-length",
        "content-range",
        "accept-ranges",
        "content-disposition",
        "etag",
        "last-modified",
      ]) {
        const v = upstream.headers.get(h);
        if (v) res.setHeader(h, v);
      }
      if (!upstream.body) return void res.end();
      await pipeline(Readable.fromWeb(upstream.body as any), res);
    } catch (e: any) {
      if (e?.name === "AbortError" || res.headersSent) return;
      res
        .status(500)
        .json({ success: false, status: 500, message: "general.unknown" });
    }
  }

  async serveFile(req: Request, res: Response): Promise<void> {
    return this.handleServe(req, res, true);
  }
}
