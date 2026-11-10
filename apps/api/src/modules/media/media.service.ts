import { ObjectId } from "mongodb";
import fs from "fs/promises";
import { ServiceResult } from "shared/types";
import { MEDIA_QUOTA_BYTES } from "shared/data";
import { toObjectId, mediaUrl, storage, mediaKey, INLINE_RE } from "@/utils";
import { MediaItemBack, ChatBack, MessageBack, IServer, User } from "@/types";

export class MediaService {
  constructor(private server: IServer) {}

  async upload(user: User, file: Express.Multer.File): Promise<ServiceResult> {
    let key: string | null = null;
    let stored = false;
    try {
      const db = await this.server.getDb();
      const [agg] = await db
        .collection("media")
        .aggregate([
          { $match: { ownerId: user._id } },
          { $group: { _id: null, total: { $sum: "$size" } } },
        ])
        .toArray();
      if ((agg?.total ?? 0) + file.size > MEDIA_QUOTA_BYTES) {
        return { success: false, status: 413, message: "media.quotaExceeded" };
      }
      key = mediaKey(user._id, file.filename);
      try {
        await storage.put(key, file.path, file.mimetype);
        stored = true;
      } catch (e) {
        console.error("R2 upload error:", e);
        return { success: false, status: 502, message: "general.unknown" };
      }
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
      await db
        .collection("media")
        .updateOne(
          { _id: result.insertedId },
          { $set: { url: mediaUrl(path) } },
        );
      return {
        success: true,
        status: 201,
        data: {
          media: { _id: result.insertedId, ...doc, url: mediaUrl(path) },
        },
      };
    } catch (e) {
      console.error("Upload media error:", e);
      if (stored && key) await storage.remove(key).catch(() => {});
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await fs.unlink(file.path).catch(() => {});
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
      const item = await db
        .collection("media")
        .findOne({ _id: mediaId, ownerId: user._id });
      if (!item)
        return { success: false, status: 404, message: "media.notFound" };

      const idStr = mediaId.toString();
      const [inMessage, inProfile] = await Promise.all([
        db
          .collection("messages")
          .findOne({ mediaIds: mediaId }, { projection: { _id: 1 } }),
        db.collection("users").findOne(
          {
            _id: item.ownerId,
            $or: [
              { "profile.avatar._id": idStr },
              { "publicProfile.header._id": idStr },
              { "publicProfile.introduction._id": idStr },
              { "publicProfile.certificates.media._id": idStr },
              { "publicProfile.languages.certificate.media._id": idStr },
            ],
          },
          { projection: { _id: 1 } },
        ),
      ]);
      if (item.publicSources?.length || inMessage || inProfile) {
        return { success: false, status: 409, message: "media.inUse" };
      }
      await db.collection("media").deleteOne({ _id: mediaId });
      await storage
        .remove(mediaKey(item.ownerId, item.filename))
        .catch((e) => console.error("R2 delete error:", e));
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
      const res = await db
        .collection("media")
        .updateOne(
          { _id: mediaId, ownerId },
          { $addToSet: { publicSources: source } },
        );
      if (res.matchedCount === 0)
        return { success: false, status: 404, message: "media.notFound" };
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
      const res = await db
        .collection<MediaItemBack>("media")
        .updateOne(
          { _id: mediaId, ownerId },
          { $pull: { publicSources: source } },
        );
      if (res.matchedCount === 0)
        return { success: false, status: 404, message: "media.notFound" };
      return { success: true, status: 200 };
    } catch (e) {
      console.error("Remove public source error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async serveFile(
    id: string,
    user?: User | null,
  ): Promise<ServiceResult<{ url: string }>> {
    try {
      const mediaId = toObjectId(id);
      if (!mediaId) {
        return { success: false, status: 400, message: "media.notFound" };
      }
      const db = await this.server.getDb();
      const item = await db.collection("media").findOne({ _id: mediaId });
      if (!item)
        return { success: false, status: 404, message: "media.notFound" };

      const sign = async (): Promise<ServiceResult<{ url: string }>> => ({
        success: true,
        status: 200,
        data: {
          url: await storage.signedUrl(mediaKey(item.ownerId, item.filename), {
            mimeType: item.mimeType,
            disposition: INLINE_RE.test(item.mimeType)
              ? "inline"
              : `attachment; filename*=UTF-8''${encodeURIComponent(item.originalName)}`,
          }),
        },
      });

      if (item.publicSources?.length > 0) return sign();
      if (!user) {
        return { success: false, status: 401, message: "general.unauthorized" };
      }
      if (user._id.equals(item.ownerId)) return sign();
      const messages = await db
        .collection<MessageBack>("messages")
        .find({ mediaIds: item._id }, { projection: { chatId: 1 } })
        .toArray();
      if (messages.length === 0) {
        return { success: false, status: 403, message: "general.forbidden" };
      }
      const chatIds = [
        ...new Set(messages.map((m) => m.chatId.toString())),
      ].map((cid) => new ObjectId(cid));
      const hasAccess = await db.collection<ChatBack>("chats").findOne({
        _id: { $in: chatIds },
        participants: user._id,
      });
      if (!hasAccess) {
        return { success: false, status: 403, message: "general.forbidden" };
      }
      return sign();
    } catch (e) {
      console.error("Serve file error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }
}
