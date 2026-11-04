import { IServer, User } from "@/types";
import { toObjectId } from "@/utils";
import { ServiceResult, reviewCreateSchema } from "shared/index";
import { NotificationService } from "@/modules/notification/notification.service";

export class ReviewService {
  private notifications: NotificationService;

  constructor(private server: IServer) {
    this.notifications = new NotificationService(server);
  }

  async create(
    user: User,
    taskId: string,
    payload: unknown,
  ): Promise<ServiceResult> {
    const _taskId = toObjectId(taskId);
    if (!_taskId) {
      return { success: false, status: 404, message: "task.notFound" };
    }
    const parsed = reviewCreateSchema.safeParse(payload);
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
      let review: Record<string, any> | null = null;
      await this.notifications.transaction(session, async (notify) => {
        const task = await db
          .collection("tasks")
          .findOne({ _id: _taskId }, { session });
        if (!task) throw { status: 404, message: "task.notFound" };
        const isClient = task.clientId.equals(user._id);
        const isTasker = task.assignedTaskerId?.equals(user._id);
        if (!isClient && !isTasker)
          throw { status: 404, message: "task.notFound" };
        if (task.status !== "completed")
          throw { status: 409, message: "review.taskNotCompleted" };

        const existing = await db
          .collection("reviews")
          .findOne({ taskId: task._id, authorId: user._id }, { session });
        if (existing) throw { status: 409, message: "review.alreadyReviewed" };

        const targetId = isClient ? task.assignedTaskerId : task.clientId;

        const doc = {
          taskId: task._id,
          authorId: user._id,
          targetId,
          authorRole: isClient ? "client" : "tasker",
          rating: parsed.data.rating,
          comment: parsed.data.comment,
          createdAt: new Date(),
        };

        const result = await db
          .collection("reviews")
          .insertOne(doc, { session });

        await notify([
          {
            userId: targetId,
            type: "review_received",
            taskId: task._id,
            data: { taskTitle: task.title, rating: parsed.data.rating },
          },
        ]);

        review = { _id: result.insertedId, ...doc };
      });
      return { success: true, status: 201, data: { review } };
    } catch (e: any) {
      if (e?.status) {
        return { success: false, status: e.status, message: e.message };
      }
      if (e?.code === 11000) {
        return {
          success: false,
          status: 409,
          message: "review.alreadyReviewed",
        };
      }
      console.error("Create review error:", e);
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
      const isParty =
        task.clientId?.equals(user._id) ||
        task.assignedTaskerId?.equals(user._id);
      if (!isParty) {
        return { success: false, status: 404, message: "task.notFound" };
      }
      const items = await db
        .collection("reviews")
        .find({ taskId: task._id })
        .toArray();
      const mine = items.find((r) => r.authorId?.equals(user._id)) ?? null;
      const received = items.find((r) => r.targetId?.equals(user._id)) ?? null;
      return { success: true, status: 200, data: { mine, received } };
    } catch (e) {
      console.error("Get task reviews error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }
}
