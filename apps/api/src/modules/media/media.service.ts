import { ObjectId } from "mongodb";
import fs from "fs/promises";
import { ServiceResult } from "shared/types";
import { filePath, toObjectId, mediaUrl } from "@/utils";
import { MediaItemBack, ChatBack, MessageBack, IServer, User } from "@/types";

export class MediaService {
  constructor(private server: IServer) {}

  async upload(user: User, file: Express.Multer.File): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const doc = {
        ownerId: user._id,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        publicSources: [],
        chatIds: [],
      };
      const result = await db.collection("media").insertOne(doc);
      const path = `/api/media/${result.insertedId}/file`;
      const url = mediaUrl(path);
      await db
        .collection("media")
        .updateOne({ _id: result.insertedId }, { $set: { url } });
      return {
        success: true,
        status: 201,
        data: { media: { _id: result.insertedId, url, ...doc } },
      };
    } catch (e) {
      console.error("Upload media error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async getAll(user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const items = await db
        .collection("media")
        .find({ ownerId: user._id })
        .sort({ uploadedAt: -1 })
        .toArray();
      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Get media error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async delete(user: User, id: string): Promise<ServiceResult> {
    try {
      const mediaId = toObjectId(id);
      if (!mediaId) {
        return { success: false, status: 400, message: "media.notFound" };
      }
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({
        _id: mediaId,
        ownerId: user._id,
      });
      if (!item)
        return { success: false, status: 404, message: "media.notFound" };
      await fs.unlink(filePath(item.filename, item.ownerId)).catch(() => {});
      await db.collection("media").deleteOne({ _id: mediaId });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Delete media error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async addPublicSource(
    id: string,
    ownerId: ObjectId,
    source: string,
  ): Promise<ServiceResult> {
    try {
      const mediaId = toObjectId(id);
      if (!mediaId) {
        return { success: false, status: 400, message: "media.notFound" };
      }
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({
        _id: mediaId,
        ownerId,
      });
      if (!item)
        return { success: false, status: 404, message: "media.notFound" };
      await db
        .collection("media")
        .updateOne({ _id: mediaId }, { $addToSet: { publicSources: source } });
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Add public source error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async removePublicSource(
    id: string,
    ownerId: ObjectId,
    source: string,
  ): Promise<ServiceResult> {
    try {
      const mediaId = toObjectId(id);
      if (!mediaId) {
        return { success: false, status: 400, message: "media.notFound" };
      }
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({
        _id: mediaId,
        ownerId,
      });
      if (!item)
        return { success: false, status: 404, message: "media.notFound" };
      await db
        .collection<MediaItemBack>("media")
        .updateOne({ _id: item._id }, { $pull: { publicSources: source } });
      return {
        success: true,
        status: 200,
      };
    } catch (e) {
      console.error("Remove public source error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async serveFile(
    id: string,
    user?: User | null,
  ): Promise<
    ServiceResult<{ filePath: string; mimeType: string; fileSize: number }>
  > {
    try {
      const mediaId = toObjectId(id);
      if (!mediaId) {
        return { success: false, status: 400, message: "media.notFound" };
      }
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({ _id: mediaId });

      if (!item)
        return { success: false, status: 404, message: "media.notFound" };

      const fp = filePath(item.filename, item.ownerId);

      if (item.publicSources?.length > 0) {
        return {
          success: true,
          status: 200,
          data: { filePath: fp, mimeType: item.mimeType, fileSize: item.size },
        };
      }

      if (!user) {
        return { success: false, status: 401, message: "general.unauthorized" };
      }

      if (user._id.equals(item.ownerId)) {
        return {
          success: true,
          status: 200,
          data: { filePath: fp, mimeType: item.mimeType, fileSize: item.size },
        };
      }

      const messages = await db
        .collection<MessageBack>("messages")
        .find({ mediaIds: item._id })
        .toArray();

      if (messages.length === 0) {
        return { success: false, status: 403, message: "general.forbidden" };
      }

      const chatIds = [
        ...new Set(messages.map((m) => m.chatId.toString())),
      ].map((id) => new ObjectId(id));

      const hasAccess = await db.collection<ChatBack>("chats").findOne({
        _id: { $in: chatIds },
        participants: user._id,
      });

      if (!hasAccess) {
        return { success: false, status: 403, message: "general.forbidden" };
      }

      return {
        success: true,
        status: 200,
        data: { filePath: fp, mimeType: item.mimeType, fileSize: item.size },
      };
    } catch (e) {
      console.error("Serve file error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }
}
