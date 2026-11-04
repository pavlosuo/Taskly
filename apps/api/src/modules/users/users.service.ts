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
} from "shared/index";
import { CLIENT_URL } from "@/env";
import { OtpService } from "@/modules/otp/otp.service";
import {
  toPublicUser,
  extractMediaId,
  stripMediaFields,
  escapeRegex,
  normalizeTagList,
} from "@/utils";
import { IServer, User } from "@/types";
import { MediaService } from "@/modules/media/media.service";
import { Response, Request } from "express";
import bcrypt from "bcrypt";
import { cookieOptions } from "@/utils";

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
      const body = req.body;
      const parsed = updateProfileSchema.safeParse(body);
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
          $or: [{ email: email }, { newEmail: email }],
          _id: { $ne: user._id },
        });
        if (exists)
          return {
            success: false,
            status: 400,
            message: "user.emailExists",
          };
        updates.newEmail = email;
      }
      if (fullName !== undefined) updates["profile.fullName"] = fullName;

      if (avatar !== undefined && avatar !== null) {
        const currentAvatarId = extractMediaId(user.profile?.avatar?.url ?? "");
        const newAvatarId = avatar._id;

        if (currentAvatarId !== newAvatarId) {
          await this.mediaService.addPublicSource(
            newAvatarId,
            user._id,
            "avatar",
          );

          if (currentAvatarId) {
            await this.mediaService.removePublicSource(
              currentAvatarId,
              user._id,
              "avatar",
            );
          }
        }

        updates["profile.avatar"] = avatar;
      }

      if (avatar === null) {
        const oldId = extractMediaId(user.profile?.avatar?.url ?? "");
        if (oldId) {
          await this.mediaService.removePublicSource(oldId, user._id, "avatar");
        }
        updates["profile.avatar"] = null;
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
          return {
            success: false,
            status: 400,
            message: "user.phoneExists",
          };
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
        if (checkboxes !== undefined) {
          updates["settings.checkboxes"] = checkboxes;
        }
        if (theme) {
          res.cookie("theme", theme, cookieOptions);
        }
        if (lang) {
          res.cookie("lang", lang, cookieOptions);
        }
      }
      if (publicProfile !== undefined) {
        const { bio, languages, skills, certificates, header, introduction } =
          publicProfile;
        if (bio !== undefined) {
          updates["publicProfile.bio"] = bio;
        }
        if (certificates !== undefined) {
          for (const cert of certificates) {
            const certParsed = publicProfileCertificateSchema.safeParse(cert);

            if (!certParsed.success) {
              return {
                success: false,
                status: 400,
                message: certParsed.error.issues[0].message,
              };
            }
          }

          updates["publicProfile.certificates"] =
            normalizeTagList(certificates);
        }

        if (skills !== undefined) {
          for (const skill of skills) {
            const skillParsed = publicProfileSkillSchema.safeParse(skill);

            if (!skillParsed.success) {
              return {
                success: false,
                status: 400,
                message: skillParsed.error.issues[0].message,
              };
            }
          }

          updates["publicProfile.skills"] = normalizeTagList(skills);
        }

        if (languages !== undefined) {
          for (const lang of languages) {
            const langParsed = publicProfileLangSchema.safeParse(lang);
            if (!langParsed.success) {
              return {
                success: false,
                status: 400,
                message: langParsed.error.issues[0].message,
              };
            }
          }

          updates["publicProfile.languages"] = normalizeTagList(languages);

          const oldLangs: PublicProfileLang[] =
            user.publicProfile?.languages ?? [];
          const newLangs: PublicProfileLang[] = languages;

          const toRemove = oldLangs.filter((old) => {
            if (!old.certificate?.media) return false;
            const newLang = newLangs.find((n) => n.value === old.value);

            return (
              !newLang ||
              newLang.certificate?.media?._id !== old.certificate.media._id
            );
          });

          const toAdd = newLangs.filter((n) => {
            if (!n.certificate?.media) return false;

            const oldLang = oldLangs.find((o) => o.value === n.value);

            return (
              !oldLang ||
              oldLang.certificate?.media?._id !== n.certificate.media._id
            );
          });

          await Promise.all([
            ...toRemove.map((lang) =>
              this.mediaService.removePublicSource(
                lang.certificate!.media!._id,
                user._id,
                `language-certificate:${lang.value}`,
              ),
            ),
            ...toAdd.map((lang) =>
              this.mediaService.addPublicSource(
                lang.certificate!.media!._id,
                user._id,
                `language-certificate:${lang.value}`,
              ),
            ),
          ]);
        }

        if (header) {
          const oldId = extractMediaId(user.publicProfile?.header?.url ?? "");
          if (oldId) {
            await this.mediaService.removePublicSource(
              oldId,
              user._id,
              "header",
            );
          }
          await this.mediaService.addPublicSource(
            header._id,
            user._id,
            "header",
          );
          updates["publicProfile.header"] = header;
        }

        if (header === null) {
          const oldId = extractMediaId(user.publicProfile?.header?.url ?? "");
          if (oldId) {
            await this.mediaService.removePublicSource(
              oldId,
              user._id,
              "header",
            );
          }
          updates["publicProfile.header"] = null;
        }

        if (introduction) {
          const oldId = extractMediaId(
            user.publicProfile?.introduction?.url ?? "",
          );
          if (oldId) {
            await this.mediaService.removePublicSource(
              oldId,
              user._id,
              "introduction",
            );
          }
          await this.mediaService.addPublicSource(
            introduction._id,
            user._id,
            "introduction",
          );
          updates["publicProfile.introduction"] = introduction;
        }

        if (introduction === null) {
          const oldId = extractMediaId(
            user.publicProfile?.introduction?.url ?? "",
          );
          if (oldId) {
            await this.mediaService.removePublicSource(
              oldId,
              user._id,
              "introduction",
            );
          }
          updates["publicProfile.introduction"] = null;
        }
      }
      if (Object.keys(updates).length === 0)
        return {
          success: true,
          status: 200,
          data: { message: "user.nothingToUpdate" },
        };
      await users.updateOne({ _id: user._id }, { $set: updates });
      const updated = await users.findOne({ _id: user._id });
      return {
        success: true,
        status: 200,
        data: { user: toPublicUser(updated) },
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, status: 500, message: "general.unknown" };
    }
  }

  async deactivateAccount(user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      await db.collection("users").deleteOne({ _id: user._id });
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
        { username },
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
}
