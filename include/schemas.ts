import { z } from "zod";
import libphonenumber from "google-libphonenumber";
import { finnishBanks } from "./data.ts";
import { validateIban, validatePassword } from "./utils.ts";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

export const finnishBankValues = finnishBanks.map((b) => b.value) as [
  (typeof finnishBanks)[number]["value"],
  ...(typeof finnishBanks)[number]["value"][],
];

const payoutField = z
  .object({
    iban: z
      .string()
      .min(15, "errors.iban.tooShort")
      .max(34, "errors.iban.tooLong")
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

export const otpVerifySchema = z.object({
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

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "errors.fullName.required")
      .min(2, "errors.fullName.tooShort")
      .max(100, "errors.fullName.tooLong")
      .refine(
        (val) => /^[a-zA-Z\s'-]+$/.test(val),
        "errors.fullName.invalidChars",
      )
      .refine(
        (val) => val.trim().includes(" "),
        "errors.fullName.missingLastName",
      ),
    username: usernameField,
    fullPhone: phoneField,
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
  fullName: z
    .string()
    .min(2, "errors.fullName.tooShort")
    .max(100, "errors.fullName.tooLong")
    .optional(),
  phone: phoneField.optional(),
  email: emailField.optional(),
  avatar: z.string().optional(),
  payout: payoutField,
});

export const updateEmailRequestSchema = z.object({
  newEmail: emailField,
});

export const verifyPhoneOtpSchema = z.object({
  otp: otpField,
});
