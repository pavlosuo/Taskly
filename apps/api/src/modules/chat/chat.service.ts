import { ObjectId } from "mongodb";
import { ServiceResult } from "@shared/types";
import {
  ChatWithMember,
  ChatMemberPreview,
  Message,
  CreateChatPayload,
  SendMessagePayload,
} from "@shared/types/chat";
import { ChatBack, MessageBack, IServer, User } from "@/types";
import { EMOJI } from "@shared/data";
import { stripMediaFields } from "@/utils";

export class ChatService {
  constructor(private server: IServer) {}

  private emitToChat(
    chatId: ObjectId,
    event: string,
    payload: unknown,
    excludeUserId?: ObjectId,
  ) {
    const emitter = this.server.getIO().to(`chat:${chatId.toString()}`);
    if (excludeUserId) {
      emitter.except(`user:${excludeUserId.toString()}`).emit(event, payload);
    } else {
      emitter.emit(event, payload);
    }
  }

  private async assertParticipant(
    chatId: string,
    userId: ObjectId,
  ): Promise<ChatBack | null> {
    const db = await this.server.getDb();
    return db.collection<ChatBack>("chats").findOne({
      _id: new ObjectId(chatId),
      participants: userId,
      deletedBy: { $ne: userId },
    });
  }

  private async buildMemberMap(
    userIds: ObjectId[],
  ): Promise<Map<string, ChatMemberPreview>> {
    if (userIds.length === 0) return new Map();
    const db = await this.server.getDb();
    const users = await db
      .collection("users")
      .find(
        { _id: { $in: userIds } },
        {
          projection: {
            username: 1,
            "profile.fullName": 1,
            "profile.avatar": 1,
            "profile.initials": 1,
            publicLink: 1,
            lastSeenAt: 1,
            role: 1,
          },
        },
      )
      .toArray();
    const map = new Map<string, ChatMemberPreview>();
    for (const u of users) {
      map.set(u._id.toString(), {
        _id: u._id.toString(),
        username: u.username,
        fullName: u.profile?.fullName ?? "",
        avatar: stripMediaFields(u.profile?.avatar) ?? null,
        initials: u.profile?.initials ?? "",
        ...(u.role !== "admin"
          ? {
              publicLink: u.publicLink,
              lastSeenAt: u.lastSeenAt as string,
            }
          : {}),
      });
    }
    return map;
  }

  private async enrichChats(
    chats: ChatBack[],
    currentUserId: ObjectId,
  ): Promise<ChatWithMember[]> {
    if (chats.length === 0) return [];
    const db = await this.server.getDb();
    const otherIds = chats.map((c) =>
      c.participants.find((p) => !p.equals(currentUserId)),
    );
    const memberMap = await this.buildMemberMap(
      otherIds.filter((id): id is ObjectId => !!id),
    );
    const chatIds = chats.map((c) => c._id);
    const unreadAgg = await db
      .collection<MessageBack>("messages")
      .aggregate([
        {
          $match: {
            chatId: { $in: chatIds },
            senderId: { $ne: currentUserId },
            readBy: { $ne: currentUserId },
          },
        },
        { $group: { _id: "$chatId", count: { $sum: 1 } } },
      ])
      .toArray();
    const unreadMap = new Map<string, number>(
      unreadAgg.map((u) => [u._id.toString(), u.count as number]),
    );
    return chats.map((chat) => {
      const otherId = chat.participants.find((p) => !p.equals(currentUserId));
      const member = otherId ? memberMap.get(otherId.toString()) : undefined;
      return {
        _id: chat._id.toString(),
        participants: chat.participants.map((p) => p.toString()),
        deletedBy: chat.deletedBy.map((p) => p.toString()),
        lastMessage: chat.lastMessage
          ? {
              text: chat.lastMessage.text,
              hasMedia: chat.lastMessage.hasMedia,
              senderId: chat.lastMessage.senderId.toString(),
              createdAt: chat.lastMessage.createdAt,
            }
          : null,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        member: member ?? {
          _id: otherId?.toString() ?? "",
          username: "",
          fullName: "Deleted user",
          avatar: null,
          initials: "",
          publicLink: "",
          lastSeenAt: "",
        },
        unreadCount: unreadMap.get(chat._id.toString()) ?? 0,
      };
    });
  }

