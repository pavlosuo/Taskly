import { Request, Response } from "express";
import { ChatService } from "@/modules/chat/chat.service";
import { IServer } from "@/types";

export class ChatController {
  private service: ChatService;

  constructor(private server: IServer) {
    this.service = new ChatService(this.server);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.delete = this.delete.bind(this);
    this.getMessages = this.getMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.markRead = this.markRead.bind(this);
  }

  async create(req: Request, res: Response) {
    const result = await this.service.createChat(req.user, req.body);
    return res.status(result.status).json(result);
  }

  async getAll(req: Request, res: Response) {
    const result = await this.service.getAll(req.user);
    return res.status(result.status).json(result);
  }

  async getById(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.getById(req.user, id);
    return res.status(result.status).json(result);
  }

  async delete(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.deleteChat(req.user, id);
    return res.status(result.status).json(result);
  }

  async getMessages(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const before =
      typeof req.query.before === "string" ? req.query.before : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await this.service.getMessages(req.user, id, before, limit);
    return res.status(result.status).json(result);
  }

  async sendMessage(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.sendMessage(req.user, id, req.body);
    return res.status(result.status).json(result);
  }

  async markRead(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.markRead(req.user, id);
    return res.status(result.status).json(result);
  }
}
