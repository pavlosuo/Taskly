import { z } from "zod";
import libphonenumber from "google-libphonenumber";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

const phoneField = z
  .string()
  .min(1, "errors.phone.required")
  .refine(
    (value) => {
      try {
        const phone = phoneUtil.parse(value);
        return phoneUtil.isValidNumber(phone);
      } catch {
        return false;
      }
    },
    {
      message: "errors.phone.invalid",
    },
  );

const roleField = z
  .enum(["admin", "tasker", "client"])
  .refine(
    (val) => ["admin", "tasker", "client"].includes(val),
    "errors.role.invalid",
  );

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

const passwordField = z
  .string()
  .min(1, "errors.password.required")
  .min(8, "errors.password.tooShort")
  .max(100, "errors.password.tooLong")
  .refine((val) => /[A-Z]/.test(val), "errors.password.noUppercase")
  .refine((val) => /[a-z]/.test(val), "errors.password.noLowercase")
  .refine((val) => /[0-9]/.test(val), "errors.password.noNumber")
  .refine((val) => /[^A-Za-z0-9]/.test(val), "errors.password.noSpecial")
  .refine((val) => !/\s/.test(val), "errors.password.noSpaces");

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
  role: roleField,
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
    phone: phoneField,
    email: emailField,
    password: passwordField,
    confirm: confirmPasswordField,
    role: roleField,
  })
  .refine((data) => data.password === data.confirm, {
    message: "errors.confirm.mismatch",
    path: ["confirm"],
  });
