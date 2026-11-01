import { Request, Response } from "express";
import { ReviewService } from "@/modules/review/review.service";
import { IServer } from "@/types";

export class ReviewController {
  private service: ReviewService;

  constructor(server: IServer) {
    this.service = new ReviewService(server);
    this.create = this.create.bind(this);
    this.getForTask = this.getForTask.bind(this);
  }

  async create(req: Request, res: Response) {
    const taskId = Array.isArray(req.params.taskId)
      ? req.params.taskId[0]
      : req.params.taskId;
    const result = await this.service.create(req.user, taskId, req.body);
    if (!result.success)
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    return res.status(result.status).json({
      success: true,
      ...(result.data ?? {}),
    });
  }

  async getForTask(req: Request, res: Response) {
    const taskId = Array.isArray(req.params.taskId)
      ? req.params.taskId[0]
      : req.params.taskId;
    const result = await this.service.getForTask(req.user, taskId);
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
