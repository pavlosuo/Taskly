import { ObjectId } from "mongodb";
import fs from "fs/promises";
import { IServer, User } from "@/types";
import { ServiceResult } from "@shared/types";
import { filePath } from "@/utils";

export class MediaService {
  constructor(private server: IServer) {}

  async upload(user: User, file: Express.Multer.File): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const doc = {
        userId: user._id,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        visibility: "public",
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
        .find({ userId: user._id })
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
        userId: user._id,
      });
      if (!item) return { success: false, status: 404, message: "Not found." };
      await fs.unlink(filePath(item.filename, user)).catch(() => {});
      await db.collection("media").deleteOne({ _id: new ObjectId(id) });
      return { success: true, status: 200, data: { message: "Deleted." } };
    } catch (e) {
      console.error("Delete media error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async serveFile(
    user: User,
    id: string,
  ): Promise<ServiceResult<{ filePath: string; mimeType: string }>> {
    try {
      const db = await this.server.getDb();
      const item = await db
        .collection("media")
        .findOne({ _id: new ObjectId(id) });

      if (!item) return { success: false, status: 404, message: "Not found." };

      const path = filePath(item.filename, user);

      if (item.visibility === "public") {
        return {
          success: true,
          status: 200,
          data: {
            filePath: path,
            mimeType: item.mimeType,
          },
        };
      }

      if (item.visibility === "chat" && item.chatId) {
        const chat = await db.collection("chats").findOne({
          _id: new ObjectId(item.chatId),
          participants: user._id,
        });
        if (!chat)
          return { success: false, status: 403, message: "Forbidden." };

        return {
          success: true,
          status: 200,
          data: {
            filePath: path,
            mimeType: item.mimeType,
          },
        };
      }

      return { success: false, status: 403, message: "Forbidden." };
    } catch (e) {
      console.error("Serve file error:", e);
      return { success: false, status: 500, message: "Server error." };
    }
  }
}
