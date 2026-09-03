import {
  updateProfileSchema,
  otpSchema,
  changePasswordSchema,
  publicProfileLangSchema,
  publicProfileSkillSchema,
  publicProfileCertificateSchema,
} from "@shared/schemas";
import { CLIENT_URL, NODE_ENV } from "@/env";
import { ServiceResult, PublicProfileUser } from "@shared/types";
import { OtpService } from "@/modules/otp/otp.service";
import { toPublicUser, extractMediaId } from "@/utils";
import bcrypt from "bcrypt";
import { IServer, User, AuthRequest } from "@/types";
import { MediaService } from "@/modules/media/media.service";
import { stripMediaFields } from "@/utils";
import { Response } from "express";

export class UsersService {
  private otpService: OtpService;
  private mediaService: MediaService;

  constructor(private server: IServer) {
    this.otpService = new OtpService(server);
    this.mediaService = new MediaService(server);
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<ServiceResult> {
    const user = req.user;
    const body = req.body;
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };
    try {
      const {
        username,
        fullName,
        fullPhone,
        phone,
        code,
        avatar,
        payout,
        email,
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
            message: "Username already taken.",
          };
        updates.username = username;
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
            message: "Email already in use.",
          };
        updates.newEmail = email;
      }
      if (fullName !== undefined) updates["profile.fullName"] = fullName;
      if (avatar) {
        await this.mediaService.addPublicSource(avatar._id, user._id, "avatar");
        updates["profile.avatar"] = avatar;
        if (
          user.profile?.avatar?.url &&
          user.profile?.avatar?.url !== avatar?.url
        ) {
          const oldId = extractMediaId(user.profile.avatar.url);
          if (oldId) {
            await this.mediaService.removePublicSource(
              oldId,
              user._id,
              "avatar",
            );
          }
        }
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
            message: "Phone already in use.",
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
      if (parsed.data.settings !== undefined) {
        const { lang, theme, checkboxes } = parsed.data.settings;
        if (lang !== undefined) updates["settings.lang"] = lang;
        if (theme !== undefined) updates["settings.theme"] = theme;
        if (checkboxes !== undefined) {
          updates["settings.checkboxes"] = checkboxes;
        }
        const cookieOptions = {
          httpOnly: true,
          secure: NODE_ENV === "production",
          sameSite: "lax" as const,
          maxAge: 365 * 24 * 60 * 60 * 1000,
          path: "/",
        };
        if (theme) {
          res.cookie("theme", theme, cookieOptions);
        }
        if (lang) {
          res.cookie("lang", lang, cookieOptions);
        }
      }
      if (parsed.data.publicProfile !== undefined) {
        const { bio, languages, skills, certificates, header, introduction } =
          parsed.data.publicProfile;

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

          updates["publicProfile.certificates"] = certificates;
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

          updates["publicProfile.skills"] = skills;
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

          updates["publicProfile.languages"] = languages;

          const oldLangs = user.publicProfile?.languages ?? [];
          const newLangs = languages;

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
          data: { message: "Nothing to update." },
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
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async deactivateAccount(user: User): Promise<ServiceResult> {
    try {
      const db = await this.server.getDb();
      await db.collection("users").deleteOne({ _id: user._id });
      return { success: true, status: 200, data: {} };
    } catch (error) {
      console.error("Deactivate account error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async verifyPhoneOtp(user: User, body: unknown): Promise<ServiceResult> {
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

    try {
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
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async verifyEmailOtp(user: User, body: unknown): Promise<ServiceResult> {
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

    try {
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
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async changePassword(user: User, body: unknown): Promise<ServiceResult> {
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success)
      return {
        success: false,
        status: 400,
        message: parsed.error.issues[0].message,
      };

    const { oldPassword, newPassword } = parsed.data;

    try {
      const db = await this.server.getDb();
      const dbUser = await db
        .collection("users")
        .findOne<{ passwordHash: string }>({ _id: user._id });

      if (!dbUser)
        return { success: false, status: 404, message: "User not found." };

      const isValid = await bcrypt.compare(oldPassword, dbUser.passwordHash);
      if (!isValid)
        return {
          success: false,
          status: 401,
          message: "Current password is incorrect.",
        };

      const sameAsOld = await bcrypt.compare(newPassword, dbUser.passwordHash);
      if (sameAsOld)
        return {
          success: false,
          status: 400,
          message: "New password must differ from the current password.",
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
      return { success: false, status: 500, message: "Server error." };
    }
  }

  async getUserByUsername(
    userRequest: User,
    body: { username: string },
  ): Promise<ServiceResult> {
    const { username } = body;
    try {
      if (!username)
        return {
          success: false,
          status: 400,
          message: "Username is required.",
        };
      const db = await this.server.getDb();
      const user = await db
        .collection("users")
        .findOne<User>({ username: username });

      if (!user) {
        return { success: false, status: 404, message: "User not found." };
      }

      if (
        user?.settings?.checkboxes?.privateProfile &&
        userRequest?._id !== user._id &&
        userRequest?.role !== "admin"
      ) {
        return { success: false, status: 403, message: "Forbidden" };
      }

      if (user.role === "admin") {
        return {
          success: false,
          status: 404,
          message: "User not found.",
        };
      }

      const doc = stripMediaFields({
        lastSeenAt: user.lastSeenAt,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        profile: {
          fullName: user.profile.fullName,
          avatar: user.profile.avatar,
          initials: user.profile.initials,
        },
        publicProfile: user.publicProfile,
      } as PublicProfileUser);

      return {
        success: true,
        status: 200,
        data: {
          user: doc,
        },
      };
    } catch (error) {
      console.error("Get user by nick error:", error);
      return { success: false, status: 500, message: "Server error." };
    }
  }
}
