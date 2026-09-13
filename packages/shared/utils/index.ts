import { PasswordStrength } from "@shared/types";

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

export function getPasswordStrength(password?: string): PasswordStrength {
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
    return { label: "password.strength.weak", color: "text-red", tips };
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
  if (!val) return "password.required";
  for (const check of CHECKS) {
    if (!check.test(val))
      return `${check.tip.replace("password.tips.", "password.")}`;
  }
  return true;
}

export function bigFirstLetter(normalized: string) {
  if (!normalized) return "";
  return normalized[0].toUpperCase() + normalized.slice(1);
}