  private async populateMessages(docs: MessageBack[]): Promise<Message[]> {
    if (docs.length === 0 || !docs) return [];
    const db = await this.server.getDb();

    const allMediaIds = [
      ...new Set(docs.flatMap((d) => d.mediaIds.map((m) => m.toString()))),
    ].map((id) => new ObjectId(id));

    const mediaDocs = allMediaIds.length
      ? await db
          .collection("media")
          .find({ _id: { $in: allMediaIds } })
          .toArray()
      : [];

    const mediaMap = new Map(
      mediaDocs.map((m) => [m._id.toString(), { ...m, _id: m._id.toString() }]),
    );

    return docs.map((d) => ({
      _id: d._id.toString(),
      chatId: d.chatId.toString(),
      senderId: d.senderId.toString(),
      text: d.text,
      media: stripMediaFields(
        d.mediaIds
          .map((id) => mediaMap.get(id.toString()))
          .filter(Boolean) as Message["media"],
      ),
      readBy: d.readBy.map((id) => id?.toString()),
      reactions: d.reactions?.map((r) => ({
        userId: r.userId?.toString(),
        emoji: r.emoji,
      })),
      edited: d.edited,
      updatedAt: d.updatedAt,
      createdAt: d.createdAt,
    }));
  }

  private async recomputeLastMessage(chatId: ObjectId): Promise<void> {
    const db = await this.server.getDb();
    const [last] = await db
      .collection<MessageBack>("messages")
      .find({ chatId })
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    await db.collection<ChatBack>("chats").updateOne(
      { _id: chatId },
      {
        $set: {
          lastMessage: last
            ? {
                text: last.text,
                hasMedia: last.mediaIds.length > 0,
                senderId: last.senderId,
                createdAt: last.createdAt,
              }
            : null,
        },
      },
    );
  }

