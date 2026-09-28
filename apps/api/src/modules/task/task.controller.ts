import { Request, Response } from "express";
import { TaskService, TaskResponseService } from "@/modules/task/task.service";
import { IServer } from "@/types";

export class TaskController {
  private service: TaskService;

  constructor(private server: IServer) {
    this.service = new TaskService(this.server);
    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getOne = this.getOne.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.cancel = this.cancel.bind(this);
    this.complete = this.complete.bind(this);
  }

  async create(req: Request, res: Response) {
    const result = await this.service.create(req.user, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async getAll(req: Request, res: Response) {
    const user = req.user;
    const result = await this.service.getAll(req.query, user);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async getOne(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.getOne(id);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async update(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.update(req.user, id, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async delete(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.delete(req.user, id);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async cancel(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.cancel(req.user, id);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async complete(req: Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await this.service.complete(req.user, id);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }
}

export class TaskResponseController {
  private service: TaskResponseService;

  constructor(private server: IServer) {
    this.service = new TaskResponseService(this.server);
    this.create = this.create.bind(this);
    this.getForTask = this.getForTask.bind(this);
    this.withdraw = this.withdraw.bind(this);
    this.accept = this.accept.bind(this);
  }

  async create(req: Request, res: Response) {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const result = await this.service.create(req.user, taskId, req.body);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async getForTask(req: Request, res: Response) {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const result = await this.service.getForTask(req.user, taskId);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async withdraw(req: Request, res: Response) {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const responseId = Array.isArray(req.params.responseId)
      ? req.params.responseId[0]
      : req.params.responseId;
    const result = await this.service.withdraw(req.user, taskId, responseId);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async accept(req: Request, res: Response) {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const responseId = Array.isArray(req.params.responseId)
      ? req.params.responseId[0]
      : req.params.responseId;
    const result = await this.service.accept(req.user, taskId, responseId);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }

  async decline(req: Request, res: Response) {
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const responseId = Array.isArray(req.params.responseId)
      ? req.params.responseId[0]
      : req.params.responseId;
    const result = await this.service.decline(req.user, taskId, responseId);
    if (!result.success)
      return res
        .status(result.status)
        .json({ success: false, message: result.message });
    return res.json({ success: true, ...(result.data ?? {}) });
  }
}
