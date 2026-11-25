import {
  updateProfileSchema,
  otpSchema,
  changePasswordSchema,
  ServiceResult,
  PublicProfileUser,
  PublicProfileLang,
  ChatMemberPreview,
  MediaItem,
  PublicProfileCertificate,
  IMAGE_MIME_EXT,
  Tag,
  HttpError,
} from "shared/index";
import { CLIENT_URL } from "@/env";
import { OtpService } from "@/modules/otp/otp.service";
import { IServer, User } from "@/types";
import { MediaService } from "@/modules/media/media.service";
import { Response, Request } from "express";
import bcrypt from "bcrypt";
import {
  cookieOptions,
  storage,
  mediaKey,
  mediaUrl,
  toObjectId,
  extractMediaId,
  toPublicUser,
  stripMediaFields,
  escapeRegex,
  normalizeTagList,
  syncCatalogCounts,
} from "@/utils";
import { ObjectId, ClientSession, Document, MongoServerError } from "mongodb";

const IMAGE_MIMES = Object.keys(IMAGE_MIME_EXT);
const INTRO_MIMES = ["video/"];

export class UsersService {
  private otpService: OtpService;
  private mediaService: MediaService;

  constructor(private server: IServer) {
    this.otpService = new OtpService(server);
    this.mediaService = new MediaService(server);
  }

  async updateProfile(req: Request, res: Response): Promise<ServiceResult> {
    const user = req.user;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };
    const {
      username,
      fullName,
      fullPhone,
      phone,
      code,
      avatar,
      payout,
      email,
      settings,
      publicProfile,
    } = parsed.data;
    const session = this.server.getClient().startSession();

