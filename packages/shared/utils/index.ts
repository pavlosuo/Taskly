import { createHash, randomInt, timingSafeEqual } from "crypto";
import type { Request } from "express";

export function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

export function getDeviceInfo(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}

export const hashToken = (t: string): string =>
  createHash("sha256").update(t).digest("hex");

export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

export const generateOtp = (): string => randomInt(100000, 1000000).toString();

export function validateIban(raw: string) {
  const cleaned = raw.replace(/\s/g, "").toUpperCase();
  if (!/^FI\d{16}$/.test(cleaned)) return false;
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((c) =>
      isNaN(c as unknown as number) ? String(c.charCodeAt(0) - 55) : c,
    )
    .join("");
  let remainder = 0;
  for (const chunk of numeric.match(/.{1,9}/g) ?? []) {
    remainder = Number(String(remainder) + chunk) % 97;
  }
  return remainder === 1;
}

const CHECKS = [
  {
    key: "hasMinLength",
    test: (p: string) => p.length >= 8,
    tip: "password.tips.minLength",
  },
  {
    key: "hasUpper",
    test: (p: string) => /[A-Z]/.test(p),
    tip: "password.tips.uppercase",
  },
  {
    key: "hasLower",
    test: (p: string) => /[a-z]/.test(p),
    tip: "password.tips.lowercase",
  },
  {
    key: "hasNumber",
    test: (p: string) => /[0-9]/.test(p),
    tip: "password.tips.number",
  },
  {
    key: "hasSpecial",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
    tip: "password.tips.special",
  },
  {
    key: "hasNoSpaces",
    test: (p: string) => !/\s/.test(p),
    tip: "password.tips.noSpaces",
  },
] as const;

type CheckKey = (typeof CHECKS)[number]["key"];

export type PasswordStrength = {
  label: string;
  color: string;
  tips: string[];
} | null;

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return null;

  const results = Object.fromEntries(
    CHECKS.map((c) => [c.key, c.test(password)]),
  ) as Record<CheckKey, boolean>;

  const tips = CHECKS.filter((c) => !results[c.key]).map((c) => c.tip);
  const score = Object.values(results).filter(Boolean).length;

  if (!results.hasMinLength || !results.hasNoSpaces) {
    return { label: "password.strength.invalid", color: "text-red-600", tips };
  }
  if (score <= 3) {
    return { label: "password.strength.weak", color: "text-red-500", tips };
  }
  if (score === 4) {
    return {
      label: "password.strength.medium",
      color: "text-yellow-500",
      tips,
    };
  }
  if (score === 5) {
    return { label: "password.strength.strong", color: "text-green-500", tips };
  }

  return {
    label: "password.strength.veryStrong",
    color: "text-green-600",
    tips: [],
  };
}

export function validatePassword(val: string): true | string {
  if (!val) return "errors.password.required";

  for (const check of CHECKS) {
    if (!check.test(val))
      return `errors.${check.tip.replace("password.tips.", "password.")}`;
  }

  return true;
}
