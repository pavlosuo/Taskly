import { Request, Response } from "express";
import { SkillsService } from "@/modules/skills/skills.service";
import { IServer } from "@/types";

export class SkillsController {
  private service: SkillsService;

  constructor(server: IServer) {
    this.service = new SkillsService(server);
    this.search = this.search.bind(this);
    this.upsert = this.upsert.bind(this);
  }

  async search(req: Request, res: Response) {
    const q = (req.query.q as string) ?? "";
    const result = await this.service.search(q);
    return res.status(result.status).json(result);
  }

  async upsert(req: Request, res: Response) {
    const { label } = req.body;
    const result = await this.service.upsert(label);
    return res.status(result.status).json(result);
  }
}