    try {
      const db = await this.server.getDb();
      const users = db.collection("users");
      const updates: Record<string, unknown> = {};
      const unsets: Record<string, ""> = {};
      const adds: Array<(s: ClientSession) => Promise<ServiceResult>> = [];
      const removes: Array<(s: ClientSession) => Promise<ServiceResult>> = [];
      const badMedia: ServiceResult = {
        success: false,
        status: 400,
        message: "media.notFound",
      };

      const setMedia = async (
        field: string,
        source: string,
        incoming: { _id: string } | null,
        oldUrl: string | undefined,
        mimes: string[],
      ): Promise<ServiceResult | null> => {
        const oldId = extractMediaId(oldUrl ?? "");
        if (incoming === null) {
          updates[field] = null;
        } else {
          const media = await this.resolveMedia(user._id, incoming._id, mimes);
          if (!media) return badMedia;
          updates[field] = media;
          if (oldId === media._id) return null;
          adds.push((s) =>
            this.mediaService.addPublicSource(media._id, user._id, source, s),
          );
        }
        if (oldId) {
          removes.push((s) =>
            this.mediaService.removePublicSource(oldId, user._id, source, s),
          );
        }
        return null;
      };

      if (username !== undefined && username !== user.username) {
        const exists = await users.findOne(
          { username, _id: { $ne: user._id } },
          { collation: { locale: "en", strength: 2 } },
        );
        if (exists)
          return {
            success: false,
            status: 400,
            message: "user.usernameExists",
          };
        updates.username = username;
        if (user.role !== "admin")
          updates.publicLink = `${CLIENT_URL}/@${username}`;
      }

      if (email !== undefined) {
        if (email === user.email) {
          if (user.newEmail) {
            unsets.newEmail = "";
            updates["otps.verify-email.expiresAt"] = new Date(0);
          }
        } else if (email !== user.newEmail) {
          const exists = await users.findOne(
            {
              $or: [{ email }, { newEmail: email }],
              _id: { $ne: user._id },
            },
            { collation: { locale: "en", strength: 2 } },
          );
          if (exists)
            return { success: false, status: 400, message: "user.emailExists" };
          updates.newEmail = email;
          updates["otps.verify-email.expiresAt"] = new Date(0);
        }
      }

      if (fullName !== undefined) updates["profile.fullName"] = fullName;

      if (avatar !== undefined) {
        const err = await setMedia(
          "profile.avatar",
          "avatar",
          avatar,
          user.profile?.avatar?.url,
          IMAGE_MIMES,
        );
        if (err) return err;
      }

      if (fullPhone !== undefined) {
        if (fullPhone === user.profile?.fullPhone) {
          if (user.profile?.newFullPhone) {
            unsets["profile.newFullPhone"] = "";
            unsets["profile.newPhone"] = "";
            unsets["profile.newCode"] = "";
            updates["otps.verify-phone.expiresAt"] = new Date(0);
          }
        } else if (fullPhone !== user.profile?.newFullPhone) {
          if (phone === undefined || code === undefined)
            return { success: false, status: 400, message: "phone.invalid" };
          const phoneTaken = await users.findOne({
            $or: [
              { "profile.fullPhone": fullPhone },
              { "profile.newFullPhone": fullPhone },
            ],
            _id: { $ne: user._id },
          });
          if (phoneTaken)
            return { success: false, status: 400, message: "user.phoneExists" };
          updates["profile.newFullPhone"] = fullPhone;
          updates["profile.newPhone"] = phone;
          updates["profile.newCode"] = code;
          updates["otps.verify-phone.expiresAt"] = new Date(0);
        }
      }

      if (payout !== undefined) {
        updates.payout = {
          iban: payout.iban.replace(/\s/g, "").toUpperCase(),
          bankName: payout.bankName,
        };
      }

      if (settings !== undefined) {
        const { lang, theme, checkboxes } = settings;
        if (lang !== undefined) updates["settings.lang"] = lang;
        if (theme !== undefined) updates["settings.theme"] = theme;
        if (checkboxes !== undefined)
          updates["settings.checkboxes"] = checkboxes;
      }

      if (publicProfile !== undefined) {
        const { bio, languages, skills, certificates, header, introduction } =
          publicProfile;

        if (bio !== undefined) updates["publicProfile.bio"] = bio;

        if (skills !== undefined) {
          updates["publicProfile.skills"] = normalizeTagList(skills);
        }

        if (certificates !== undefined) {
          const resolved: PublicProfileCertificate[] = [];
          for (const cert of certificates) {
            if (cert.media) {
              const media = await this.resolveMedia(
                user._id,
                cert.media._id,
                IMAGE_MIMES,
              );
              if (!media) return badMedia;
              resolved.push({ ...cert, media });
            } else {
              resolved.push(cert);
            }
          }
          const newCerts = normalizeTagList(
            resolved,
          ) as PublicProfileCertificate[];
          const oldCerts: PublicProfileCertificate[] =
            user.publicProfile?.certificates ?? [];
          updates["publicProfile.certificates"] = newCerts;

          for (const old of oldCerts) {
            const oldMedia = old.media;
            if (!oldMedia) continue;
            const next = newCerts.find((n) => n.value === old.value);
            if (next?.media?._id !== oldMedia._id) {
              removes.push((s) =>
                this.mediaService.removePublicSource(
                  oldMedia._id,
                  user._id,
                  `certificate:${old.value}`,
                  s,
                ),
              );
            }
          }
          for (const n of newCerts) {
            const newMedia = n.media;
            if (!newMedia) continue;
            const old = oldCerts.find((o) => o.value === n.value);
            if (old?.media?._id !== newMedia._id) {
              adds.push((s) =>
                this.mediaService.addPublicSource(
                  newMedia._id,
                  user._id,
                  `certificate:${n.value}`,
                  s,
                ),
              );
            }
          }
        }

        if (languages !== undefined) {
          const resolved: PublicProfileLang[] = [];
          for (const l of languages) {
            const m = l.certificate?.media;
            if (m) {
              const media = await this.resolveMedia(
                user._id,
                m._id,
                IMAGE_MIMES,
              );
              if (!media) return badMedia;
              resolved.push({ ...l, certificate: { ...l.certificate, media } });
            } else {
              resolved.push(l);
            }
          }
          const newLangs = normalizeTagList(resolved) as PublicProfileLang[];
          const oldLangs: PublicProfileLang[] =
            user.publicProfile?.languages ?? [];
          updates["publicProfile.languages"] = newLangs;

          for (const old of oldLangs) {
            const oldMedia = old.certificate?.media;
            if (!oldMedia) continue;
            const next = newLangs.find((n) => n.value === old.value);
            if (next?.certificate?.media?._id !== oldMedia._id) {
              removes.push((s) =>
                this.mediaService.removePublicSource(
                  oldMedia._id,
                  user._id,
                  `language-certificate:${old.value}`,
                  s,
                ),
              );
            }
          }
          for (const n of newLangs) {
            const newMedia = n.certificate?.media;
            if (!newMedia) continue;
            const old = oldLangs.find((o) => o.value === n.value);
            if (old?.certificate?.media?._id !== newMedia._id) {
              adds.push((s) =>
                this.mediaService.addPublicSource(
                  newMedia._id,
                  user._id,
                  `language-certificate:${n.value}`,
                  s,
                ),
              );
            }
          }
        }

        if (header !== undefined) {
          const err = await setMedia(
            "publicProfile.header",
            "header",
            header,
            user.publicProfile?.header?.url,
            IMAGE_MIMES,
          );
          if (err) return err;
        }

        if (introduction !== undefined) {
          const err = await setMedia(
            "publicProfile.introduction",
            "introduction",
            introduction,
            user.publicProfile?.introduction?.url,
            INTRO_MIMES,
          );
          if (err) return err;
        }
      }

      if (
        Object.keys(updates).length === 0 &&
        Object.keys(unsets).length === 0
      ) {
        return {
          success: true,
          status: 200,
          data: { message: "user.nothingToUpdate" },
        };
      }

      let before = null as Document | null;

      await session.withTransaction(async () => {
        for (const add of adds) {
          const r = await add(session);
          if (!r.success) throw { status: r.status, message: r.message };
        }

        for (const remove of removes) {
          const r = await remove(session);
          if (!r.success && r.status !== 404)
            throw { status: r.status, message: r.message };
        }

        before = await users.findOneAndUpdate(
          { _id: user._id },
          {
            ...(Object.keys(updates).length ? { $set: updates } : {}),
            ...(Object.keys(unsets).length ? { $unset: unsets } : {}),
          },
          {
            session,
            returnDocument: "before",
            projection: {
              "publicProfile.skills": 1,
              "publicProfile.certificates": 1,
            },
          },
        );
      });

      const catalogSync: Promise<unknown>[] = [];

      if (updates["publicProfile.skills"] !== undefined) {
        catalogSync.push(
          syncCatalogCounts(
            db,
            "skills",
            before?.publicProfile?.skills ?? [],
            updates["publicProfile.skills"] as Tag[],
          ),
        );
      }

      if (updates["publicProfile.certificates"] !== undefined) {
        catalogSync.push(
          syncCatalogCounts(
            db,
            "certificates",
            before?.publicProfile?.certificates ?? [],
            updates["publicProfile.certificates"] as Tag[],
          ),
        );
      }

      (await Promise.allSettled(catalogSync)).forEach((r) => {
        if (r.status === "rejected")
          console.error("Catalog count sync error:", r.reason);
      });

      if (settings?.theme) res.cookie("theme", settings.theme, cookieOptions);
      if (settings?.lang) res.cookie("lang", settings.lang, cookieOptions);

      const hiddenNext = settings?.checkboxes?.noOnlineStatus;
      if (
        hiddenNext !== undefined &&
        user.role !== "admin" &&
        hiddenNext !== !!user.settings?.checkboxes?.noOnlineStatus
      ) {
        this.server.setPresenceVisibility(user._id.toString(), hiddenNext);
      }

      const updated = await users.findOne({ _id: user._id });

      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (e: unknown) {
      if (e instanceof HttpError) {
        return { success: false, status: e.status, message: e.message };
      }
      if (e instanceof MongoServerError && e?.code === 11000) {
        const key = Object.keys(e.keyPattern ?? {})[0];
        const message =
          key === "username"
            ? "user.usernameExists"
            : key === "email"
              ? "user.emailExists"
              : key === "profile.fullPhone"
                ? "user.phoneExists"
                : "user.unavailableData";
        return { success: false, status: 400, message };
      }
      console.error("Update profile error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    } finally {
      await session.endSession();
    }
  }

  async deactivateAccount(
    user: User,
    password: unknown,
  ): Promise<ServiceResult> {
    try {
      if (typeof password !== "string" || !password)
        return {
          success: false,
          status: 400,
          message: "user.invalidCredentials",
        };
      const db = await this.server.getDb();
      const full = await db.collection("users").findOne({ _id: user._id });
      if (
        !full?.passwordHash ||
        !(await bcrypt.compare(password, full.passwordHash))
      )
        return {
          success: false,
          status: 401,
          message: "user.invalidCredentials",
        };

      const busy = await db.collection("tasks").findOne({
        status: { $in: ["assigned", "pending_confirmation"] },
        $or: [{ clientId: user._id }, { assignedTaskerId: user._id }],
      });

      if (busy)
        return { success: false, status: 409, message: "user.hasActiveTasks" };

      const now = new Date();
      const openTasks = await db
        .collection("tasks")
        .find(
          { clientId: user._id, status: "open" },
          { projection: { _id: 1 } },
        )
        .toArray();

      if (openTasks.length) {
        const ids = openTasks.map((t) => t._id);
        await db
          .collection("taskResponses")
          .updateMany(
            { taskId: { $in: ids }, status: "pending" },
            { $set: { status: "rejected", updatedAt: now } },
          );
        await db.collection("tasks").updateMany(
          { _id: { $in: ids }, status: "open" },
          {
            $set: {
              status: "cancelled",
              cancelReason: "client",
              responsesCount: 0,
              updatedAt: now,
            },
          },
        );
      }

      await db.collection("notifications").deleteMany({ userId: user._id });

      const files = await db
        .collection("media")
        .find({ ownerId: user._id }, { projection: { filename: 1 } })
        .toArray();

      await Promise.all(
        files.map((f) =>
          storage.remove(mediaKey(user._id, f.filename)).catch(() => {}),
        ),
      );

      await db.collection("media").deleteMany({ ownerId: user._id });
      const tag = user._id.toString();
      const session = this.server.getClient().startSession();

      try {
        await session.withTransaction(async () => {
          const openTasks = await db
            .collection("tasks")
            .find(
              { clientId: user._id, status: "open" },
              { projection: { _id: 1 }, session },
            )
            .toArray();

          if (openTasks.length) {
            const ids = openTasks.map((t) => t._id);
            await db
              .collection("taskResponses")
              .updateMany(
                { taskId: { $in: ids }, status: "pending" },
                { $set: { status: "rejected", updatedAt: now } },
                { session },
              );
            await db.collection("tasks").updateMany(
              { _id: { $in: ids }, status: "open" },
              {
                $set: {
                  status: "cancelled",
                  cancelReason: "client",
                  responsesCount: 0,
                  updatedAt: now,
                },
              },
              { session },
            );
          }

          await db.collection("users").updateOne(
            { _id: user._id },
            {
              $set: {
                username: `deleted_${tag}`,
                email: `deleted_${tag}@deleted.invalid`,
                passwordHash: "",
                deletedAt: now,
                acceptance: {
                  phoneVerified: false,
                  emailVerified: false,
                  personVerified: false,
                  agreementAccepted: false,
                },
                payout: { iban: "", bankName: "" },
                profile: {
                  fullName: "user.deleted",
                  phone: "",
                  code: "",
                  fullPhone: "",
                  avatar: null,
                  initials: "",
                },
                settings: {
                  lang: "fi-FI",
                  theme: "light",
                  checkboxes: {
                    email: false,
                    phone: false,
                    privateProfile: true,
                    noOnlineStatus: true,
                  },
                },
                publicProfile: {
                  bio: "",
                  skills: [],
                  certificates: [],
                  languages: [],
                  header: null,
                  introduction: null,
                },
              },
              $unset: {
                newEmail: "",
                publicLink: "",
                lastSeenAt: "",
                resetTokenHash: "",
              },
              $inc: { tokenVersion: 1 },
            },
            { session },
          );
        });
      } finally {
        await session.endSession();
      }

      this.server.getIO()?.in(`user:${tag}`).disconnectSockets(true);

      const cleanup = async (label: string, fn: () => Promise<unknown>) => {
        try {
          await fn();
        } catch (e) {
          console.error(`Deactivate cleanup failed (${label}):`, e);
        }
      };

      await cleanup("notifications", () =>
        db.collection("notifications").deleteMany({ userId: user._id }),
      );

      await cleanup("media", async () => {
        const files = await db
          .collection("media")
          .find({ ownerId: user._id }, { projection: { filename: 1 } })
          .toArray();
        await Promise.all(
          files.map((f) =>
            storage.remove(mediaKey(user._id, f.filename)).catch(() => {}),
          ),
        );
        await db.collection("media").deleteMany({ ownerId: user._id });
      });

      await cleanup("catalog counts", async () => {
        await syncCatalogCounts(
          db,
          "skills",
          (user.publicProfile?.skills as Tag[]) || [],
          [],
        );
        await syncCatalogCounts(
          db,
          "certificates",
          (user.publicProfile?.certificates as Tag[]) || [],
          [],
        );
      });

      return { success: true, status: 200 };
    } catch (e) {
      console.error("Deactivate account error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async verifyPhoneOtp(user: User, body: unknown): Promise<ServiceResult> {
    try {
      const parsed = otpSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };

      const pending = user.profile?.newFullPhone;
      const expected = pending ?? user.profile?.fullPhone;
      if (!expected)
        return { success: false, status: 400, message: "otp.missingFullPhone" };

      const check = await this.otpService.consume(
        user._id,
        "verify-phone",
        parsed.data.otp,
        expected,
      );
      if (!check.ok)
        return { success: false, status: check.status, message: check.message };

      const confirmed = check.record.destination;
      const isPending = pending === confirmed;
      const db = await this.server.getDb();
      const users = db.collection("users");
      const taken = await users.findOne(
        { "profile.fullPhone": confirmed, _id: { $ne: user._id } },
        { projection: { _id: 1 } },
      );
      if (taken)
        return { success: false, status: 400, message: "user.phoneExists" };

      const res = await users.updateOne(
        {
          _id: user._id,
          ...(isPending
            ? { "profile.newFullPhone": confirmed }
            : { "profile.fullPhone": confirmed }),
        },
        {
          $set: {
            "profile.fullPhone": confirmed,
            ...(isPending && {
              "profile.phone": user.profile?.newPhone,
              "profile.code": user.profile?.newCode,
            }),
            "acceptance.phoneVerified": true,
          },
          $unset: {
            "profile.newFullPhone": "",
            "profile.newPhone": "",
            "profile.newCode": "",
          },
        },
      );

      if (res.matchedCount === 0) {
        return { success: false, status: 400, message: "otp.invalid" };
      }
      const updated = await users.findOne({ _id: user._id });
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (e: unknown) {
      if (e instanceof MongoServerError && e?.code === 11000) {
        return { success: false, status: 400, message: "user.phoneExists" };
      }
      console.error("Verify phone OTP error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async verifyEmailOtp(user: User, body: unknown): Promise<ServiceResult> {
    try {
      const parsed = otpSchema.safeParse(body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };

      const pending = user.newEmail;
      const expected = pending ?? user.email;

      const check = await this.otpService.consume(
        user._id,
        "verify-email",
        parsed.data.otp,
        expected,
      );
      if (!check.ok)
        return { success: false, status: check.status, message: check.message };

      const confirmed = check.record.destination;
      const isPending = pending === confirmed;
      const db = await this.server.getDb();
      const users = db.collection("users");

      const taken = await users.findOne(
        { email: confirmed, _id: { $ne: user._id } },
        { projection: { _id: 1 }, collation: { locale: "en", strength: 2 } },
      );
      if (taken)
        return { success: false, status: 400, message: "user.emailExists" };

      const res = await users.updateOne(
        {
          _id: user._id,
          ...(isPending ? { newEmail: confirmed } : { email: confirmed }),
        },
        {
          $set: { email: confirmed, "acceptance.emailVerified": true },
          $unset: { newEmail: "" },
        },
      );
      if (res.matchedCount === 0)
        return { success: false, status: 400, message: "otp.invalid" };

      const updated = await users.findOne({ _id: user._id });
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (e: unknown) {
      if (e instanceof MongoServerError && e?.code === 11000) {
        return { success: false, status: 400, message: "user.emailExists" };
      }
      console.error("Verify email OTP error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async changePassword(req: Request, res: Response): Promise<ServiceResult> {
    const user = req.user;
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success)
        return {
          success: false,
          status: 400,
          message: parsed.error.issues[0].message,
        };

      const { oldPassword, newPassword } = parsed.data;

      const db = await this.server.getDb();
      const dbUser = await db
        .collection("users")
        .findOne<{ passwordHash: string }>({ _id: user._id });

      if (!dbUser)
        return {
          success: false,
          status: 404,
          message: "user.notFound",
        };

      const isValid = await bcrypt.compare(oldPassword, dbUser.passwordHash);
      if (!isValid)
        return {
          success: false,
          status: 401,
          message: "password.oldInvalid",
        };

      const sameAsOld = await bcrypt.compare(newPassword, dbUser.passwordHash);
      if (sameAsOld)
        return {
          success: false,
          status: 400,
          message: "password.newSameAsOld",
        };

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await db
        .collection("users")
        .updateOne({ _id: user._id }, { $set: { passwordHash } });

      const updated = await db.collection("users").findOne({ _id: user._id });

      if (user) await this.server.revokeSessions(user._id);

      this.server.issueToken(res, updated as User);

      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (e) {
      console.error("Change password error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async getUserForProfilePage(
    userRequest: User | undefined,
    usernameRequest: string,
  ): Promise<ServiceResult> {
    try {
      const username = usernameRequest?.trim();
      if (!username) {
        return {
          success: false,
          status: 400,
          message: "user.usernameMissing",
        };
      }
      const db = await this.server.getDb();
      const user = await db.collection("users").findOne<User>(
        { username, deletedAt: { $exists: false } },
        {
          collation: { locale: "en", strength: 2 },
          projection: {
            username: 1,
            role: 1,
            createdAt: 1,
            lastSeenAt: 1,
            "profile.fullName": 1,
            "profile.avatar": 1,
            "profile.initials": 1,
            publicProfile: 1,
            "settings.checkboxes": 1,
            "acceptance.personVerified": 1,
          },
        },
      );

      if (!user || user.role === "admin") {
        return {
          success: false,
          status: 404,
          message: "user.notFound",
        };
      }

      const isOwner = !!userRequest?._id?.equals(user._id);
      const isAdmin = userRequest?.role === "admin";
      const isPrivate = !!user.settings?.checkboxes?.privateProfile;

      if (isPrivate && !isOwner && !isAdmin) {
        return {
          success: false,
          status: 404,
          message: "user.notFound",
        };
      }

      const hideLastSeen = !!user.settings?.checkboxes?.noOnlineStatus;

      const [ratings, completed] = await Promise.all([
        db
          .collection("reviews")
          .aggregate([
            {
              $match: {
                $or: [{ targetId: user._id }, { authorId: user._id }],
              },
            },
            {
              $group: {
                _id: "$targetId",
                avg: { $avg: "$rating" },
                count: { $sum: 1 },
              },
            },
          ])
          .toArray(),
        db
          .collection("tasks")
          .aggregate([
            {
              $match: {
                assignedTaskerId: user._id,
                status: "completed",
              },
            },
            { $group: { _id: "$assignedTaskerId", count: { $sum: 1 } } },
          ])
          .toArray(),
      ]);

      const doc = stripMediaFields({
        _id: user._id.toString(),
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        ...(hideLastSeen ? {} : { lastSeenAt: user.lastSeenAt }),
        profile: {
          fullName: user.profile?.fullName ?? "",
          avatar: user.profile?.avatar ?? null,
          initials: user.profile?.initials ?? "",
        },
        publicProfile: user.publicProfile,
        acceptance: {
          personVerified: !!user.acceptance?.personVerified,
        },
        rating: ratings[0],
        completedCount: completed[0]?.count ?? 0,
      }) as PublicProfileUser;

      const accessReason = isOwner
        ? "same-account"
        : isAdmin
          ? "admin"
          : "public";

      return {
        success: true,
        status: 200,
        data: { user: doc, ...(isPrivate ? { accessReason } : {}) },
      };
    } catch (e) {
      console.error("Get user by username error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async search(
    currentUser: User,
    q: string,
  ): Promise<ServiceResult<{ items: ChatMemberPreview[] }>> {
    try {
      const query = q?.trim();
      if (!query || query.length < 2) {
        return { success: true, status: 200, data: { items: [] } };
      }
      const db = await this.server.getDb();
      const users = await db
        .collection("users")
        .find(
          {
            _id: { $ne: currentUser._id },
            username: { $regex: escapeRegex(query), $options: "i" },
            role: { $ne: "admin" },
            "settings.checkboxes.privateProfile": { $ne: true },
          },
          {
            projection: {
              username: 1,
              "profile.fullName": 1,
              "profile.avatar": 1,
              "profile.initials": 1,
            },
            limit: 10,
          },
        )
        .toArray();
      const items: ChatMemberPreview[] = users.map((u) => ({
        _id: u._id.toString(),
        username: u.username,
        fullName: u.profile?.fullName ?? "",
        avatar: stripMediaFields(u.profile?.avatar ?? null),
        initials: u.profile?.initials ?? "",
      }));
      return { success: true, status: 200, data: { items } };
    } catch (e) {
      console.error("Search users error:", e);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  private async resolveMedia(
    ownerId: ObjectId,
    id: string,
    mimes: string[],
  ): Promise<MediaItem | null> {
    const _id = toObjectId(id);
    if (!_id) return null;
    const db = await this.server.getDb();
    const item = await db.collection("media").findOne({ _id, ownerId });
    if (!item || !mimes.some((m) => item.mimeType.startsWith(m))) return null;
    return {
      ...item,
      _id: item._id.toString(),
      url: mediaUrl(`/api/media/${item._id}/file`),
    } as MediaItem;
  }
}
