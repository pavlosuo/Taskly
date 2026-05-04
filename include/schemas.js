import { z } from "zod";

const emailField = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .refine((val) => !val.includes(" "), "Email must not contain spaces")
  .refine(
    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    "Email must include a domain (e.g. user@example.com)",
  )
  .email("Email address is not valid");

const passwordField = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be under 100 characters")
  .refine(
    (val) => /[A-Z]/.test(val),
    "Password must contain at least one uppercase letter",
  )
  .refine(
    (val) => /[a-z]/.test(val),
    "Password must contain at least one lowercase letter",
  )
  .refine(
    (val) => /[0-9]/.test(val),
    "Password must contain at least one number",
  )
  .refine(
    (val) => /[^A-Za-z0-9]/.test(val),
    "Password must contain at least one special character",
  )
  .refine((val) => !/\s/.test(val), "Password must not contain spaces");

const confirmPasswordField = z.string().min(1, "Please confirm your password");

const usernameField = z
  .string()
  .min(1, "Username is required")
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be under 30 characters")
  .refine(
    (val) => /^[a-zA-Z0-9_.-]+$/.test(val),
    "Username may only contain letters, numbers, underscores, dots, or hyphens",
  )
  .refine(
    (val) => /^[a-zA-Z0-9]/.test(val),
    "Username must start with a letter or number",
  )
  .refine(
    (val) => /[a-zA-Z0-9]$/.test(val),
    "Username must end with a letter or number",
  );

const phoneField = z
  .string()
  .min(1, "Phone number is required")
  .refine((val) => /^\+\d{1,4}\d{8,15}$/.test(val), "Invalid phone number")
  .refine(
    (val) => val.replace(/^\+\d{1,4}/, "").length >= 8,
    "Phone number is too short",
  )
  .refine(
    (val) => val.replace(/^\+\d{1,4}/, "").length <= 15,
    "Phone number is too long",
  );

const otpField = z
  .string()
  .min(1, "OTP code is required")
  .length(6, "OTP must be exactly 6 digits")
  .refine((val) => /^\d+$/.test(val), "OTP must contain digits only");

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
    message: "Passwords do not match",
    path: ["confirm"],
  });

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required")
    .min(10, "Reset token appears to be invalid"),
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

export const taskerRegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be under 100 characters")
      .refine(
        (val) => /^[a-zA-Z\s'-]+$/.test(val),
        "Full name may only contain letters, spaces, hyphens, or apostrophes",
      )
      .refine(
        (val) => val.trim().includes(" "),
        "Please enter both first and last name",
      ),
    username: usernameField,
    phone: phoneField,
    HETU: z.string().refine((hetu) => {
      if (!/^\d{6}[+-A]\d{3}[0-9A-Y]$/.test(hetu)) return false;
      const HETU_CHARS = "0123456789ABCDEFHJKLMNPRSTUVWXY";
      const [_, dd, mm, yy, century, individual, control] = hetu.match(
        /^(\d{2})(\d{2})(\d{2})([+-A])(\d{3})([0-9A-Y])$/,
      );

      const yearPrefix = century === "+" ? "18" : century === "-" ? "19" : "20";

      const fullDate = `${yearPrefix}${yy}-${mm}-${dd}`;
      const date = new Date(fullDate);

      if (
        date.getFullYear().toString() !== `${yearPrefix}${yy}` ||
        date.getMonth() + 1 !== Number(mm) ||
        date.getDate() !== Number(dd)
      ) {
        return false;
      }

      const checksumBase = `${dd}${mm}${yy}${individual}`;
      const remainder = Number(checksumBase) % 31;

      return HETU_CHARS[remainder] === control;
    }, "Invalid Finnish personal identity number"),
    email: emailField,
    password: passwordField,
    confirm: confirmPasswordField,
    agreementAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the agreement to continue",
    }),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
