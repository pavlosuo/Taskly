import { ObjectId } from "mongodb";
import {
  ServiceResult,
  ChatWithMember,
  ChatMemberPreview,
  Message,
  CreateChatPayload,
  SendMessagePayload,
  EMOJI,
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_MAX_MEDIA,
} from "shared/index";
import { ChatBack, MessageBack, IServer, User } from "@/types";
import { stripMediaFields, toObjectId, clampLimit } from "@/utils";
import { NotificationService } from "@/modules/notification/notification.service";

export class ChatService {
  private notifications: NotificationService;
  constructor(private server: IServer) {
    this.notifications = new NotificationService(server);
  }

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
    const id = toObjectId(chatId);
    if (!id) return null;
    return db.collection<ChatBack>("chats").findOne({
      _id: id,
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
            "settings.checkboxes.noOnlineStatus": 1,
            "settings.checkboxes.privateProfile": 1,
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
        ...(u.role !== "admin" && !u.settings?.checkboxes?.privateProfile
          ? {
              publicLink: u.publicLink,
            }
          : {}),
        ...(u.role !== "admin" && !u.settings?.checkboxes?.noOnlineStatus
          ? {
              lastSeenAt: u.lastSeenAt,
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
          fullName: "user.deleted",
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
    ]
      .map((id) => toObjectId(id))
      .filter(Boolean) as ObjectId[];

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

  private async refreshOther(chatId: ObjectId, otherId: ObjectId) {
    const db = await this.server.getDb();
    const chat = await db
      .collection<ChatBack>("chats")
      .findOne({ _id: chatId });
    if (!chat || chat.deletedBy.some((id) => id.equals(otherId))) return;
    const [view] = await this.enrichChats([chat], otherId);
    this.notifications.emit(otherId, "chat:updated", { chat: view });
    await this.notifications.syncChatMessage(otherId, chatId);
  }

  async createChat(
    user: User,
    payload: CreateChatPayload,
  ): Promise<ServiceResult> {
    try {
      const otherId = toObjectId(payload?.memberId);
      if (!otherId) {
        return { success: false, status: 400, message: "chat.memberNotFound" };
      }
      if (otherId.equals(user._id)) {
        return {
          success: false,
          status: 400,
          message: "chat.cannotCreateChatWithSelf",
        };
      }
      const db = await this.server.getDb();
      const otherUser = await db
        .collection("users")
        .findOne(
          { _id: otherId, deletedAt: { $exists: false } },
          { projection: { _id: 1 } },
        );
      if (!otherUser) {
        return { success: false, status: 404, message: "chat.memberNotFound" };
      }

      const chats = db.collection<ChatBack>("chats");
      const pairKey = [user._id, otherId].map(String).sort().join(":");

      const openExisting = async (existing: ChatBack) => {
        if (existing.deletedBy.some((id) => id.equals(user._id))) {
          await chats.updateOne(
            { _id: existing._id },
            { $pull: { deletedBy: user._id } },
          );
          existing.deletedBy = existing.deletedBy.filter(
            (id) => !id.equals(user._id),
          );
        }
        const [enriched] = await this.enrichChats([existing], user._id);
        return {
          success: true as const,
          status: 200,
          data: { chat: enriched },
        };
      };

      const existing = await chats.findOne({
        $or: [
          { pairKey },
          { participants: { $all: [user._id, otherId], $size: 2 } },
        ],
      });
      if (existing) {
        if (!existing.pairKey) {
          await chats
            .updateOne({ _id: existing._id }, { $set: { pairKey } as any })
            .catch(() => {});
        }
        return openExisting(existing);
      }

      const now = new Date();
      const doc = {
        participants: [user._id, otherId],
        pairKey,
        deletedBy: [] as ObjectId[],
        lastMessage: null,
        createdAt: now,
        updatedAt: now,
      };
      let insertedId: ObjectId;
      try {
        const result = await db.collection("chats").insertOne(doc);
        insertedId = result.insertedId;
      } catch (e: any) {
        if (e?.code !== 11000) throw e;
        const dup = await chats.findOne({ pairKey });
        if (!dup) throw e;
        return openExisting(dup);
      }

      const chatDoc = { ...doc, _id: insertedId } as ChatBack;
      const [enriched] = await this.enrichChats([chatDoc], user._id);
      const [otherView] = await this.enrichChats([chatDoc], otherId);
      this.notifications.emit(otherId, "chat:new", { chat: otherView });
      try {
        await this.notifications.push([
          {
            userId: otherId,
            type: "chat_new",
            chatId: insertedId,
            actor: {
              _id: otherView.member._id,
              fullName: otherView.member.fullName,
              initials: otherView.member.initials,
              avatar: otherView.member.avatar
                ? { url: otherView.member.avatar.url }
                : null,
            },
          },
        ]);
      } catch (e) {
        console.error("Chat notification error:", e);
      }
      return { success: true, status: 201, data: { chat: enriched } };
    } catch (e) {
      console.error("Create chat error:", e);
      return { success: false, status: 500, message: "general.unknown" };
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
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async getById(user: User, chatId: string): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
      const [enriched] = await this.enrichChats([chat], user._id);
      return { success: true, status: 200, data: { chat: enriched } };
    } catch (e) {
      console.error("Get chat error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async deleteChat(user: User, chatId: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
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
        await this.notifications.removeByChat(chat._id);
      } else {
        await db
          .collection<ChatBack>("chats")
          .updateOne({ _id: chat._id }, { $addToSet: { deletedBy: user._id } });
        await this.notifications.removeByChat(chat._id, user._id);
      }
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Delete chat error:", e);
      return { success: false, status: 500, message: "general.unknown" };
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
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
      const pageLimit = clampLimit(limit);
      const beforeId = before ? toObjectId(before) : null;
      if (before && !beforeId)
        return { success: false, status: 400, message: "general.unknown" };
      const db = await this.server.getDb();
      const query: any = { chatId: chat._id };
      if (beforeId) query._id = { $lt: beforeId };
      const docs = await db
        .collection<MessageBack>("messages")
        .find(query)
        .sort({ _id: -1 })
        .limit(pageLimit)
        .toArray();
      const oldestId = docs.length
        ? docs[docs.length - 1]._id.toString()
        : null;
      const nextCursor = docs.length === pageLimit ? oldestId : null;
      const items = await this.populateMessages(docs.reverse());
      return { success: true, status: 200, data: { items, nextCursor } };
    } catch (e) {
      console.error("Get messages error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async sendMessage(
    user: User,
    chatId: string,
    payload: SendMessagePayload,
  ): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
      const rawText: unknown = payload?.text;
      if (rawText != null && typeof rawText !== "string")
        return { success: false, status: 400, message: "chat.message.empty" };
      if (payload?.mediaIds != null && !Array.isArray(payload?.mediaIds))
        return {
          success: false,
          status: 400,
          message: "chat.message.invalidMedia",
        };
      const text = (rawText as string | undefined)?.trim() || null;
      if (text && text.length > CHAT_MESSAGE_MAX_LENGTH)
        return { success: false, status: 400, message: "chat.message.tooLong" };
      const mediaIds = payload?.mediaIds ?? [];
      if (mediaIds.length > CHAT_MAX_MEDIA)
        return {
          success: false,
          status: 400,
          message: "chat.message.tooManyMedia",
        };
      if (!text && mediaIds.length === 0) {
        return { success: false, status: 400, message: "chat.message.empty" };
      }
      const rawIds = [...new Set(payload?.mediaIds ?? [])];
      const mediaObjectIds = rawIds
        .map((id) => toObjectId(id))
        .filter((id): id is ObjectId => !!id);
      if (mediaObjectIds.length !== rawIds.length) {
        return {
          success: false,
          status: 400,
          message: "chat.message.invalidMedia",
        };
      }
      if (mediaObjectIds.length) {
        const owned = await db
          .collection("media")
          .countDocuments({ _id: { $in: mediaObjectIds }, ownerId: user._id });
        if (owned !== mediaObjectIds.length) {
          return { success: false, status: 403, message: "general.forbidden" };
        }
      }
      const now = new Date();
      const otherId = chat.participants.find((p) => !p.equals(user._id));
      let otherViewing = false;
      if (otherId) {
        const sockets = await this.server
          .getIO()
          .in(`chat:${chat._id.toString()}`)
          .fetchSockets();
        otherViewing = sockets.some(
          (s) => s.data.userId === otherId.toString(),
        );
      }
      const doc: Omit<MessageBack, "_id"> = {
        chatId: chat._id,
        senderId: user._id,
        text,
        mediaIds: mediaObjectIds,
        readBy: otherViewing && otherId ? [user._id, otherId] : [user._id],
        reactions: [],
        edited: false,
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection("messages").insertOne(doc);
      await this.recomputeLastMessage(chat._id);
      if (otherId) {
        await db
          .collection<ChatBack>("chats")
          .updateOne(
            { _id: chat._id },
            { $pull: { deletedBy: otherId }, $set: { updatedAt: now } },
          );
      }
      const [message] = await this.populateMessages([
        { ...doc, _id: result.insertedId },
      ]);
      this.emitToChat(chat._id, "message:new", { message }, user._id);
      if (otherId) {
        const chatUpdated = await db
          .collection<ChatBack>("chats")
          .findOne({ _id: chat._id });
        if (chatUpdated) {
          const [otherView] = await this.enrichChats([chatUpdated], otherId);
          const [senderView] = await this.enrichChats([chatUpdated], user._id);
          this.notifications.emit(user._id, "chat:updated", {
            chat: senderView,
          });
          this.notifications.emit(otherId, "chat:updated", { chat: otherView });
          if (!otherViewing) {
            try {
              await this.notifications.pushChatMessage({
                userId: otherId,
                chatId: chat._id,
                actor: {
                  _id: otherView.member._id,
                  fullName: otherView.member.fullName,
                  initials: otherView.member.initials,
                  avatar: otherView.member.avatar
                    ? { url: otherView.member.avatar.url }
                    : null,
                },
                preview: text ? text.slice(0, 120) : null,
                hasMedia: mediaIds.length > 0,
              });
            } catch (e) {
              console.error("Chat notification error:", e);
            }
          }
        }
      }
      return { success: true, status: 201, data: { message } };
    } catch (e) {
      console.error("Send message error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async markRead(user: User, chatId: string): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
      const db = await this.server.getDb();
      await db.collection<MessageBack>("messages").updateMany(
        {
          chatId: chat._id,
          senderId: { $ne: user._id },
          readBy: { $ne: user._id },
        },
        { $addToSet: { readBy: user._id } },
      );
      await this.notifications.markReadByChat(user._id, chat._id);
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
      return { success: false, status: 500, message: "general.unknown" };
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
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
      const trimmed = typeof text === "string" ? text.trim() : "";
      if (!trimmed)
        return { success: false, status: 400, message: "chat.message.noText" };
      if (trimmed.length > CHAT_MESSAGE_MAX_LENGTH)
        return { success: false, status: 400, message: "chat.message.tooLong" };
      const db = await this.server.getDb();
      const _messageId = toObjectId(messageId);
      if (!_messageId)
        return {
          success: false,
          status: 404,
          message: "chat.message.notFound",
        };
      const msg = await db.collection<MessageBack>("messages").findOne({
        _id: _messageId,
        chatId: chat._id,
      });
      if (!msg)
        return {
          success: false,
          status: 404,
          message: "chat.message.notFound",
        };
      if (!msg.senderId.equals(user._id)) {
        return { success: false, status: 403, message: "general.forbidden" };
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
      const otherId = chat.participants.find((p) => !p.equals(user._id));
      if (otherId) {
        this.refreshOther(chat._id, otherId).catch((e) =>
          console.error("Refresh other error:", e),
        );
      }
      return { success: true, status: 200, data: { message } };
    } catch (e) {
      console.error("Edit message error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async deleteMessage(
    user: User,
    chatId: string,
    messageId: string,
  ): Promise<ServiceResult> {
    try {
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
      const db = await this.server.getDb();
      const _messageId = toObjectId(messageId);
      if (!_messageId)
        return {
          success: false,
          status: 404,
          message: "chat.message.notFound",
        };
      const msg = await db.collection<MessageBack>("messages").findOne({
        _id: _messageId,
        chatId: chat._id,
      });
      if (!msg)
        return {
          success: false,
          status: 404,
          message: "chat.message.notFound",
        };
      if (!msg.senderId.equals(user._id)) {
        return { success: false, status: 403, message: "general.forbidden" };
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
      const otherId = chat.participants.find((p) => !p.equals(user._id));
      if (otherId) {
        this.refreshOther(chat._id, otherId).catch((e) =>
          console.error("Refresh other error:", e),
        );
      }
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Delete message error:", e);
      return { success: false, status: 500, message: "general.unknown" };
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
        return {
          success: false,
          status: 400,
          message: "chat.message.invalidEmoji",
        };
      const chat = await this.assertParticipant(chatId, user._id);
      if (!chat)
        return { success: false, status: 404, message: "chat.notFound" };
      const db = await this.server.getDb();
      const _messageId = toObjectId(messageId);
      if (!_messageId)
        return {
          success: false,
          status: 404,
          message: "chat.message.notFound",
        };
      const msg = await db.collection<MessageBack>("messages").findOne({
        _id: _messageId,
        chatId: chat._id,
      });
      if (!msg)
        return {
          success: false,
          status: 404,
          message: "chat.message.notFound",
        };
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
      return { success: false, status: 500, message: "general.unknown" };
    }
  }
}
