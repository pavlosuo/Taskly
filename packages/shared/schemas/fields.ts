import { z } from "zod";
import libphonenumber from "google-libphonenumber";
import { removeHtml, validatePassword, utf8Length } from "shared/utils";
import { MAX_PRICE } from "shared/data";

const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

const custom = (ctx: z.RefinementCtx, message: string, path?: string[]) =>
  ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });

export const phoneField = z.string().superRefine((value, ctx) => {
  if (!value.trim()) {
    custom(ctx, "phone.required");
    return;
  }
  try {
    if (!phoneUtil.isValidNumber(phoneUtil.parse(value))) {
      custom(ctx, "phone.invalid");
    }
  } catch {
    custom(ctx, "phone.invalid");
  }
});

export const phoneNumberPartField = z
  .string()
  .trim()
  .min(1, "phone.required")
  .max(30, "phone.tooLong");

export const phoneCodeField = z
  .string()
  .trim()
  .min(1, "phone.required")
  .max(20, "phone.tooLong");

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "email.required")
  .max(254, "email.tooLong")
  .refine((val) => !/\s/.test(val), "email.noSpaces")
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "email.noDomain")
  .email("email.invalid");

export const passwordField = z.string().superRefine((val, ctx) => {
  if (!val) {
    custom(ctx, "password.required");
    return;
  }
  if (utf8Length(val) > 72) {
    custom(ctx, "password.tooLong");
    return;
  }
  const result = validatePassword(val);
  if (result !== true) {
    custom(ctx, result);
  }
});

export const passwordFieldWithoutValidation = z
  .string()
  .min(1, "password.required")
  .max(256, "password.tooLong");

export const confirmPasswordField = z
  .string()
  .min(1, "confirm.required")
  .max(256, "confirm.tooLong");

export const usernameField = z
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

export const otpField = z
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

export const idField = z
  .string()
  .trim()
  .min(1, "id.required")
  .max(100, "id.invalid");

export const urlField = z
  .string()
  .trim()
  .max(2048, "url.tooLong")
  .regex(/^https?:\/\/[^/\s?#]+(?::\d+)?(?:[/?#][^\s]*)?$/, "url.invalid");

export const priceField = z
  .number()
  .finite("task.price.invalid")
  .positive("task.price.invalid")
  .max(MAX_PRICE, "task.price.tooLarge");

export const sanitizedText = (max: number, tooLongMessage: string) =>
  z.string().refine((value) => removeHtml(value).length <= max, tooLongMessage);
