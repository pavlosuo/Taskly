import { ObjectId } from "mongodb";
import { IServer, User } from "@/types";
import { ServiceResult } from "@shared/types";
import {
  ChatWithMember,
  ChatMemberPreview,
  Message,
  MessagesPage,
  CreateChatPayload,
  SendMessagePayload,
} from "@shared/types/chat";
import { MediaService } from "@/modules/media/media.service";
import { ChatBack, MessageBack } from "@/types";

const MESSAGES_PAGE_SIZE = 30;

export class ChatService {
  private mediaService: MediaService;

  constructor(private server: IServer) {
    this.mediaService = new MediaService(this.server);
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
        avatar: u.profile?.avatar ?? null,
        initials: u.profile?.initials ?? "",
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
              createdAt: chat.lastMessage.createdAt.toISOString(),
            }
          : null,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
        member: member ?? {
          _id: otherId?.toString() ?? "",
          username: "",
          fullName: "Deleted user",
          avatar: null,
          initials: "",
        },
        unreadCount: unreadMap.get(chat._id.toString()) ?? 0,
      };
    });
  }

  private async populateMessages(docs: MessageBack[]): Promise<Message[]> {
    if (docs.length === 0) return [];
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
      media: d.mediaIds
        .map((id) => mediaMap.get(id.toString()))
        .filter(Boolean) as Message["media"],
      readBy: d.readBy.map((id) => id.toString()),
      createdAt: d.createdAt.toISOString(),
    }));
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
      return { success: true, status: 201, data: { chat: enriched } };
    } catch (e) {
      console.error("Create chat error:", e);
      return { success: false, status: 500, message: "Server error." };
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
      return { success: false, status: 500, message: "Server error." };
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
      return { success: false, status: 500, message: "Server error." };
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

      return { success: true, status: 200, data: { message: "Deleted." } };
    } catch (e) {
      console.error("Delete chat error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async getMessages(
    user: User,
    chatId: string,
    before?: string,
    limit = MESSAGES_PAGE_SIZE,
  ): Promise<ServiceResult<MessagesPage>> {
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
      return { success: false, status: 500, message: "Server error." };
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
        createdAt: now,
      };

      const result = await db.collection("messages").insertOne(doc);

      for (const mediaId of mediaIds) {
        const linked = await this.mediaService.addChatId(
          mediaId,
          user._id,
          chat._id,
        );
        if (!linked.success) {
          console.warn(
            `Media ${mediaId} not linked to chat ${chatId}: not owned by sender`,
          );
        }
      }

      await db.collection<ChatBack>("chats").updateOne(
        { _id: chat._id },
        {
          $set: {
            lastMessage: {
              text,
              hasMedia: mediaIds.length > 0,
              senderId: user._id,
              createdAt: now,
            },
            updatedAt: now,
            deletedBy: [],
          },
        },
      );

      const [message] = await this.populateMessages([
        { ...doc, _id: result.insertedId },
      ]);

      return { success: true, status: 201, data: { message } };
    } catch (e) {
      console.error("Send message error:", e);
      return { success: false, status: 500, message: "Server error." };
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

      return { success: true, status: 200, data: { message: "Read." } };
    } catch (e) {
      console.error("Mark read error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }
}
