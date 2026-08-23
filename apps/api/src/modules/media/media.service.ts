import { ObjectId } from "mongodb";
import fs from "fs/promises";
import { IServer, User } from "@/types";
import { ServiceResult } from "@shared/types";
import { filePath } from "@/utils";
import { MediaItemBack } from "@/types";

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
        publicSources: [] as string[],
        chatIds: [] as ObjectId[],
      };
      const result = await db.collection("media").insertOne(doc);
      const url = `/api/media/${result.insertedId}/file`;
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
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async getAll(user: { _id: ObjectId }): Promise<ServiceResult> {
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
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async delete(user: User, id: string): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({
        _id: new ObjectId(id),
        ownerId: user._id,
      });
      if (!item) return { success: false, status: 404, message: "Not found." };
      await fs.unlink(filePath(item.filename, item.ownerId)).catch(() => {});
      await db.collection("media").deleteOne({ _id: new ObjectId(id) });
      return { success: true, status: 200, data: { message: "Deleted." } };
    } catch (e) {
      console.error("Delete media error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async addPublicSource(
    id: string,
    ownerId: ObjectId,
    source: string,
  ): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({
        _id: new ObjectId(id),
        ownerId,
      });
      if (!item) return { success: false, status: 404, message: "Not found." };
      await db
        .collection("media")
        .updateOne(
          { _id: new ObjectId(id) },
          { $addToSet: { publicSources: source } },
        );
      return { success: true, status: 200, data: { message: "Source added." } };
    } catch (e) {
      console.error("Add public source error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async removePublicSource(
    id: string,
    ownerId: ObjectId,
    source: string,
  ): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({
        _id: new ObjectId(id),
        ownerId,
      });
      if (!item) return { success: false, status: 404, message: "Not found." };
      await db
        .collection<MediaItemBack>("media")
        .updateOne({ _id: item._id }, { $pull: { publicSources: source } });
      return {
        success: true,
        status: 200,
        data: { message: "Source removed." },
      };
    } catch (e) {
      console.error("Remove public source error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async addChatId(
    id: string,
    ownerId: ObjectId,
    chatId: ObjectId,
  ): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      await db
        .collection("media")
        .updateOne(
          { _id: new ObjectId(id), ownerId },
          { $addToSet: { chatIds: chatId } },
        );
      return { success: true, status: 200, data: { message: "Chat added." } };
    } catch (e) {
      console.error("Add chat error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async serveFile(
    id: string,
    user?: User | null,
  ): Promise<ServiceResult<{ filePath: string; mimeType: string }>> {
    try {
      const db = await this.server.getDb();
      const item = await db
        .collection("media")
        .findOne({ _id: new ObjectId(id) });

      if (!item) return { success: false, status: 404, message: "Not found." };

      const fp = filePath(item.filename, item.ownerId);

      if (item.publicSources?.length > 0) {
        return {
          success: true,
          status: 200,
          data: { filePath: fp, mimeType: item.mimeType },
        };
      }

      if (!user)
        return { success: false, status: 401, message: "Unauthorized." };

      if (user._id.toString() === item.ownerId.toString()) {
        return {
          success: true,
          status: 200,
          data: { filePath: fp, mimeType: item.mimeType },
        };
      }
      if (item.chatIds?.length > 0) {
        const chat = await db.collection("chats").findOne({
          _id: { $in: item.chatIds.map((cid: ObjectId) => new ObjectId(cid)) },
          participants: user._id,
        });
        if (chat) {
          return {
            success: true,
            status: 200,
            data: { filePath: fp, mimeType: item.mimeType },
          };
        }
      }
      return { success: false, status: 403, message: "Forbidden." };
    } catch (e) {
      console.error("Serve file error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }
}
