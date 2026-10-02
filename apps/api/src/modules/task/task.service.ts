import { ObjectId } from "mongodb";
import { IServer, User, TaskBack } from "@/types";
import { ServiceResult } from "shared/types";
import {
  taskCreateSchema,
  taskUpdateSchema,
  taskResponseCreateSchema,
} from "shared/schemas";
import { normalizeTagList } from "shared/utils";
import { Document } from "mongodb";

export class TaskService {
  constructor(private server: IServer) {}

  async create(user: User, payload: unknown): Promise<ServiceResult> {
    const parsed = taskCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };
    }
    const data = parsed.data;
    try {
      const db = await this.server.getDb();
      const now = new Date();
      const doc: Omit<TaskBack, "_id"> = {
        clientId: user._id,
        title: data.title,
        description: data.description,
        skills: normalizeTagList(data.skills),
        certificates: normalizeTagList(data.certificates),
        budget: data.budget,
        location: {
          address: data.location.address,
          lat: data.location.lat,
          lng: data.location.lng,
        },
        deadline: data.deadline,
        status: "open",
        assignedTaskerId: null,
        responsesCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("tasks").insertOne(doc);
      return {
        success: true,
        status: 201,
        data: { task: { _id: result.insertedId, ...doc } },
      };
    } catch (e) {
      console.error("Create task error:", e);
      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }

  async getAll(query: Record<string, any>, user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(50, Number(query.limit) || 25);
      const filter: Record<string, any> = { status: query.status ?? "open" };

      if (query.skill) {
        const skills = String(query.skill)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (skills.length) filter.skills = { $in: skills };
      }

      if (query.certificate) {
        const certs = String(query.certificate)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (certs.length) filter.certificates = { $in: certs };
      }

      if (query.q) {
        filter.$or = [
          { title: { $regex: query.q, $options: "i" } },
          { description: { $regex: query.q, $options: "i" } },
        ];
      }

      let allItems: Document[] = [];

      if (query.lat && query.lng) {
        const radiusMeters = (Number(query.radiusKm) || 20) * 1000;
        allItems = await db
          .collection("tasks")
          .aggregate([
            {
              $geoNear: {
                near: {
                  type: "Point",
                  coordinates: [Number(query.lng), Number(query.lat)],
                },
                distanceField: "distanceMeters",
                maxDistance: radiusMeters,
                query: filter,
                spherical: true,
              },
            },
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ])
          .toArray();
      } else {
        allItems = await db
          .collection("tasks")
          .find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
      }

      let myItems: Document[] = [];

      if (user.role === "tasker" || user.role === "client") {
        myItems = await db
          .collection("tasks")
          .find(
            user.role === "client"
              ? { clientId: user._id }
              : { assignedTaskerId: user._id },
          )
          .sort({ createdAt: -1 })
          .toArray();
      }

      const total = await db.collection("tasks").countDocuments(filter);

      return {
        success: true,
        status: 200,
        data: { allItems, myItems, page, limit, total },
      };
    } catch (e) {
      console.error("Get tasks error:", e);
      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }

  async getOne(id: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      return { success: true, status: 200, data: { task } };
    } catch (e) {
      console.error("Get task error:", e);
      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }

  async update(
    user: User,
    id: string,
    payload: unknown,
  ): Promise<ServiceResult> {
    const parsed = taskUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };
    }
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.clientId.toString() !== user._id.toString())
        return {
          success: false,
          status: 403,
          message: "task.message.forbidden",
        };
      if (task.status !== "open")
        return {
          success: false,
          status: 409,
          message: "task.message.cannotEditAssigned",
        };

      const data = parsed.data;
      const update: Record<string, any> = { updatedAt: new Date() };
      if (data.title !== undefined) update.title = data.title;
      if (data.description !== undefined) update.description = data.description;
      if (data.skills !== undefined)
        update.skills = normalizeTagList(data.skills);
      if (data.certificates !== undefined)
        update.certificates = normalizeTagList(data.certificates);
      if (data.budget !== undefined) update.budget = data.budget;
      if (data.deadline !== undefined) update.deadline = data.deadline;
      if (data.location !== undefined) {
        update.location = {
          address: data.location.address,
          lat: data.location.lat,
          lng: data.location.lng,
          geo: {
            type: "Point",
            coordinates: [data.location.lng, data.location.lat],
          },
        };
      }

      await db
        .collection("tasks")
        .updateOne({ _id: task._id }, { $set: update });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Update task error:", e);
      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }

  async delete(user: User, id: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.clientId.toString() !== user._id.toString())
        return {
          success: false,
          status: 403,
          message: "task.message.forbidden",
        };
      if (task.status === "assigned")
        return {
          success: false,
          status: 409,
          message: "task.message.cannotDeleteAssigned",
        };

      await db.collection("tasks").deleteOne({ _id: task._id });
      await db.collection("taskResponses").deleteMany({ taskId: task._id });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Delete task error:", e);
      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }

  async cancel(user: User, id: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.clientId.toString() !== user._id.toString())
        return {
          success: false,
          status: 403,
          message: "task.message.forbidden",
        };
      if (task.status === "completed" || task.status === "cancelled")
        return {
          success: false,
          status: 409,
          message: "task.message.cannotCancel",
        };

      await db
        .collection("tasks")
        .updateOne(
          { _id: task._id },
          { $set: { status: "cancelled", updatedAt: new Date() } },
        );
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Cancel task error:", e);
      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }

  async complete(user: User, id: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.clientId.toString() !== user._id.toString())
        return {
          success: false,
          status: 403,
          message: "task.message.forbidden",
        };
      if (task.status !== "assigned")
        return {
          success: false,
          status: 409,
          message: "task.message.cannotComplete",
        };

      await db
        .collection("tasks")
        .updateOne(
          { _id: task._id },
          { $set: { status: "completed", updatedAt: new Date() } },
        );
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Complete task error:", e);
      return {
        success: false,
        status: 500,
        message: "errors.server",
      };
    }
  }
}

