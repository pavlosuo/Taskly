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
    this.editMessage = this.editMessage.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
    this.manageReaction = this.manageReaction.bind(this);
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

  async editMessage(req: Request, res: Response) {
    const id = req.params.id as string;
    const messageId = req.params.messageId as string;
    const result = await this.service.editMessage(
      req.user,
      id,
      messageId,
      req.body.text,
    );
    return res.status(result.status).json(result);
  }

  async deleteMessage(req: Request, res: Response) {
    const id = req.params.id as string;
    const messageId = req.params.messageId as string;
    const result = await this.service.deleteMessage(req.user, id, messageId);
    return res.status(result.status).json(result);
  }

  async manageReaction(req: Request, res: Response) {
    const id = req.params.id as string;
    const messageId = req.params.messageId as string;
    const reaction = req.body.reaction as string;
    const result = await this.service.manageReaction(
      req.user,
      id,
      messageId,
      reaction,
    );
    return res.status(result.status).json(result);
  }
}
