import { IServer, User, TaskBack } from "@/types";
import { ObjectId, Document } from "mongodb";
import {
  TASK_STATUSES,
  TASK_SORTS,
  EARTH_RADIUS_M,
  ServiceResult,
  taskCreateSchema,
  taskUpdateSchema,
  taskResponseCreateSchema,
} from "shared/index";
import { normalizeTagList, escapeRegex, splitList, toGeoPoint } from "@/utils";

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
      const geo = toGeoPoint(data.location);
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
        ...(geo && { geo }),
        deadline: data.deadline,
        status: "open",
        assignedTaskerId: null,
        responsesCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("tasks").insertOne(doc);
      const { geo: _geo, ...publicDoc } = doc;
      return {
        success: true,
        status: 201,
        data: { task: { _id: result.insertedId, ...publicDoc } },
      };
    } catch (e) {
      console.error("Create task error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async getAll(query: Record<string, any>, user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const tasks = db.collection("tasks");
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 25));
      const filter: Record<string, any> = {
        status: TASK_STATUSES.includes(query.status) ? query.status : "open",
      };
      const skills = splitList(query.skill);
      if (skills.length) filter["skills.value"] = { $in: skills };
      const certs = splitList(query.certificate);
      if (certs.length) filter["certificates.value"] = { $in: certs };
      const q = String(query.q ?? "")
        .trim()
        .slice(0, 100);
      if (q) {
        const rx = { $regex: escapeRegex(q), $options: "i" };
        filter.$or = [{ title: rx }, { description: rx }];
      }
      const minBudget = Number(query.minBudget);
      const maxBudget = Number(query.maxBudget);
      if (minBudget > 0 || maxBudget > 0) {
        filter["budget.amount"] = {
          ...(minBudget > 0 && { $gte: minBudget }),
          ...(maxBudget > 0 && { $lte: maxBudget }),
        };
      }

      if (String(query.negotiable) === "true") {
        filter["budget.negotiable"] = true;
      }

      const lat = Number(query.lat);
      const lng = Number(query.lng);
      const hasGeo =
        query.lat !== undefined &&
        query.lng !== undefined &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180;
      const radiusMeters =
        Math.min(500, Math.max(1, Number(query.radiusKm) || 20)) * 1000;

      const sortKey =
        query.sort === "distance"
          ? hasGeo
            ? "distance"
            : "newest"
          : TASK_SORTS[query.sort]
            ? query.sort
            : "newest";
      const sort = TASK_SORTS[sortKey];

      let allItems: Document[];
      let total: number;

      if (hasGeo) {
        allItems = await tasks
          .aggregate([
            {
              $geoNear: {
                near: { type: "Point", coordinates: [lng, lat] },
                key: "geo",
                distanceField: "distanceMeters",
                maxDistance: radiusMeters,
                query: filter,
                spherical: true,
              },
            },
            { $sort: sort },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $project: { geo: 0 } },
          ])
          .toArray();

        total = await tasks.countDocuments({
          ...filter,
          geo: {
            $geoWithin: {
              $centerSphere: [[lng, lat], radiusMeters / EARTH_RADIUS_M],
            },
          },
        });
      } else {
        allItems = await tasks
          .find(filter)
          .project({ geo: 0 })
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray();
        total = await tasks.countDocuments(filter);
      }

      let myItems: Document[] = [];
      const includeMine = query.includeMine;

      if (includeMine && user.role === "client") {
        myItems = await tasks
          .find({ clientId: user._id })
          .project({ geo: 0 })
          .sort({ createdAt: -1 })
          .toArray();
      }

      if (includeMine && user.role === "tasker") {
        const [assigned, responses] = await Promise.all([
          tasks
            .find({ assignedTaskerId: user._id })
            .project({ geo: 0 })
            .toArray(),
          db
            .collection("taskResponses")
            .find({ taskerId: user._id })
            .project({ taskId: 1, status: 1, price: 1 })
            .sort({ createdAt: 1 })
            .toArray(),
        ]);

        const responded = responses.length
          ? await tasks
              .find({ _id: { $in: responses.map((r) => r.taskId) } })
              .project({ geo: 0 })
              .toArray()
          : [];

        const myResponses = new Map(
          responses.map((r) => [
            String(r.taskId),
            { status: r.status, price: r.price },
          ]),
        );

        const merged = new Map<string, Document>();
        [...assigned, ...responded].forEach((t) => {
          const id = String(t._id);
          merged.set(id, { ...t, myResponse: myResponses.get(id) });
        });

        myItems = [...merged.values()].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      }

      return {
        success: true,
        status: 200,
        data: { allItems, myItems, page, limit, total },
      };
    } catch (e) {
      console.error("Get tasks error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async getOne(id: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id: new ObjectId(id) }, { projection: { geo: 0 } });
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
        };
      }

      const ops: Document = { $set: update };
      if (data.location !== undefined) {
        const geo = toGeoPoint(data.location);
        if (geo) update.geo = geo;
        else ops.$unset = { geo: "" };
      }

      await db.collection("tasks").updateOne({ _id: task._id }, ops);
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

      const now = new Date();
      await db
        .collection("tasks")
        .updateOne(
          { _id: task._id },
          { $set: { status: "cancelled", updatedAt: now } },
        );

      const rejected = await db
        .collection("taskResponses")
        .updateMany(
          { taskId: task._id, status: "pending" },
          { $set: { status: "rejected", updatedAt: now } },
        );
      if (rejected.modifiedCount > 0) {
        await db
          .collection("tasks")
          .updateOne(
            { _id: task._id },
            { $inc: { responsesCount: -rejected.modifiedCount } },
          );
      }
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
      const assigned = await db.collection("tasks").updateOne(
        { _id: task._id, status: "open" },
        {
          $set: {
            status: "assigned",
            assignedTaskerId: response.taskerId,
            updatedAt: now,
          },
        },
      );
      if (assigned.modifiedCount === 0) {
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.taskAlreadyAssigned",
        };
      }

      await db
        .collection("taskResponses")
        .updateOne(
          { _id: response._id },
          { $set: { status: "accepted", updatedAt: now } },
        );
      const rejected = await db
        .collection("taskResponses")
        .updateMany(
          { taskId: task._id, _id: { $ne: response._id }, status: "pending" },
          { $set: { status: "rejected", updatedAt: now } },
        );
      if (rejected.modifiedCount > 0) {
        await db
          .collection("tasks")
          .updateOne(
            { _id: task._id },
            { $inc: { responsesCount: -rejected.modifiedCount } },
          );
      }

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
      const res = await db
        .collection("taskResponses")
        .updateOne(
          { _id: response._id, status: "pending" },
          { $set: { status: "rejected", updatedAt: now } },
        );
      if (res.modifiedCount === 0) {
        return {
          success: false,
          status: 409,
          message: "taskResponse.message.alreadyProcessed",
        };
      }
      await db
        .collection("tasks")
        .updateOne({ _id: task._id }, { $inc: { responsesCount: -1 } });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Decline task response error:", e);
      return {
        success: false,
        status: 500,
        message: "taskResponse.message.serverError",
      };
    }
  }
}