export class TaskResponseService {
  constructor(private server: IServer) {}

  async create(
    user: User,
    taskId: string,
    payload: unknown,
  ): Promise<ServiceResult> {
    const parsed = taskResponseCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        status: 400,
        message: "taskResponse.message.invalidData",
      };
    }
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(taskId) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.status !== "open")
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.taskClosed",
        };
      if (task.clientId.toString() === user._id.toString())
        return {
          success: false,
          status: 400,
          message: "taskResponse.message.ownTask",
        };

      const existing = await db.collection("taskResponses").findOne({
        taskId: task._id,
        taskerId: user._id,
      });
      if (existing)
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.alreadyResponded",
        };

      const now = new Date();
      const doc = {
        taskId: task._id,
        clientId: task.clientId,
        taskerId: user._id,
        message: parsed.data.message,
        price: parsed.data.price,
        status: "pending" as const,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("taskResponses").insertOne(doc);
      await db
        .collection("tasks")
        .updateOne({ _id: task._id }, { $inc: { responsesCount: 1 } });

      return {
        success: true,
        status: 201,
        data: { response: { _id: result.insertedId, ...doc } },
      };
    } catch (e) {
      console.error("Create task response error:", e);
      return {
        success: false,
        status: 500,
        message: "taskResponse.message.serverError",
      };
    }
  }

  async getForTask(user: User, taskId: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(taskId) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.clientId.toString() !== user._id.toString()) {
        const items = await db
          .collection("taskResponses")
          .find({ taskId: task._id, taskerId: user._id })
          .sort({ createdAt: -1 })
          .toArray();
        return { success: true, status: 200, data: { items } };
      }
      const items = await db
        .collection("taskResponses")
        .find({ taskId: task._id })
        .sort({ createdAt: -1 })
        .toArray();
      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Get task responses error:", e);
      return {
        success: false,
        status: 500,
        message: "taskResponse.message.serverError",
      };
    }
  }

  async withdraw(
    user: User,
    taskId: string,
    responseId: string,
  ): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const response = await db.collection("taskResponses").findOne({
        _id: new ObjectId(responseId),
        taskId: new ObjectId(taskId),
      });
      if (!response)
        return {
          success: false,
          status: 404,
          message: "taskResponse.message.notFound",
        };
      if (response.taskerId.toString() !== user._id.toString())
        return {
          success: false,
          status: 403,
          message: "taskResponse.message.forbidden",
        };
      if (response.status !== "pending")
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.cannotWithdraw",
        };
      await db
        .collection("tasks")
        .updateOne(
          { _id: new ObjectId(taskId) },
          { $inc: { responsesCount: -1 } },
        );
      await db.collection("taskResponses").deleteOne({ _id: response._id });

      return { success: true, status: 200 };
    } catch (e) {
      console.error("Withdraw task response error:", e);
      return {
        success: false,
        status: 500,
        message: "taskResponse.message.serverError",
      };
    }
  }

  async accept(
    user: User,
    taskId: string,
    responseId: string,
  ): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(taskId) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.clientId.toString() !== user._id.toString())
        return {
          success: false,
          status: 403,
          message: "taskResponse.message.forbidden",
        };
      if (task.status !== "open")
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.taskAlreadyAssigned",
        };

      const response = await db.collection("taskResponses").findOne({
        _id: new ObjectId(responseId),
        taskId: task._id,
      });
      if (!response)
        return {
          success: false,
          status: 404,
          message: "taskResponse.message.notFound",
        };
      if (response.status !== "pending")
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.alreadyProcessed",
        };

      const now = new Date();
      await db
        .collection("taskResponses")
        .updateOne(
          { _id: response._id },
          { $set: { status: "accepted", updatedAt: now } },
        );
      await db
        .collection("taskResponses")
        .updateMany(
          { taskId: task._id, _id: { $ne: response._id }, status: "pending" },
          { $set: { status: "rejected", updatedAt: now } },
        );
      await db.collection("tasks").updateOne(
        { _id: task._id },
        {
          $set: {
            status: "assigned",
            assignedTaskerId: response.taskerId,
            updatedAt: now,
          },
        },
      );

      return { success: true, status: 200 };
    } catch (e) {
      console.error("Accept task response error:", e);
      return {
        success: false,
        status: 500,
        message: "taskResponse.message.serverError",
      };
    }
  }

  async decline(
    user: User,
    taskId: string,
    responseId: string,
  ): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(taskId) });
      if (!task)
        return {
          success: false,
          status: 404,
          message: "task.message.notFound",
        };
      if (task.clientId.toString() !== user._id.toString())
        return {
          success: false,
          status: 403,
          message: "taskResponse.message.forbidden",
        };
      if (task.status !== "open")
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.taskAlreadyAssigned",
        };
      const response = await db.collection("taskResponses").findOne({
        _id: new ObjectId(responseId),
        taskId: task._id,
      });
      if (!response)
        return {
          success: false,
          status: 404,
          message: "taskResponse.message.notFound",
        };
      if (response.status !== "pending")
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.alreadyProcessed",
        };
      const now = new Date();
      await db
        .collection("taskResponses")
        .updateOne(
          { _id: response._id },
          { $set: { status: "rejected", updatedAt: now } },
        );
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Accept task response error:", e);
      return {
        success: false,
        status: 500,
        message: "taskResponse.message.serverError",
      };
    }
  }
}
