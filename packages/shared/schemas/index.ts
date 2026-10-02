import { z } from "zod";
import libphonenumber from "google-libphonenumber";
import { LANGS, CERF, MAX_FILE_SIZE, FINNISH_BANKS_VALUES } from "shared/data";
import { removeHtml, validateIban, validatePassword } from "shared/utils";
import {
  LoginForm,
  RegisterForm,
  UpdateProfileForm,
  NewPasswordForm,
  Role,
  Lang,
  Theme,
  Payout,
  PublicProfile,
  PublicProfileLang,
  PublicProfileSkill,
  PublicProfileCertificate,
  UserSettings,
  MediaItem,
} from "shared/types";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

const phoneField = z.string().superRefine((value, ctx) => {
  if (!value.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "phone.required",
    });
    return;
  }
  try {
    const phone = phoneUtil.parse(value);
    if (!phoneUtil.isValidNumber(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "phone.invalid",
      });
    }
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "phone.invalid",
    });
  }
});

const emailField = z
  .string()
  .trim()
  .min(1, "email.required")
  .max(254, "email.tooLong")
  .refine((val) => !val.includes(" "), "email.noSpaces")
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "email.noDomain")
  .email("email.invalid");

const passwordField = z.string().superRefine((val, ctx) => {
  if (!val) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "password.required",
    });
    return;
  }
  const result = validatePassword(val);
  if (result !== true) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: result,
    });
  }
});

const passwordFieldWithoutValidation = z
  .string()
  .min(1, "password.required")
  .max(256, "password.tooLong");

const confirmPasswordField = z
  .string()
  .min(1, "confirm.required")
  .max(256, "confirm.tooLong");

const usernameField = z
  .string()
  .trim()
  .min(1, "username.required")
  .min(3, "username.tooShort")
  .max(30, "username.tooLong")
  .refine((val) => /^[a-zA-Z0-9_.-]+$/.test(val), "username.invalidChars")
  .refine((val) => /^[a-zA-Z0-9]/.test(val), "username.invalidStart")
  .refine((val) => /[a-zA-Z0-9]$/.test(val), "username.invalidEnd")
  .refine(
    (val) => !/[.]{2,}|[-]{2,}|_{2,}/.test(val),
    "username.invalidSequence",
  );

const otpField = z
  .string()
  .trim()
  .min(1, "otp.required")
  .length(6, "otp.invalidLength")
  .refine((val) => /^\d+$/.test(val), "otp.digitsOnly");

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "fullName.required")
  .min(2, "fullName.tooShort")
  .max(100, "fullName.tooLong")
  .refine(
    (val) => /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/.test(val),
    "fullName.invalidChars",
  )
  .refine((val) => val.includes(" "), "fullName.missingLastName")
  .refine((val) => !/\s{2,}/.test(val), "fullName.invalidSpacing");

const idField = z.string().trim().min(1, "id.required").max(100, "id.tooLong");

const urlField = z.string().trim().max(2048, "url.tooLong").url("url.invalid");

export const payoutSchema: z.ZodType<Payout> = z.object({
  iban: z
    .string()
    .trim()
    .min(1, "iban.required")
    .transform((value) => value.replace(/\s/g, "").toUpperCase())
    .refine(validateIban, {
      message: "iban.invalid",
    }),
  bankName: z.enum(FINNISH_BANKS_VALUES, {
    message: "bankName.invalid",
  }),
});

const mediaItemField = z.object({
  _id: idField,
  ownerId: idField,
  url: urlField,
  filename: z
    .string()
    .trim()
    .min(1, "media.filename.required")
    .max(255, "media.filename.tooLong"),
  originalName: z
    .string()
    .trim()
    .min(1, "media.originalName.required")
    .max(255, "media.originalName.tooLong"),
  size: z
    .number()
    .finite("media.size.invalid")
    .int("media.size.invalid")
    .positive("media.size.invalid")
    .max(MAX_FILE_SIZE, "media.size.tooLarge"),
  mimeType: z
    .string()
    .trim()
    .min(1, "media.mimeType.required")
    .max(100, "media.mimeType.tooLong"),
  uploadedAt: z.coerce.date(),
  publicSources: z.array(urlField),
  chatIds: z.array(idField),
}) satisfies z.ZodType<MediaItem>;