  async createChat(
    user: User,
    payload: CreateChatPayload,
  ): Promise<ServiceResult> {
    try {
      if (!payload.memberId) {
        return { success: false, status: 400, message: "memberId required." };
      }
      if (payload.memberId === user._id.toString()) {
        return {
          success: false,
          status: 400,
          message: "Cannot start a chat with yourself.",
        };
      }
      const db = await this.server.getDb();
      const otherId = new ObjectId(payload.memberId);
      const otherUser = await db
        .collection("users")
        .findOne({ _id: otherId }, { projection: { _id: 1 } });
      if (!otherUser) {
        return { success: false, status: 404, message: "User not found." };
      }
      const existing = await db.collection<ChatBack>("chats").findOne({
        participants: { $all: [user._id, otherId], $size: 2 },
      });
      if (existing) {
        if (existing.deletedBy.some((id) => id.equals(user._id))) {
          await db
            .collection<ChatBack>("chats")
            .updateOne(
              { _id: existing._id },
              { $pull: { deletedBy: user._id } },
            );
          existing.deletedBy = existing.deletedBy.filter(
            (id) => !id.equals(user._id),
          );
        }
        const [enriched] = await this.enrichChats([existing], user._id);
        return { success: true, status: 200, data: { chat: enriched } };
      }
      const now = new Date();
      const doc: Omit<ChatBack, "_id"> = {
        participants: [user._id, otherId],
        deletedBy: [],
        lastMessage: null,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("chats").insertOne(doc);
      const [enriched] = await this.enrichChats(
        [{ ...doc, _id: result.insertedId }],
        user._id,
      );
      const [otherView] = await this.enrichChats(
        [{ ...doc, _id: result.insertedId }],
        otherId,
      );
      this.server.emitToUser(otherId, "chat:new", { chat: otherView });
      return { success: true, status: 201, data: { chat: enriched } };
    } catch (e) {
      console.error("Create chat error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async getAll(user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const chats = await db
        .collection<ChatBack>("chats")
        .find({ participants: user._id, deletedBy: { $ne: user._id } })
        .sort({ updatedAt: -1 })
        .toArray();
      const enriched = await this.enrichChats(chats, user._id);
      return { success: true, status: 200, data: { chats: enriched } };
    } catch (e) {
      console.error("Get chats error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async getById(user: User, chatId: string): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const [enriched] = await this.enrichChats([chat], user._id);
      return { success: true, status: 200, data: { chat: enriched } };
    } catch (e) {
      console.error("Get chat error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async deleteChat(user: User, chatId: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const newDeletedBy = [
        ...chat.deletedBy.map((id) => id.toString()),
        user._id.toString(),
      ];
      const allDeleted = chat.participants.every((p) =>
        newDeletedBy.includes(p.toString()),
      );
      if (allDeleted) {
        await db.collection("messages").deleteMany({ chatId: chat._id });
        await db.collection("chats").deleteOne({ _id: chat._id });
      } else {
        await db
          .collection<ChatBack>("chats")
          .updateOne({ _id: chat._id }, { $addToSet: { deletedBy: user._id } });
      }
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Delete chat error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async getMessages(
    user: User,
    chatId: string,
    before?: string,
    limit = 30,
  ): Promise<
    ServiceResult<{
      items: Message[];
      nextCursor: string | null;
    }>
  > {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const db = await this.server.getDb();
      const query: any = { chatId: chat._id };
      if (before) query._id = { $lt: new ObjectId(before) };
      const docs = await db
        .collection<MessageBack>("messages")
        .find(query)
        .sort({ _id: -1 })
        .limit(limit)
        .toArray();
      const oldestId = docs.length
        ? docs[docs.length - 1]._id.toString()
        : null;
      const nextCursor = docs.length === limit ? oldestId : null;
      const items = await this.populateMessages(docs.reverse());
      return { success: true, status: 200, data: { items, nextCursor } };
    } catch (e) {
      console.error("Get messages error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async sendMessage(
    user: User,
    chatId: string,
    payload: SendMessagePayload,
  ): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const text = payload.text?.trim() || null;
      const mediaIds = payload.mediaIds ?? [];
      if (!text && mediaIds.length === 0) {
        return {
          success: false,
          status: 400,
          message: "Message must contain text or media.",
        };
      }
      const db = await this.server.getDb();
      const now = new Date();
      const doc: Omit<MessageBack, "_id"> = {
        chatId: chat._id,
        senderId: user._id,
        text,
        mediaIds: mediaIds.map((id) => new ObjectId(id)),
        readBy: [user._id],
        reactions: [],
        edited: false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("messages").insertOne(doc);
      await this.recomputeLastMessage(chat._id);
      const [message] = await this.populateMessages([
        { ...doc, _id: result.insertedId },
      ]);
      this.emitToChat(chat._id, "message:new", { message }, user._id);
      const otherId = chat.participants.find((p) => !p.equals(user._id));
      if (otherId) {
        const chatUpdated = await this.assertParticipant(chatId, user._id);
        if (chatUpdated) {
          const [otherView] = await this.enrichChats([chatUpdated], otherId);
          this.server.emitToUser(otherId, "chat:updated", { chat: otherView });
        }
      }
      return { success: true, status: 201, data: { message } };
    } catch (e) {
      console.error("Send message error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async markRead(user: User, chatId: string): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const db = await this.server.getDb();
      await db.collection<MessageBack>("messages").updateMany(
        {
          chatId: chat._id,
          senderId: { $ne: user._id },
          readBy: { $ne: user._id },
        },
        { $addToSet: { readBy: user._id } },
      );
      this.emitToChat(
        chat._id,
        "chat:read",
        {
          chatId: chat._id.toString(),
          userId: user._id.toString(),
        },
        user._id,
      );
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Mark read error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async editMessage(
    user: User,
    chatId: string,
    messageId: string,
    text: string,
  ): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const trimmed = text?.trim();
      if (!trimmed) {
        return { success: false, status: 400, message: "Text required." };
      }
      const db = await this.server.getDb();
      const msg = await db.collection<MessageBack>("messages").findOne({
        _id: new ObjectId(messageId),
        chatId: chat._id,
      });
      if (!msg)
        return { success: false, status: 404, message: "Message not found." };
      if (!msg.senderId.equals(user._id)) {
        return { success: false, status: 403, message: "Forbidden." };
      }
      const now = new Date();
      await db
        .collection<MessageBack>("messages")
        .updateOne(
          { _id: msg._id },
          { $set: { text: trimmed, edited: true, updatedAt: now } },
        );
      const chatDoc = await db
        .collection<ChatBack>("chats")
        .findOne({ _id: chat._id, "lastMessage.createdAt": msg.createdAt });
      if (chatDoc) {
        await db
          .collection<ChatBack>("chats")
          .updateOne(
            { _id: chat._id },
            { $set: { "lastMessage.text": trimmed } },
          );
      }
      const [message] = await this.populateMessages([
        { ...msg, text: trimmed, edited: true, updatedAt: now },
      ]);
      this.emitToChat(chat._id, "message:updated", { message }, user._id);
      return { success: true, status: 200, data: { message } };
    } catch (e) {
      console.error("Edit message error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async deleteMessage(
    user: User,
    chatId: string,
    messageId: string,
  ): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const db = await this.server.getDb();
      const msg = await db.collection<MessageBack>("messages").findOne({
        _id: new ObjectId(messageId),
        chatId: chat._id,
      });
      if (!msg)
        return { success: false, status: 404, message: "Message not found." };
      if (!msg.senderId.equals(user._id)) {
        return { success: false, status: 403, message: "Forbidden." };
      }
      await db.collection("messages").deleteOne({ _id: msg._id });
      await this.recomputeLastMessage(chat._id);
      this.emitToChat(
        chat._id,
        "message:deleted",
        {
          messageId: msg._id.toString(),
        },
        user._id,
      );
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Delete message error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }

  async manageReaction(
    user: User,
    chatId: string,
    messageId: string,
    emoji: string,
  ): Promise<ServiceResult> {
    try {
      if (EMOJI.indexOf(emoji) === -1)
        return { success: false, status: 400, message: "Invalid emoji." };
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat) return { success: false, status: 404, message: "Not found." };
      const db = await this.server.getDb();
      const msg = await db.collection<MessageBack>("messages").findOne({
        _id: new ObjectId(messageId),
        chatId: chat._id,
      });
      if (!msg)
        return { success: false, status: 404, message: "Message not found." };
      const myReaction = msg.reactions.find((r) => r.userId.equals(user._id));
      const isRemovingSame = myReaction?.emoji === emoji;
      const withoutMine = msg.reactions.filter(
        (r) => !r.userId.equals(user._id),
      );
      const nextReactions = isRemovingSame
        ? withoutMine
        : [...withoutMine, { userId: user._id, emoji }];
      await db
        .collection<MessageBack>("messages")
        .updateOne({ _id: msg._id }, { $set: { reactions: nextReactions } });
      const updated = await db
        .collection<MessageBack>("messages")
        .findOne({ _id: msg._id });
      const [message] = await this.populateMessages([updated!]);
      this.emitToChat(chat._id, "message:updated", { message }, user._id);
      return { success: true, status: 200, data: { message } };
    } catch (e) {
      console.error("Manage reaction error:", e);
      return { success: false, status: 500, message: "errors.server" };
    }
  }
}
