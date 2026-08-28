import { z } from "zod";
import libphonenumber from "google-libphonenumber";
import { FINNISH_BANKS } from "@shared/data";
import { validateIban, validatePassword } from "@shared/utils";
import type {
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
} from "@shared/types";
import { LANGS } from "@shared/data";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

export const finnishBankValues = FINNISH_BANKS.map((b) => b.value) as [
  (typeof FINNISH_BANKS)[number]["value"],
  ...(typeof FINNISH_BANKS)[number]["value"][],
];

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
  } catch (e) {
    const err = e as Error;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        err.message === "The string supplied is too short to be a phone number"
          ? "phone.required"
          : "phone.invalid",
    });
  }
});

const emailField = z
  .string()
  .min(1, "email.required")
  .max(254, "email.tooLong")
  .refine((val) => !val.includes(" "), "email.noSpaces")
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "email.noDomain")
  .email("email.invalid");

const passwordField = z.string().superRefine((val, ctx) => {
  const result = validatePassword(val);
  if (result !== true) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: result });
  }
});

const confirmPasswordField = z.string().min(1, "confirm.required");

const usernameField = z
  .string()
  .min(1, "username.required")
  .min(3, "username.tooShort")
  .max(30, "username.tooLong")
  .refine((val) => /^[a-zA-Z0-9_.-]+$/.test(val), "username.invalidChars")
  .refine((val) => /^[a-zA-Z0-9]/.test(val), "username.invalidStart")
  .refine((val) => /[a-zA-Z0-9]$/.test(val), "username.invalidEnd");

const otpField = z
  .string()
  .min(1, "otp.required")
  .length(6, "otp.invalidLength")
  .refine((val) => /^\d+$/.test(val), "otp.digitsOnly");

export const fullNameSchema = z
  .string()
  .min(1, "fullName.required")
  .min(2, "fullName.tooShort")
  .max(100, "fullName.tooLong")
  .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), "fullName.invalidChars")
  .refine((val) => val.trim().includes(" "), "fullName.missingLastName");

const payoutSchema: z.ZodType<Payout> = z.object({
  iban: z
    .string()
    .regex(/^FI\d{16}$/, "iban.invalidFormat")
    .refine(validateIban, { message: "iban.invalid" }),
  bankName: z.enum(finnishBankValues, { message: "bankName.invalid" }),
});

const mediaItemField = z.object({
  _id: z.string(),
  ownerId: z.string(),
  url: z.string(),
  filename: z.string(),
  originalName: z.string(),
  size: z.number(),
  mimeType: z.string(),
  uploadedAt: z.string(),
  publicSources: z.array(z.string()),
  chatIds: z.array(z.string()),
}) satisfies z.ZodType<MediaItem>;

export const publicProfileLangSchema: z.ZodType<PublicProfileLang> = z.object({
  value: z.string(),
  label: z.string(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  certificate: z
    .object({
      media: mediaItemField,
      description: z.string().optional(),
    })
    .optional(),
});

export const publicProfileSkillSchema: z.ZodType<PublicProfileSkill> = z.object(
  {
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  },
);

export const publicProfileCertificateSchema: z.ZodType<PublicProfileCertificate> =
  z.object({
    value: z.string(),
    label: z.string(),
    media: mediaItemField.optional(),
    description: z.string().optional(),
  });

const publicProfileSchema: z.ZodType<PublicProfile> = z.object({
  bio: z.string().max(1000).optional(),
  skills: z.array(publicProfileSkillSchema).optional(),
  certificates: z.array(publicProfileCertificateSchema).optional(),
  languages: z.array(publicProfileLangSchema).optional(),
  header: mediaItemField.nullable().optional(),
  introduction: mediaItemField.nullable().optional(),
});

const settingsSchema: z.ZodType<Partial<UserSettings>> = z.object({
  lang: z.enum(LANGS.map((lang) => lang.value) as [Lang, ...Lang[]]).optional(),
  theme: z.enum(["light", "dark"] as [Theme, ...Theme[]]).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
    })
    .optional(),
});

export const loginSchema: z.ZodType<LoginForm> = z.object({
  email: emailField,
  password: passwordField,
});

export const registerSchema: z.ZodType<RegisterForm> = z
  .object({
    fullName: fullNameSchema,
    username: usernameField,
    fullPhone: phoneField,
    phone: z.string().min(1, "phone.required"),
    code: z.string().min(1, "code.required"),
    email: emailField,
    password: passwordField,
    confirm: confirmPasswordField,
    role: z.enum(["admin", "tasker", "client"] as [
      Role | "admin",
      ...(Role | "admin")[],
    ]),
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
  publicLink: z.string().optional(),
  fullName: fullNameSchema.optional(),
  fullPhone: phoneField.optional(),
  phone: z.string().min(1, "phone.required").optional(),
  code: z.string().min(1, "code.required").optional(),
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
  token: z.string().min(1, "token.required").min(10, "token.invalid"),
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

export const adminRegisterSchema = z.object({
  email: emailField,
  username: usernameField,
  password: passwordField,
});

export const sendOtpSchema = z.discriminatedUnion("purpose", [
  z.object({ purpose: z.literal("verify-email") }),
  z.object({ purpose: z.literal("verify-phone") }),
  z.object({ purpose: z.literal("reset-password"), fullPhone: phoneField }),
]);

export const changePasswordSchema = z
  .object({
    oldPassword: passwordField,
    newPassword: passwordField,
  })
  .strict();
