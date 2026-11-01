import { Request, Response } from "express";
import { NotificationService } from "@/modules/notification/notification.service";
import { IServer } from "@/types";

export class NotificationController {
  private service: NotificationService;

  constructor(server: IServer) {
    this.service = new NotificationService(server);
    this.list = this.list.bind(this);
    this.markRead = this.markRead.bind(this);
    this.markAllRead = this.markAllRead.bind(this);
  }

  async list(req: Request, res: Response) {
    const result = await this.service.list(req.user, req.query);
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

  async markRead(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.markRead(req.user, id);
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

  async markAllRead(req: Request, res: Response) {
    const result = await this.service.markAllRead(req.user);
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
