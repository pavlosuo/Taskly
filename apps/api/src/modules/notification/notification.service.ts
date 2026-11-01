import { ClientSession, ObjectId } from "mongodb";
import { IServer, User } from "@/types";
import { NotificationType, ServiceResult } from "shared/index";
import { toObjectId } from "@/utils";

export interface NotificationInput {
  userId: ObjectId;
  type: NotificationType;
  taskId?: ObjectId;
  data?: Record<string, unknown>;
}

export class NotificationService {
  constructor(private server: IServer) {}

  async push(items: NotificationInput[], session?: ClientSession) {
    if (!items.length) return;
    const db = await this.server.getDb();
    const now = new Date();
    await db.collection("notifications").insertMany(
      items.map((item) => ({
        userId: item.userId,
        type: item.type,
        taskId: item.taskId ?? null,
        data: item.data ?? {},
        read: false,
        createdAt: now,
      })),
      { session },
    );
  }

  async list(user: User, query: Record<string, any>): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
      const [items, unreadCount] = await Promise.all([
        db
          .collection("notifications")
          .find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray(),
        db
          .collection("notifications")
          .countDocuments({ userId: user._id, read: false }),
      ]);
      return { success: true, status: 200, data: { items, unreadCount } };
    } catch (e) {
      console.error("List notifications error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async markRead(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "notification.notFound" };
    }
    try {
      const db = await this.server.getDb();
      const res = await db
        .collection("notifications")
        .updateOne({ _id, userId: user._id }, { $set: { read: true } });
      if (res.matchedCount === 0) {
        return {
          success: false,
          status: 404,
          message: "notification.notFound",
        };
      }
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Mark notification read error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async markAllRead(user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      await db
        .collection("notifications")
        .updateMany(
          { userId: user._id, read: false },
          { $set: { read: true } },
        );
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Mark all notifications read error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }
}
