import {
  updateProfileSchema,
  otpSchema,
  changePasswordSchema,
  publicProfileLangSchema,
  publicProfileSkillSchema,
  publicProfileCertificateSchema,
  ServiceResult,
  PublicProfileUser,
  PublicProfileLang,
  ChatMemberPreview,
  MediaItem,
  PublicProfileCertificate,
  IMAGE_MIME_EXT,
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
} from "@/utils";
import { ObjectId } from "mongodb";

const IMAGE_MIMES = Object.keys(IMAGE_MIME_EXT);
const CERT_MIMES = [...IMAGE_MIMES, "application/pdf"];
const INTRO_MIMES = ["video/"];

export class UsersService {
  private otpService: OtpService;
  private mediaService: MediaService;

  constructor(private server: IServer) {
    this.otpService = new OtpService(server);
    this.mediaService = new MediaService(server);
  }

  async updateProfile(req: Request, res: Response): Promise<ServiceResult> {
    try {
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
      const db = await this.server.getDb();
      const users = db.collection("users");
      const updates: Record<string, unknown> = {};
      const adds: Array<() => Promise<ServiceResult>> = [];
      const removes: Array<() => Promise<unknown>> = [];
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
          adds.push(() =>
            this.mediaService.addPublicSource(media._id, user._id, source),
          );
        }
        if (oldId) {
          removes.push(() =>
            this.mediaService.removePublicSource(oldId, user._id, source),
          );
        }
        return null;
      };

      if (username !== undefined && username !== user.username) {
        const exists = await users.findOne({
          username,
          _id: { $ne: user._id },
        });
        if (exists)
          return {
            success: false,
            status: 400,
            message: "user.usernameExists",
          };
        updates.username = username;
        if (user?.role !== "admin")
          updates.publicLink = `${CLIENT_URL}/@${username}`;
      }

      if (email !== undefined && email !== user.email) {
        const exists = await users.findOne({
          $or: [{ email }, { newEmail: email }],
          _id: { $ne: user._id },
        });
        if (exists)
          return { success: false, status: 400, message: "user.emailExists" };
        updates.newEmail = email;
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

      if (fullPhone !== undefined && fullPhone !== user.profile?.fullPhone) {
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
        if (theme) res.cookie("theme", theme, cookieOptions);
        if (lang) res.cookie("lang", lang, cookieOptions);
      }

      if (publicProfile !== undefined) {
        const { bio, languages, skills, certificates, header, introduction } =
          publicProfile;

        if (bio !== undefined) updates["publicProfile.bio"] = bio;

        if (skills !== undefined) {
          for (const skill of skills) {
            const r = publicProfileSkillSchema.safeParse(skill);
            if (!r.success)
              return {
                success: false,
                status: 400,
                message: r.error.issues[0].message,
              };
          }
          updates["publicProfile.skills"] = normalizeTagList(skills);
        }

        if (certificates !== undefined) {
          const resolved: PublicProfileCertificate[] = [];
          for (const cert of certificates) {
            const r = publicProfileCertificateSchema.safeParse(cert);
            if (!r.success)
              return {
                success: false,
                status: 400,
                message: r.error.issues[0].message,
              };
            if (cert.media) {
              const media = await this.resolveMedia(
                user._id,
                cert.media._id,
                CERT_MIMES,
              );
              if (!media) return badMedia;
              resolved.push({ ...cert, media });
            } else {
              resolved.push(cert);
            }
          }
          updates["publicProfile.certificates"] = normalizeTagList(resolved);
        }

        if (languages !== undefined) {
          const resolved: PublicProfileLang[] = [];
          for (const l of languages) {
            const r = publicProfileLangSchema.safeParse(l);
            if (!r.success)
              return {
                success: false,
                status: 400,
                message: r.error.issues[0].message,
              };
            const m = l.certificate?.media;
            if (m) {
              const media = await this.resolveMedia(
                user._id,
                m._id,
                CERT_MIMES,
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
              removes.push(() =>
                this.mediaService.removePublicSource(
                  oldMedia._id,
                  user._id,
                  `language-certificate:${old.value}`,
                ),
              );
            }
          }
          for (const n of newLangs) {
            const newMedia = n.certificate?.media;
            if (!newMedia) continue;
            const old = oldLangs.find((o) => o.value === n.value);
            if (old?.certificate?.media?._id !== newMedia._id) {
              adds.push(() =>
                this.mediaService.addPublicSource(
                  newMedia._id,
                  user._id,
                  `language-certificate:${n.value}`,
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

      if (Object.keys(updates).length === 0)
        return {
          success: true,
          status: 200,
          data: { message: "user.nothingToUpdate" },
        };

      for (const add of adds) {
        const r = await add();
        if (!r.success) return r;
      }
      await users.updateOne({ _id: user._id }, { $set: updates });
      await Promise.allSettled(removes.map((fn) => fn()));

      const updated = await users.findOne({ _id: user._id });
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        return { success: false, status: 400, message: "user.unavailableData" };
      }
      console.error("Update profile error:", error);
      return { success: false, status: 500, message: "general.unknown" };
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
              lang: "en",
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
        },
      );

      return { success: true, status: 200 };
    } catch (error) {
      console.error("Deactivate account error:", error);
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

      const check = await this.otpService.consume(
        user._id,
        "verify-phone",
        parsed.data.otp,
      );
      if (!check.ok)
        return { success: false, status: check.status, message: check.message };

      const db = await this.server.getDb();
      const fullPhone = user.profile?.newFullPhone ?? user.profile?.fullPhone;
      const phone = user.profile?.newPhone ?? user.profile?.phone;
      const code = user.profile?.newCode ?? user.profile?.code;

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            "profile.fullPhone": fullPhone,
            "profile.phone": phone,
            "profile.code": code,
            "acceptance.phoneVerified": true,
          },
          $unset: {
            "profile.newFullPhone": "",
            "profile.newPhone": "",
            "profile.newCode": "",
          },
        },
      );

      const updated = await db.collection("users").findOne({ _id: user._id });
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (error) {
      console.error("Verify phone OTP error:", error);
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

      const check = await this.otpService.consume(
        user._id,
        "verify-email",
        parsed.data.otp,
      );
      if (!check.ok)
        return { success: false, status: check.status, message: check.message };

      const db = await this.server.getDb();
      const confirmedEmail = check.record.destination;

      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            email: confirmedEmail,
            "acceptance.emailVerified": true,
          },
          $unset: { newEmail: "" },
        },
      );

      const updated = await db.collection("users").findOne({ _id: user._id });
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (error) {
      console.error("Verify email OTP error:", error);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async changePassword(user: User, body: unknown): Promise<ServiceResult> {
    try {
      const parsed = changePasswordSchema.safeParse(body);
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
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (error) {
      console.error("Change password error:", error);
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
    } catch (error) {
      console.error("Get user by username error:", error);
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
      _id: item._id.toString(),
      originalName: item.originalName,
      mimeType: item.mimeType,
      url: mediaUrl(`/api/media/${item._id}/file`),
    } as MediaItem;
  }
}
