import { ServiceResult } from "shared/types";
import { MEDIA_QUOTA_BYTES } from "shared/data";
import {
  toObjectId,
  mediaUrl,
  storage,
  mediaKey,
  defined,
  fileOf,
  TMP_ROOT,
  contentDisposition,
} from "@/utils";
import {
  MediaItemBack,
  ChatBack,
  MessageBack,
  IServer,
  User,
  MediaSource,
  MediaUpdate,
} from "@/types";
import fs from "fs/promises";
import { ObjectId, type Collection } from "mongodb";
import { processMedia } from "@/utils/process-media";
import path from "path";

export class MediaService {
  recovery: Promise<void>;

  constructor(private server: IServer) {
    this.recovery = this.recover().catch((e) =>
      console.error("Recover error:", e),
    );
  }

  private async recover() {
    const db = await this.server.getDb();
    const media = db.collection<MediaItemBack>("media");
    await media.updateMany(
      { status: "processing" },
      { $set: { status: "failed", size: 0, optimizing: false } },
    );
    await media.updateMany(
      { optimizing: true },
      { $set: { optimizing: false } },
    );
    await fs.rm(TMP_ROOT, { recursive: true, force: true });
  }

  async upload(user: User, file: Express.Multer.File): Promise<ServiceResult> {
    await this.recovery;
    const _id = new ObjectId();
    const { width, height } = file;
    let media: Collection<MediaItemBack> | undefined;
    let inserted = false;
    let background = false;
    let ready = false;
    try {
      const db = await this.server.getDb();
      media = db.collection<MediaItemBack>("media");
      const doc: MediaItemBack = {
        _id,
        ownerId: user._id,
        filename: file.filename,
        url: mediaUrl(`/api/media/${_id}/file`),
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        ...(width && height ? { width, height } : {}),
        status: "processing",
        optimizing: false,
        uploadedAt: new Date(),
        publicSources: [],
        chatIds: [],
      };
      await media.insertOne(doc);
      inserted = true;
      const [agg] = await media
        .aggregate([
          { $match: { ownerId: user._id } },
          { $group: { _id: null, total: { $sum: "$size" } } },
        ])
        .toArray();
      if ((agg?.total ?? 0) > MEDIA_QUOTA_BYTES) {
        await media.deleteOne({ _id });
        return { success: false, status: 413, message: "media.quotaExceeded" };
      }
      background = true;
      processMedia(
        {
          ownerId: user._id,
          localPath: file.path,
          mimeType: file.mimetype,
        },
        async (u: MediaUpdate) => {
          const set: Partial<MediaItemBack> = defined({
            filename: fileOf(u.key),
            size: u.size,
            mimeType: u.mimeType,
            width: u.width,
            height: u.height,
            durationSec: u.durationSec,
            posterFilename: u.posterKey ? fileOf(u.posterKey) : undefined,
            status: "ready" as const,
            optimizing: !u.final,
          });
          await media?.updateOne({ _id }, { $set: set });
          ready = true;
        },
      ).catch(async (e) => {
        console.error("Process media error:", e);
        await media
          ?.updateOne(
            { _id },
            {
              $set: ready
                ? { optimizing: false }
                : { status: "failed", size: 0, optimizing: false },
            },
          )
          .catch(() => {});
      });
      return { success: true, status: 201, data: { media: doc } };
    } catch (e) {
      console.error("Upload media error:", e);
      if (inserted) await media?.deleteOne({ _id }).catch(() => {});
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      if (!background) await fs.unlink(file.path).catch(() => {});
    }
  }

  async getAll(user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      const items = await db
        .collection("media")
        .find({ ownerId: user._id, status: { $ne: "failed" } })
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
      if (item.status === "processing" || item.optimizing) {
        return { success: false, status: 409, message: "media.processing" };
      }
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
      await Promise.all([
        storage.remove(mediaKey(item.ownerId, item.filename)),
        item.posterFilename
          ? storage.remove(mediaKey(item.ownerId, item.posterFilename))
          : undefined,
      ]).catch((e) => console.error("R2 delete error:", e));
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
  ): Promise<
    ServiceResult<
      | { kind: "local"; path: string; mimeType: string; disposition: string }
      | { kind: "remote"; url: string }
    >
  > {
    try {
      const mediaId = toObjectId(id);
      if (!mediaId) {
        return { success: false, status: 400, message: "media.notFound" };
      }
      const db = await this.server.getDb();
      const item = await db
        .collection<MediaItemBack>("media")
        .findOne({ _id: mediaId });

      if (!item)
        return { success: false, status: 404, message: "media.notFound" };

      const disposition = contentDisposition(item.mimeType, item.originalName);

      const sign = async (): Promise<ServiceResult<any>> => {
        if (item.status !== "ready") {
          const localPath = path.join(
            TMP_ROOT,
            item.ownerId.toString(),
            path.basename(item.filename),
          );
          const exists = await fs.access(localPath).then(
            () => true,
            () => false,
          );
          if (exists) {
            return {
              success: true,
              status: 200,
              data: {
                kind: "local",
                path: localPath,
                mimeType: item.mimeType,
                disposition,
              },
            };
          }
        }
        return {
          success: true,
          status: 200,
          data: {
            kind: "remote",
            url: await storage.signedUrl(
              mediaKey(item.ownerId, item.filename),
              {
                mimeType: item.mimeType,
                disposition,
              },
            ),
          },
        };
      };

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
