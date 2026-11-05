import { IServer, User, TaskBack, NotificationInputBack } from "@/types";
import { ObjectId, Document } from "mongodb";
import {
  TASK_SORTS,
  EARTH_RADIUS_M,
  AUTO_CONFIRM_DAYS,
  DAY_MS,
  TASK_JOB_BATCH_SIZE,
  ServiceResult,
  taskCreateSchema,
  taskUpdateSchema,
  taskResponseCreateSchema,
} from "shared/index";
import {
  normalizeTagList,
  escapeRegex,
  splitList,
  toGeoPoint,
  toObjectId,
  toDeadlineAt,
} from "@/utils";
import { PaymentService } from "@/modules/payment/payment.service";
import { NotificationService } from "@/modules/notification/notification.service";

export class TaskService {
  private payments: PaymentService;
  private notifications: NotificationService;

  constructor(private server: IServer) {
    this.payments = new PaymentService(server);
    this.notifications = new NotificationService(server);
    this.startJobs().catch((e) => {
      console.error("Scheduled jobs error:", e);
    });
  }

  async create(user: User, payload: unknown): Promise<ServiceResult> {
    if (user.role !== "client") {
      return { success: false, status: 403, message: "general.forbidden" };
    }
    const parsed = taskCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };
    }
    const data = parsed.data;
    const deadlineAt = toDeadlineAt(data.deadline);
    if (deadlineAt && deadlineAt.getTime() < Date.now()) {
      return { success: false, status: 400, message: "task.date.past" };
    }
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
        ...(deadlineAt && { deadlineAt }),
        status: "open",
        assignedTaskerId: null,
        responsesCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("tasks").insertOne(doc);
      const { geo: _geo, deadlineAt: _deadlineAt, ...publicDoc } = doc;
      return {
        success: true,
        status: 201,
        data: { task: { _id: result.insertedId, ...publicDoc } },
      };
    } catch (e) {
      console.error("Create task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async getAll(query: Record<string, any>, user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const tasks = db.collection("tasks");
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 25));
      const filter: Record<string, any> = { status: "open" };
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
      const includeMine =
        String(query.includeMine) === "true" || query.includeMine === "1";

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
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async getOne(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    try {
      const db = await this.server.getDb();
      const task = await db
        .collection("tasks")
        .findOne({ _id }, { projection: { geo: 0 } });
      if (!task) {
        return { success: false, status: 404, message: "task.notFound" };
      }
      if (task.status !== "open") {
        const isParty =
          task.clientId.equals(user._id) ||
          task.assignedTaskerId?.equals(user._id);
        if (!isParty) {
          const responded = await db
            .collection("taskResponses")
            .findOne(
              { taskId: task._id, taskerId: user._id },
              { projection: { _id: 1 } },
            );
          if (!responded) {
            return { success: false, status: 404, message: "task.notFound" };
          }
        }
      }
      return { success: true, status: 200, data: { task } };
    } catch (e) {
      console.error("Get task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async update(
    user: User,
    id: string,
    payload: unknown,
  ): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "task.notFound" };
    }
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
      const task = await db.collection("tasks").findOne({ _id });
      if (!task) {
        return { success: false, status: 404, message: "task.notFound" };
      }
      if (!task.clientId.equals(user._id)) {
        return { success: false, status: 403, message: "general.forbidden" };
      }
      if (task.status !== "open") {
        return {
          success: false,
          status: 409,
          message: "task.cannotEditAssigned",
        };
      }
      const data = parsed.data;
      const update: Record<string, any> = { updatedAt: new Date() };
      if (data.title !== undefined) update.title = data.title;
      if (data.description !== undefined) update.description = data.description;
      if (data.skills !== undefined)
        update.skills = normalizeTagList(data.skills);
      if (data.certificates !== undefined)
        update.certificates = normalizeTagList(data.certificates);
      if (data.budget !== undefined) update.budget = data.budget;
      if (data.deadline !== undefined) {
        const deadlineAt = toDeadlineAt(data.deadline);
        if (deadlineAt && deadlineAt.getTime() < Date.now()) {
          return { success: false, status: 400, message: "task.date.past" };
        }
        update.deadline = data.deadline;
        update.deadlineAt = deadlineAt;
      }
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
      const res = await db
        .collection("tasks")
        .updateOne({ _id: task._id, status: "open" }, ops);
      if (res.matchedCount === 0) {
        return {
          success: false,
          status: 409,
          message: "task.cannotEditAssigned",
        };
      }
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Update task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async delete(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await session.withTransaction(async () => {
        const task = await db.collection("tasks").findOne({ _id }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (!task.clientId.equals(user._id))
          throw { status: 403, message: "general.forbidden" };
        const deletable =
          task.status === "open" ||
          task.status === "expired" ||
          (task.status === "cancelled" && !task.assignedTaskerId);
        if (!deletable) throw { status: 409, message: "task.cannotDelete" };
        const res = await db
          .collection("tasks")
          .deleteOne({ _id: task._id, status: task.status }, { session });
        if (res.deletedCount === 0)
          throw { status: 409, message: "task.cannotDelete" };
        await db
          .collection("taskResponses")
          .deleteMany({ taskId: task._id }, { session });
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Delete task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  async cancel(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    return this.cancelTask(_id, user);
  }

  async complete(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    return this.completeTask(_id, user);
  }

  async markDone(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await this.notifications.transaction(session, async (notify) => {
        const tasks = db.collection("tasks");
        const task = await tasks.findOne({ _id }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (task.assignedTaskerId?.toString() !== user._id.toString())
          throw { status: 403, message: "general.forbidden" };
        if (task.status !== "assigned")
          throw { status: 409, message: "task.cannotMarkDone" };

        const now = new Date();
        const res = await tasks.updateOne(
          { _id: task._id, status: "assigned" },
          {
            $set: {
              status: "pending_confirmation",
              doneAt: now,
              updatedAt: now,
              autoConfirmAt: new Date(
                now.getTime() + AUTO_CONFIRM_DAYS * DAY_MS,
              ),
            },
          },
          { session },
        );
        if (res.modifiedCount === 0)
          throw { status: 409, message: "task.cannotMarkDone" };

        await notify([
          {
            userId: task.clientId,
            type: "task_done",
            taskId: task._id,
            data: { taskTitle: task.title, days: AUTO_CONFIRM_DAYS },
          },
        ]);
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Mark task done error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  async abandon(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await this.notifications.transaction(session, async (notify) => {
        const task = await db.collection("tasks").findOne({ _id }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (task.assignedTaskerId?.toString() !== user._id.toString())
          throw { status: 403, message: "general.forbidden" };
        if (task.status !== "assigned")
          throw { status: 409, message: "task.cannotAbandon" };
        const now = new Date();
        const res = await db.collection("tasks").updateOne(
          { _id: task._id, status: "assigned", assignedTaskerId: user._id },
          {
            $set: { status: "open", assignedTaskerId: null, updatedAt: now },
            $inc: { responsesCount: -1 },
          },
          { session },
        );
        if (res.modifiedCount === 0)
          throw { status: 409, message: "task.cannotAbandon" };

        await db
          .collection("taskResponses")
          .updateOne(
            { taskId: task._id, taskerId: user._id, status: "accepted" },
            { $set: { status: "withdrawn_after_accept", updatedAt: now } },
            { session },
          );
        await this.payments.refund(session, task._id);

        await notify([
          {
            userId: task.clientId,
            type: "task_abandoned",
            taskId: task._id,
            data: { taskTitle: task.title },
          },
        ]);
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Abandon task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  private async completeTask(
    _id: ObjectId,
    user: User | null,
  ): Promise<ServiceResult> {
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await this.notifications.transaction(session, async (notify) => {
        const tasks = db.collection("tasks");
        const task = await tasks.findOne({ _id }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (user && task.clientId.toString() !== user._id.toString())
          throw { status: 403, message: "general.forbidden" };
        const allowed = user
          ? ["assigned", "pending_confirmation"]
          : ["pending_confirmation"];
        if (!allowed.includes(task.status))
          throw { status: 409, message: "task.cannotComplete" };
        const now = new Date();
        const res = await tasks.updateOne(
          { _id: task._id, status: { $in: allowed } },
          {
            $set: {
              status: "completed",
              completionType: user ? "client" : "auto",
              completedAt: now,
              updatedAt: now,
            },
          },
          { session },
        );
        if (res.modifiedCount === 0)
          throw { status: 409, message: "task.cannotComplete" };
        await this.payments.release(session, task._id);
        const data = { taskTitle: task.title };
        const notices: NotificationInputBack[] = [
          {
            userId: task.assignedTaskerId,
            type: user ? "task_completed" : "task_auto_completed",
            taskId: task._id,
            data,
          },
        ];
        if (!user) {
          notices.push({
            userId: task.clientId,
            type: "task_auto_completed",
            taskId: task._id,
            data,
          });
        }

        await notify(notices);
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Complete task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  private async cancelTask(
    _id: ObjectId,
    user: User | null,
  ): Promise<ServiceResult> {
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await this.notifications.transaction(session, async (notify) => {
        const tasks = db.collection("tasks");
        const responses = db.collection("taskResponses");
        const task = await tasks.findOne({ _id }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (user && task.clientId.toString() !== user._id.toString())
          throw { status: 403, message: "general.forbidden" };
        const allowed = user ? ["open", "assigned"] : ["assigned"];
        if (!allowed.includes(task.status))
          throw { status: 409, message: "task.cannotCancel" };

        const now = new Date();
        const pending = await responses
          .find(
            { taskId: task._id, status: "pending" },
            { session, projection: { taskerId: 1 } },
          )
          .toArray();
        const rejected = await responses.updateMany(
          { taskId: task._id, status: "pending" },
          { $set: { status: "rejected", updatedAt: now } },
          { session },
        );
        const res = await tasks.updateOne(
          { _id: task._id, status: { $in: allowed } },
          {
            $set: {
              status: "cancelled",
              cancelReason: user ? "client" : "overdue",
              updatedAt: now,
            },
            $inc: { responsesCount: -rejected.modifiedCount },
          },
          { session },
        );
        if (res.modifiedCount === 0)
          throw { status: 409, message: "task.cannotCancel" };

        const wasAssigned = task.status === "assigned";
        if (wasAssigned) await this.payments.refund(session, task._id);
        const data = { taskTitle: task.title };
        const notices: NotificationInputBack[] = pending.map((r) => ({
          userId: r.taskerId,
          type: "response_rejected",
          taskId: task._id,
          data,
        }));
        if (wasAssigned) {
          notices.push({
            userId: task.assignedTaskerId,
            type: user ? "task_cancelled" : "task_overdue",
            taskId: task._id,
            data,
          });
        }
        if (!user) {
          notices.push({
            userId: task.clientId,
            type: "task_overdue",
            taskId: task._id,
            data,
          });
        }
        await notify(notices);
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Cancel task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  private async expireTask(_id: ObjectId): Promise<ServiceResult> {
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await this.notifications.transaction(session, async (notify) => {
        const tasks = db.collection("tasks");
        const responses = db.collection("taskResponses");
        const task = await tasks.findOne({ _id }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (task.status !== "open")
          throw { status: 409, message: "task.cannotExpire" };

        const now = new Date();
        const pending = await responses
          .find(
            { taskId: task._id, status: "pending" },
            { session, projection: { taskerId: 1 } },
          )
          .toArray();
        const rejected = await responses.updateMany(
          { taskId: task._id, status: "pending" },
          { $set: { status: "rejected", updatedAt: now } },
          { session },
        );
        const res = await tasks.updateOne(
          { _id: task._id, status: "open" },
          {
            $set: { status: "expired", updatedAt: now },
            $inc: { responsesCount: -rejected.modifiedCount },
          },
          { session },
        );
        if (res.modifiedCount === 0)
          throw { status: 409, message: "task.cannotExpire" };

        const data = { taskTitle: task.title };
        const notices: NotificationInputBack[] = pending.map((r) => ({
          userId: r.taskerId,
          type: "response_rejected",
          taskId: task._id,
          data,
        }));
        notices.push({
          userId: task.clientId,
          type: "task_expired",
          taskId: task._id,
          data,
        });

        await notify(notices);
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Expire task error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  async runScheduled(): Promise<void> {
    const db = await this.server.getDb();
    const tasks = db.collection("tasks");
    const now = Date.now();

    const jobs: [Document, (id: ObjectId) => Promise<ServiceResult>][] = [
      [
        {
          status: "pending_confirmation",
          autoConfirmAt: { $lte: new Date(now) },
        },
        (id) => this.completeTask(id, null),
      ],
      [
        { status: "assigned", deadlineAt: { $lte: new Date(now) } },
        (id) => this.cancelTask(id, null),
      ],
      [
        { status: "open", deadlineAt: { $lte: new Date(now) } },
        (id) => this.expireTask(id),
      ],
    ];

    for (const [filter, run] of jobs) {
      const due = await tasks
        .find(filter, { projection: { _id: 1 } })
        .limit(TASK_JOB_BATCH_SIZE)
        .toArray();
      for (const task of due) {
        const res = await run(task._id);
        if (!res.success && res.status !== 409) {
          console.error(
            "Scheduled job failed:",
            task._id.toString(),
            res.message,
          );
        }
      }
    }
  }

  async startJobs() {
    let running = false;
    const tick = async () => {
      if (running) return;
      running = true;
      try {
        await this.runScheduled();
      } catch (e) {
        console.error("Scheduled jobs error:", e);
      } finally {
        running = false;
      }
    };
    tick();
    return setInterval(tick, 60_000);
  }
}

export class TaskResponseService {
  private payments: PaymentService;
  private notifications: NotificationService;

  constructor(private server: IServer) {
    this.payments = new PaymentService(server);
    this.notifications = new NotificationService(server);
  }

  async create(
    user: User,
    taskId: string,
    payload: unknown,
  ): Promise<ServiceResult> {
    if (user.role !== "tasker") {
      return { success: false, status: 403, message: "general.forbidden" };
    }
    const _taskId = toObjectId(taskId);
    if (!_taskId) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    const parsed = taskResponseCreateSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };
    }
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      let response: Document | null = null;
      await this.notifications.transaction(session, async (notify) => {
        const task = await db
          .collection("tasks")
          .findOne({ _id: _taskId }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (task.status !== "open")
          throw { status: 409, message: "taskResponse.taskClosed" };
        if (task.clientId.toString() === user._id.toString())
          throw { status: 400, message: "taskResponse.ownTask" };

        const existing = await db
          .collection("taskResponses")
          .findOne({ taskId: task._id, taskerId: user._id }, { session });
        if (existing)
          throw { status: 409, message: "taskResponse.alreadyResponded" };

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
        const result = await db
          .collection("taskResponses")
          .insertOne(doc, { session });
        const bumped = await db
          .collection("tasks")
          .updateOne(
            { _id: task._id, status: "open" },
            { $inc: { responsesCount: 1 } },
            { session },
          );
        if (bumped.modifiedCount === 0)
          throw { status: 409, message: "taskResponse.taskClosed" };

        await notify([
          {
            userId: task.clientId,
            type: "response_new",
            taskId: task._id,
            data: { taskTitle: task.title, price: parsed.data.price },
          },
        ]);

        response = { _id: result.insertedId, ...doc };
      });
      return { success: true, status: 201, data: { response } };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      if (e?.code === 11000) {
        return {
          success: false,
          status: 409,
          message: "taskResponse.alreadyResponded",
        };
      }
      console.error("Create task response error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  async getForTask(user: User, taskId: string): Promise<ServiceResult> {
    const _taskId = toObjectId(taskId);
    if (!_taskId) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    try {
      const db = await this.server.getDb();
      const task = await db.collection("tasks").findOne({ _id: _taskId });
      if (!task) {
        return { success: false, status: 404, message: "task.notFound" };
      }

      const filter = task.clientId.equals(user._id)
        ? { taskId: task._id }
        : { taskId: task._id, taskerId: user._id };

      const taskResponses = await db
        .collection("taskResponses")
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();

      const taskerIds = [
        ...new Set(taskResponses.map((r) => r.taskerId.toString())),
      ].map((id) => new ObjectId(id));

      const [users, ratings, completed] = taskerIds.length
        ? await Promise.all([
            db
              .collection("users")
              .find({ _id: { $in: taskerIds } })
              .toArray(),
            db
              .collection("reviews")
              .aggregate([
                {
                  $match: {
                    targetId: { $in: taskerIds },
                    authorRole: "client",
                  },
                },
                {
                  $group: {
                    _id: "$targetId",
                    avg: { $avg: "$rating" },
                    count: { $sum: 1 },
                  },
                },
              ])
              .toArray(),
            db
              .collection("tasks")
              .aggregate([
                {
                  $match: {
                    assignedTaskerId: { $in: taskerIds },
                    status: "completed",
                  },
                },
                { $group: { _id: "$assignedTaskerId", count: { $sum: 1 } } },
              ])
              .toArray(),
          ])
        : [[], [], []];

      const usersById = new Map(users.map((u) => [u._id.toString(), u]));
      const ratingsById = new Map(ratings.map((r) => [r._id.toString(), r]));
      const completedById = new Map(
        completed.map((c) => [c._id.toString(), c.count]),
      );

      const items = taskResponses.map((r) => {
        const u = usersById.get(r.taskerId.toString());
        const rating = ratingsById.get(r.taskerId.toString());
        return {
          ...r,
          tasker: {
            username: u?.username,
            avatar: u?.profile?.avatar,
            initials: u?.profile?.initials,
            publicLink: u?.settings?.checkboxes?.privateProfile
              ? null
              : u?.publicLink,
            completedCount: completedById.get(r.taskerId.toString()) ?? 0,
            rating: rating
              ? {
                  avg: Math.round(rating.avg * 10) / 10,
                  count: rating.count,
                }
              : null,
          },
        };
      });

      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Get task responses error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async withdraw(
    user: User,
    taskId: string,
    responseId: string,
  ): Promise<ServiceResult> {
    const _taskId = toObjectId(taskId);
    const _responseId = toObjectId(responseId);
    if (!_taskId || !_responseId) {
      return { success: false, status: 404, message: "taskResponse.notFound" };
    }
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await session.withTransaction(async () => {
        const response = await db
          .collection("taskResponses")
          .findOne({ _id: _responseId, taskId: _taskId }, { session });
        if (!response) throw { status: 404, message: "taskResponse.notFound" };
        if (response.taskerId.toString() !== user._id.toString())
          throw { status: 403, message: "general.forbidden" };
        if (response.status !== "pending")
          throw { status: 409, message: "taskResponse.cannotWithdraw" };

        const res = await db
          .collection("taskResponses")
          .deleteOne({ _id: response._id, status: "pending" }, { session });
        if (res.deletedCount === 0)
          throw { status: 409, message: "taskResponse.cannotWithdraw" };
        await db
          .collection("tasks")
          .updateOne(
            { _id: _taskId },
            { $inc: { responsesCount: -1 } },
            { session },
          );
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Withdraw task response error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  async accept(
    user: User,
    taskId: string,
    responseId: string,
  ): Promise<ServiceResult> {
    const _taskId = toObjectId(taskId);
    if (!_taskId) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    const _responseId = toObjectId(responseId);
    if (!_responseId) {
      return { success: false, status: 404, message: "taskResponse.notFound" };
    }
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await this.notifications.transaction(session, async (notify) => {
        const tasks = db.collection("tasks");
        const responses = db.collection("taskResponses");
        const task = await tasks.findOne({ _id: _taskId }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (task.clientId.toString() !== user._id.toString())
          throw { status: 403, message: "general.forbidden" };
        if (task.status !== "open")
          throw { status: 409, message: "taskResponse.taskAlreadyAssigned" };

        const response = await responses.findOne(
          { _id: _responseId, taskId: task._id },
          { session },
        );
        if (!response) throw { status: 404, message: "taskResponse.notFound" };
        if (response.status !== "pending")
          throw { status: 409, message: "taskResponse.alreadyProcessed" };

        const now = new Date();
        const accepted = await responses.updateOne(
          { _id: response._id, status: "pending" },
          { $set: { status: "accepted", updatedAt: now } },
          { session },
        );
        if (accepted.modifiedCount === 0)
          throw { status: 409, message: "taskResponse.alreadyProcessed" };

        const others = await responses
          .find(
            {
              taskId: task._id,
              _id: { $ne: response._id },
              status: "pending",
            },
            { session, projection: { taskerId: 1 } },
          )
          .toArray();
        const rejected = await responses.updateMany(
          { taskId: task._id, _id: { $ne: response._id }, status: "pending" },
          { $set: { status: "rejected", updatedAt: now } },
          { session },
        );

        const assigned = await tasks.updateOne(
          { _id: task._id, status: "open" },
          {
            $set: {
              status: "assigned",
              assignedTaskerId: response.taskerId,
              updatedAt: now,
            },
            $inc: { responsesCount: -rejected.modifiedCount },
          },
          { session },
        );
        if (assigned.modifiedCount === 0)
          throw { status: 409, message: "taskResponse.taskAlreadyAssigned" };

        await this.payments.hold(session, {
          taskId: task._id,
          clientId: task.clientId,
          taskerId: response.taskerId,
          amount: response.price,
        });

        const data = { taskTitle: task.title };
        const notices: NotificationInputBack[] = [
          {
            userId: response.taskerId,
            type: "response_accepted",
            taskId: task._id,
            data,
          },
          ...others.map((o): NotificationInputBack => ({
            userId: o.taskerId,
            type: "response_rejected",
            taskId: task._id,
            data,
          })),
        ];

        await notify(notices);
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Accept task response error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  async decline(
    user: User,
    taskId: string,
    responseId: string,
  ): Promise<ServiceResult> {
    const _taskId = toObjectId(taskId);
    if (!_taskId) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    const _responseId = toObjectId(responseId);
    if (!_responseId) {
      return { success: false, status: 404, message: "taskResponse.notFound" };
    }
    const session = this.server.getClient().startSession();
    try {
      const db = await this.server.getDb();
      await this.notifications.transaction(session, async (notify) => {
        const task = await db
          .collection("tasks")
          .findOne({ _id: _taskId }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        if (task.clientId.toString() !== user._id.toString())
          throw { status: 403, message: "general.forbidden" };
        if (task.status !== "open")
          throw { status: 409, message: "taskResponse.taskAlreadyAssigned" };

        const response = await db
          .collection("taskResponses")
          .findOne({ _id: _responseId, taskId: task._id }, { session });
        if (!response) throw { status: 404, message: "taskResponse.notFound" };
        if (response.status !== "pending")
          throw { status: 409, message: "taskResponse.alreadyProcessed" };

        const res = await db
          .collection("taskResponses")
          .updateOne(
            { _id: response._id, status: "pending" },
            { $set: { status: "rejected", updatedAt: new Date() } },
            { session },
          );
        if (res.modifiedCount === 0)
          throw { status: 409, message: "taskResponse.alreadyProcessed" };
        await db
          .collection("tasks")
          .updateOne(
            { _id: task._id },
            { $inc: { responsesCount: -1 } },
            { session },
          );

        await notify([
          {
            userId: response.taskerId,
            type: "response_rejected",
            taskId: task._id,
            data: { taskTitle: task.title },
          },
        ]);
      });
      return { success: true, status: 200 };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      console.error("Decline task response error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }
}