export const publicProfileLangSchema: z.ZodType<PublicProfileLang> = z.object({
  value: z
    .string()
    .trim()
    .min(1, "language.value.required")
    .max(50, "language.value.tooLong"),
  label: z
    .string()
    .trim()
    .min(1, "language.label.required")
    .max(100, "language.label.tooLong"),
  level: z.enum(CERF),
  certificate: z
    .object({
      media: mediaItemField,
      description: z
        .string()
        .transform(removeHtml)
        .refine((value) => value.length <= 1000, "language.certificate.tooLong")
        .optional(),
    })
    .optional(),
});

export const publicProfileSkillSchema: z.ZodType<PublicProfileSkill> = z.object(
  {
    value: z
      .string()
      .trim()
      .min(1, "skill.value.required")
      .max(100, "skill.value.tooLong"),
    label: z
      .string()
      .trim()
      .min(1, "skill.label.required")
      .max(100, "skill.label.tooLong"),
    description: z
      .string()
      .transform(removeHtml)
      .refine((value) => value.length <= 500, "skill.description.tooLong")
      .optional(),
  },
);

export const publicProfileCertificateSchema: z.ZodType<PublicProfileCertificate> =
  z.object({
    value: z
      .string()
      .trim()
      .min(1, "certificate.value.required")
      .max(100, "certificate.value.tooLong"),
    label: z
      .string()
      .trim()
      .min(1, "certificate.label.required")
      .max(100, "certificate.label.tooLong"),
    media: mediaItemField.nullable().optional(),
  });

export const publicProfileSchema: z.ZodType<PublicProfile> = z.object({
  bio: z
    .string()
    .transform(removeHtml)
    .refine((value) => value.length <= 1000, "bio.tooLong")
    .optional(),
  skills: z
    .array(publicProfileSkillSchema)
    .max(15, "skills.tooMany")
    .optional(),
  certificates: z
    .array(publicProfileCertificateSchema)
    .max(15, "certificates.tooMany")
    .optional(),
  languages: z
    .array(publicProfileLangSchema)
    .min(1, "languages.required")
    .optional(),
  header: mediaItemField.nullable().optional(),
  introduction: mediaItemField.nullable().optional(),
});

const settingsSchema: z.ZodType<Partial<UserSettings>> = z.object({
  lang: z.enum(LANGS.map((lang) => lang.value) as [Lang, ...Lang[]]).optional(),
  theme: z.enum(["light", "dark"] as [Theme, ...Theme[]]).optional(),
  checkboxes: z
    .object({
      email: z.boolean().optional(),
      phone: z.boolean().optional(),
      privateProfile: z.boolean().optional(),
      noOnlineStatus: z.boolean().optional(),
    })
    .optional(),
});

export const loginSchema: z.ZodType<LoginForm> = z.object({
  email: emailField,
  password: passwordFieldWithoutValidation,
});

export const registerSchema: z.ZodType<RegisterForm> = z
  .object({
    fullName: fullNameSchema,
    username: usernameField,
    fullPhone: phoneField,
    phone: z.string().trim().min(1, "phone.required").max(30, "phone.tooLong"),
    code: z.string().trim().min(1, "code.required").max(20, "code.tooLong"),
    email: emailField,
    password: passwordField,
    confirm: confirmPasswordField,
    role: z.enum(["tasker", "client"] as [Role, ...Role[]]),
    agreementAccepted: z
      .boolean()
      .refine((val) => val, "agreementAccepted.required"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "confirm.mismatch",
    path: ["confirm"],
  }) as z.ZodType<RegisterForm>;

export const newPasswordSchema: z.ZodType<NewPasswordForm> = z
  .object({
    password: passwordField,
    confirm: confirmPasswordField,
  })
  .refine((data) => data.password === data.confirm, {
    message: "confirm.mismatch",
    path: ["confirm"],
  }) as z.ZodType<NewPasswordForm>;

export const updateProfileSchema: z.ZodType<UpdateProfileForm> = z.object({
  username: usernameField.optional(),
  publicLink: z
    .string()
    .trim()
    .max(2048, "publicLink.tooLong")
    .url("publicLink.invalid")
    .optional(),
  fullName: fullNameSchema.optional(),
  fullPhone: phoneField.optional(),
  phone: z
    .string()
    .trim()
    .min(1, "phone.required")
    .max(30, "phone.tooLong")
    .optional(),
  code: z
    .string()
    .trim()
    .min(1, "code.required")
    .max(20, "code.tooLong")
    .optional(),
  email: emailField.optional(),
  avatar: mediaItemField.nullable().optional(),
  payout: payoutSchema.optional(),
  settings: settingsSchema.optional(),
  publicProfile: publicProfileSchema.optional(),
}) as z.ZodType<UpdateProfileForm>;

export const otpSchema = z.object({
  otp: otpField,
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "token.required")
    .min(10, "token.invalid")
    .max(512, "token.tooLong"),
  password: passwordField,
});

