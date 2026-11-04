import { ClientSession, ObjectId } from "mongodb";
import {
  IServer,
  User,
  NotificationItemBack,
  NotificationInputBack,
} from "@/types";
import {
  NotificationActor,
  NotificationItem,
  NOTIFICATION_CATEGORY,
  ServiceResult,
} from "shared/index";
import { toObjectId } from "@/utils";

const pendingBySession = new WeakMap<ClientSession, NotificationItemBack[]>();

const toDto = (d: NotificationItemBack): NotificationItem => ({
  _id: d._id.toString(),
  type: d.type,
  category: d.category as NotificationItem["category"],
  taskId: d.taskId?.toString() ?? null,
  chatId: d.chatId?.toString() ?? null,
  actor: d.actor ?? null,
  data: d.data ?? {},
  read: d.read,
  createdAt: d.createdAt,
});

export class NotificationService {
  constructor(private server: IServer) {}

  emit(userId: ObjectId, event: string, payload: unknown) {
    try {
      this.server.getIO().to(`user:${userId.toString()}`).emit(event, payload);
    } catch (e) {
      console.error("Notification emit error:", e);
    }
  }

  emitDocs(docs: NotificationItemBack[]) {
    for (const d of docs) {
      this.emit(d.userId, "notification:new", { notification: toDto(d) });
    }
  }

  flush(session: ClientSession) {
    const queue = pendingBySession.get(session);
    pendingBySession.delete(session);
    if (queue?.length) this.emitDocs(queue);
  }

  discard(session: ClientSession) {
    pendingBySession.delete(session);
  }

  async push(
    items: NotificationInputBack[],
    session?: ClientSession,
  ): Promise<NotificationItemBack[]> {
    if (!items.length) return [];
    const db = await this.server.getDb();
    const now = new Date();
    const base = items.map((item) => ({
      userId: item.userId,
      type: item.type,
      category: NOTIFICATION_CATEGORY[item.type],
      taskId: item.taskId ?? null,
      chatId: item.chatId ?? null,
      actor: item.actor ?? null,
      data: item.data ?? {},
      read: false,
      createdAt: now,
    }));
    const res = await db
      .collection("notifications")
      .insertMany(base, { session });
    const docs = base.map((d, i) => ({
      ...d,
      _id: res.insertedIds[i],
    })) as NotificationItemBack[];

    if (session) {
      const queue = pendingBySession.get(session) ?? [];
      queue.push(...docs);
      pendingBySession.set(session, queue);
    } else {
      this.emitDocs(docs);
    }
    return docs;
  }

  async transaction(
    session: ClientSession,
    fn: (
      notify: (items: NotificationInputBack[]) => Promise<void>,
    ) => Promise<void>,
  ) {
    const notify = async (items: NotificationInputBack[]) => {
      await this.push(items, session);
    };
    if (session.inTransaction()) {
      await fn(notify);
      return;
    }
    try {
      await session.withTransaction(async () => {
        this.discard(session);
        await fn(notify);
      });
    } catch (e) {
      this.discard(session);
      throw e;
    }
    this.flush(session);
  }

  async pushChatMessage(input: {
    userId: ObjectId;
    chatId: ObjectId;
    actor: NotificationActor;
    preview: string | null;
    hasMedia: boolean;
  }) {
    const db = await this.server.getDb();
    const count = await db.collection("messages").countDocuments({
      chatId: input.chatId,
      senderId: { $ne: input.userId },
      readBy: { $ne: input.userId },
    });
    const run = () =>
      db.collection<NotificationItemBack>("notifications").findOneAndUpdate(
        {
          userId: input.userId,
          type: "chat_message",
          chatId: input.chatId,
          read: false,
        },
        {
          $set: {
            createdAt: new Date(),
            actor: input.actor,
            "data.preview": input.preview ?? "",
            "data.hasMedia": input.hasMedia,
            "data.count": count,
          },
          $setOnInsert: { category: "chat", taskId: null },
        },
        { upsert: true, returnDocument: "after" },
      );
    let doc: NotificationItemBack | null;
    try {
      doc = await run();
    } catch (e: any) {
      if (e?.code === 11000) doc = await run();
      else throw e;
    }
    if (doc) this.emitDocs([doc]);
  }

  async list(user: User, query: Record<string, any>): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
      const [docs, unreadCount] = await Promise.all([
        db
          .collection<NotificationItemBack>("notifications")
          .find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray(),
        db
          .collection("notifications")
          .countDocuments({ userId: user._id, read: false }),
      ]);
      return {
        success: true,
        status: 200,
        data: { items: docs.map(toDto), unreadCount },
      };
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
      this.emit(user._id, "notification:read", { id });
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
      this.emit(user._id, "notification:read", { all: true });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Mark all notifications read error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async remove(user: User, id: string): Promise<ServiceResult> {
    const _id = toObjectId(id);
    if (!_id) {
      return { success: false, status: 404, message: "notification.notFound" };
    }
    try {
      const db = await this.server.getDb();
      const res = await db
        .collection("notifications")
        .deleteOne({ _id, userId: user._id });
      if (res.deletedCount === 0) {
        return {
          success: false,
          status: 404,
          message: "notification.notFound",
        };
      }
      this.emit(user._id, "notification:deleted", { id });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Remove notification error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async markReadByChat(userId: ObjectId, chatId: ObjectId) {
    const db = await this.server.getDb();
    const res = await db
      .collection("notifications")
      .updateMany(
        { userId, chatId, category: "chat", read: false },
        { $set: { read: true } },
      );
    if (res.modifiedCount > 0) {
      this.emit(userId, "notification:read", { chatId: chatId.toString() });
    }
  }

  async removeByChat(chatId: ObjectId, userId?: ObjectId) {
    const db = await this.server.getDb();
    await db
      .collection("notifications")
      .deleteMany(userId ? { chatId, userId } : { chatId });
    if (userId) {
      this.emit(userId, "notification:deleted", { chatId: chatId.toString() });
    }
  }

  async syncChatMessage(userId: ObjectId, chatId: ObjectId) {
    const db = await this.server.getDb();
    const messages = db.collection("messages");
    const unread = {
      chatId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    };
    const [count, [last]] = await Promise.all([
      messages.countDocuments(unread),
      messages.find(unread).sort({ _id: -1 }).limit(1).toArray(),
    ]);
    const col = db.collection<NotificationItemBack>("notifications");
    const filter = {
      userId,
      chatId,
      type: "chat_message" as const,
      read: false,
    };
    if (!last) {
      const removed = await col.findOneAndDelete(filter);
      if (removed) {
        this.emit(userId, "notification:deleted", {
          id: removed._id.toString(),
        });
      }
      return;
    }
    const doc = await col.findOneAndUpdate(
      filter,
      {
        $set: {
          "data.count": count,
          "data.preview": last.text ? String(last.text).slice(0, 120) : "",
          "data.hasMedia": last.mediaIds.length > 0,
        },
      },
      { returnDocument: "after" },
    );
    if (doc) this.emitDocs([doc]);
  }
}
