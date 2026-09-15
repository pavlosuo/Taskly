import { Request, Response } from "express";
import { CertificatesService } from "@/modules/certificates/certificates.service";
import { IServer } from "@/types";

export class CertificatesController {
  private service: CertificatesService;

  constructor(server: IServer) {
    this.service = new CertificatesService(server);
    this.search = this.search.bind(this);
    this.upsert = this.upsert.bind(this);
  }

  async search(req: Request, res: Response) {
    const q = (req.query.q as string) ?? "";
    const result = await this.service.search(q);
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

  async upsert(req: Request, res: Response) {
    const { label, description } = req.body;
    const result = await this.service.upsert(label, description);
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
}