export const forgotPasswordEmailSchema = z.object({
  email: emailField,
});

export const sendResetOtpSchema = z.object({
  fullPhone: phoneField,
});

export const verifyResetOtpSchema = z.object({
  fullPhone: phoneField,
  otp: otpField,
});

export const adminRegisterSchema = z
  .object({
    email: emailField,
    username: usernameField,
    password: passwordField,
  })
  .strict();

export const sendOtpSchema = z.discriminatedUnion("purpose", [
  z.object({
    purpose: z.literal("verify-email"),
  }),
  z.object({
    purpose: z.literal("verify-phone"),
  }),
  z.object({
    purpose: z.literal("reset-password"),
    fullPhone: phoneField,
  }),
]);

export const changePasswordSchema = z
  .object({
    oldPassword: passwordFieldWithoutValidation,
    newPassword: passwordField,
    confirmPassword: confirmPasswordField,
  })
  .strict()
  .superRefine((data, ctx) => {
    const result = validatePassword(data.newPassword);
    if (result !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: result,
      });
    }
    if (data.newPassword === data.oldPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "password.same",
      });
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "password.mismatch",
      });
    }
  });

export const taskLocationSchema = z.object({
  address: z
    .string()
    .trim()
    .min(3, "task.location.tooShort")
    .max(200, "task.location.tooLong"),
  lat: z
    .number()
    .finite("task.location.invalidLatitude")
    .min(-90, "task.location.invalidLatitude")
    .max(90, "task.location.invalidLatitude"),
  lng: z
    .number()
    .finite("task.location.invalidLongitude")
    .min(-180, "task.location.invalidLongitude")
    .max(180, "task.location.invalidLongitude"),
});

export const taskBudgetSchema = z
  .object({
    amount: z
      .number()
      .finite("task.price.invalid")
      .positive("task.price.invalid")
      .max(1_000_000, "task.price.tooLarge")
      .optional(),
    negotiable: z.boolean().default(false),
  })
  .refine((b) => b.negotiable || typeof b.amount === "number", {
    message: "task.price.required",
    path: ["amount"],
  })
  .refine((b) => b.negotiable || (b.amount ?? 0) > 0, {
    message: "task.price.invalid",
    path: ["amount"],
  });

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "task.title.tooShort")
    .max(120, "task.title.tooLong"),
  description: z
    .string()
    .min(20, "task.description.tooShort")
    .max(1000, "task.description.tooLong"),
  skills: z
    .array(publicProfileSkillSchema)
    .max(15, "task.skills.tooMany")
    .default([]),
  certificates: z
    .array(publicProfileCertificateSchema)
    .max(15, "task.certificates.tooMany")
    .default([]),
  budget: taskBudgetSchema,
  location: taskLocationSchema,
  deadline: z.coerce
    .date()
    .refine((date) => !Number.isNaN(date.getTime()), "task.deadline.invalid")
    .refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, "task.deadline.invalid"),
});

export const taskUpdateSchema = taskCreateSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, "task.update.empty");

export const taskResponseCreateSchema = z.object({
  message: z
    .string()
    .transform(removeHtml)
    .refine((value) => value.length >= 1, {
      message: "task.message.tooShort",
    })
    .refine((value) => value.length <= 1000, {
      message: "task.message.tooLong",
    })
    .optional(),
  price: z
    .number()
    .finite("task.price.invalid")
    .positive("task.price.invalid")
    .max(1_000_000, "task.price.tooLarge")
    .optional(),
});
