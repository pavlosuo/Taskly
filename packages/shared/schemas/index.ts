import { z } from "zod";
import libphonenumber from "google-libphonenumber";
import { finnishBanks } from "@shared/data";
import { validateIban, validatePassword } from "@shared/utils";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

export const finnishBankValues = finnishBanks.map((b) => b.value) as [
  (typeof finnishBanks)[number]["value"],
  ...(typeof finnishBanks)[number]["value"][],
];

const FI_IBAN_REGEX = /^FI\d{16}$/;

const payoutField = z
  .object({
    iban: z
      .string()
      .regex(FI_IBAN_REGEX, "errors.iban.invalidFormat")
      .refine(validateIban, { message: "errors.iban.invalid" }),
    bankName: z.enum(finnishBankValues, { message: "errors.bankName.invalid" }),
  })
  .optional();

const phoneField = z.string().superRefine((value, ctx) => {
  if (!value.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "errors.phone.required",
    });
    return;
  }
  try {
    const phone = phoneUtil.parse(value);
    if (!phoneUtil.isValidNumber(phone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "errors.phone.invalid",
      });
    }
  } catch (e) {
    const err = e as Error;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        err.message === "The string supplied is too short to be a phone number"
          ? "errors.phone.required"
          : "errors.phone.invalid",
    });
  }
});

const roleField = z.enum(["admin", "tasker", "client"], {
  message: "errors.role.invalid",
});

const emailField = z
  .string()
  .min(1, "errors.email.required")
  .max(254, "errors.email.tooLong")
  .refine((val) => !val.includes(" "), "errors.email.noSpaces")
  .refine(
    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "errors.email.noDomain",
  )
  .email("errors.email.invalid");

const passwordField = z.string().superRefine((val, ctx) => {
  const result = validatePassword(val);
  if (result !== true) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: result });
  }
});

const confirmPasswordField = z.string().min(1, "errors.confirm.required");

const usernameField = z
  .string()
  .min(1, "errors.username.required")
  .min(3, "errors.username.tooShort")
  .max(30, "errors.username.tooLong")
  .refine(
    (val) => /^[a-zA-Z0-9_.-]+$/.test(val),
    "errors.username.invalidChars",
  )
  .refine((val) => /^[a-zA-Z0-9]/.test(val), "errors.username.invalidStart")
  .refine((val) => /[a-zA-Z0-9]$/.test(val), "errors.username.invalidEnd");

const otpField = z
  .string()
  .min(1, "errors.otp.required")
  .length(6, "errors.otp.invalidLength")
  .refine((val) => /^\d+$/.test(val), "errors.otp.digitsOnly");

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const otpSchema = z.object({
  otp: otpField,
});

export const newPasswordSchema = z
  .object({
    password: passwordField,
    confirm: confirmPasswordField,
  })
  .refine((data) => data.password === data.confirm, {
    message: "errors.confirm.mismatch",
    path: ["confirm"],
  });

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "errors.token.required")
    .min(10, "errors.token.invalid"),
  password: passwordField,
});

export const forgotPasswordEmailSchema = z.object({
  email: emailField,
});

export const sendResetOtpSchema = z.object({
  phone: phoneField,
});

export const verifyResetOtpSchema = z.object({
  phone: phoneField,
  otp: otpField,
});

export const adminRegisterSchema = z.object({
  email: emailField,
  username: usernameField,
  password: passwordField,
});

export const fullNameSchema = z
  .string()
  .min(1, "errors.fullName.required")
  .min(2, "errors.fullName.tooShort")
  .max(100, "errors.fullName.tooLong")
  .refine((val) => /^[a-zA-Z\s'-]+$/.test(val), "errors.fullName.invalidChars")
  .refine((val) => val.trim().includes(" "), "errors.fullName.missingLastName");

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameField,
    fullPhone: phoneField,
    phone: z.string().min(1, "errors.phone.required"),
    code: z.string().min(1, "errors.code.required"),
    email: emailField,
    password: passwordField,
    confirm: confirmPasswordField,
    role: roleField,
  })
  .refine((data) => data.password === data.confirm, {
    message: "errors.confirm.mismatch",
    path: ["confirm"],
  });

export const updateProfileSchema = z.object({
  username: usernameField.optional(),
  fullName: fullNameSchema.optional(),
  fullPhone: phoneField.optional(),
  phone: z.string().min(1, "errors.phone.required").optional(),
  code: z.string().min(1, "errors.code.required").optional(),
  email: emailField.optional(),
  avatar: z.string().optional(),
  payout: payoutField.optional(),
  settings: z
    .object({
      lang: z.enum(["en", "fi", "sv"]).optional(),
      theme: z.enum(["light", "dark"]).optional(),
    })
    .optional(),
  publicProfile: z
    .object({
      bio: z.string().optional(),
    }).optional()
});

export const sendOtpSchema = z.discriminatedUnion("purpose", [
  z.object({ purpose: z.literal("verify-email") }),
  z.object({ purpose: z.literal("verify-phone") }),
  z.object({ purpose: z.literal("reset-password"), phone: phoneField }),
]);

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long."),
  })
  .strict();
