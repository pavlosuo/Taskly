import { z } from "zod";
import type {
  LoginForm,
  NewPasswordForm,
  RegisterForm,
  Role,
} from "shared/types";
import {
  confirmPasswordField,
  emailField,
  fullNameSchema,
  otpField,
  passwordField,
  passwordFieldWithoutValidation,
  phoneCodeField,
  phoneField,
  phoneNumberPartField,
  usernameField,
} from "./fields";

const passwordsMatch = <T extends { password: string; confirm: string }>(
  data: T,
) => data.password === data.confirm;

const confirmMismatch = {
  message: "confirm.mismatch",
  path: ["confirm"],
};

export const loginSchema: z.ZodType<LoginForm> = z.object({
  email: emailField,
  password: passwordFieldWithoutValidation,
});

export const registerSchema: z.ZodType<RegisterForm> = z
  .object({
    fullName: fullNameSchema,
    username: usernameField,
    fullPhone: phoneField,
    phone: phoneNumberPartField,
    code: phoneCodeField,
    email: emailField,
    password: passwordField,
    confirm: confirmPasswordField,
    role: z.enum(["tasker", "client"] as [Role, ...Role[]], {
      message: "role.required",
    }),
    agreementAccepted: z
      .boolean()
      .refine((val) => val, "agreementAccepted.required"),
  })
  .refine(passwordsMatch, confirmMismatch) as z.ZodType<RegisterForm>;

export const newPasswordSchema: z.ZodType<NewPasswordForm> = z
  .object({
    password: passwordField,
    confirm: confirmPasswordField,
  })
  .refine(passwordsMatch, confirmMismatch) as z.ZodType<NewPasswordForm>;

export const adminRegisterSchema = z
  .object({
    email: emailField,
    username: usernameField,
    password: passwordField,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    oldPassword: passwordFieldWithoutValidation,
    newPassword: passwordField,
    confirmPassword: confirmPasswordField,
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.newPassword === data.oldPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "password.newSameAsOld",
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

export const otpSchema = z.object({
  otp: otpField,
});

export const sendResetOtpSchema = z.object({
  fullPhone: phoneField,
});

export const verifyResetOtpSchema = z.object({
  fullPhone: phoneField,
  otp: otpField,
});

export const sendOtpSchema = z.discriminatedUnion("purpose", [
  z.object({ purpose: z.literal("verify-email") }),
  z.object({ purpose: z.literal("verify-phone") }),
  z.object({
    purpose: z.literal("reset-password"),
    fullPhone: phoneField,
  }),
]);
