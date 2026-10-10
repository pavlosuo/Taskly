import path from "path";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { PublicUser, MediaItemPublic, Tag, GeoPoint } from "shared/types";
import { User } from "@/types";
import { ObjectId, WithId, Document } from "mongodb";
export * from "@/utils/limiters";
export * from "@/utils/upload";
import { NODE_ENV } from "@/env";

export const cookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 365 * 24 * 60 * 60 * 1000,
  path: "/",
};

export function parseCookieHeader(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).trim();
    const value = part.slice(eqIndex + 1).trim();
    try {
      result[key] = decodeURIComponent(value);
    } catch {
      result[key] = value;
    }
  }
  return result;
}

export function toPublicUser(
  user?: User | PublicUser | null | WithId<Document>,
): PublicUser | null {
  if (!user) return null;

  const online = !user.settings?.checkboxes?.noOnlineStatus
    ? {
        lastSeenAt: user.lastSeenAt,
      }
    : {};

  const onlyTasker =
    user.role === "tasker"
      ? {
          payout: user.payout,
        }
      : {};

  const notAdmin =
    user.role !== "admin"
      ? {
          publicLink: user.publicLink,
          ...online,
        }
      : {};

  return {
    _id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    acceptance: user.acceptance,
    profile: user.profile,
    settings: user.settings,
    publicProfile: user.publicProfile,
    ...onlyTasker,
    ...notAdmin,
  };
}

export const hashToken = (t: string): string =>
  createHash("sha256").update(t).digest("hex");

export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

export const generateOtp = (): string => randomInt(100000, 1000000).toString();

export const filePath = (
  filename: string,
  userId: string | ObjectId,
): string => {
  return path.resolve(
    process.cwd(),
    "../../uploads",
    userId.toString(),
    filename,
  );
};

export function extractMediaId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/api\/media\/([a-f0-9]+)\/file/);
  return match?.[1] ?? null;
}

function isMediaObject(
  value: unknown,
): value is Record<string, unknown> & MediaItemPublic {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).url === "string" &&
    typeof (value as Record<string, unknown>).originalName === "string"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function stripMediaFields<T>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => stripMediaFields(item)) as unknown as T;
  }
  if (isMediaObject(input)) {
    return {
      originalName: input.originalName,
      url: input.url,
      mimeType: input.mimeType,
    } as unknown as T;
  }
  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = stripMediaFields(value);
    }
    return result as T;
  }
  return input;
}

export function normalizeTagList(values: Tag[]): Tag[] {
  const seen = new Set<string>();
  const result: Tag[] = [];
  for (const raw of values) {
    const trimmed = raw.value.trim();
    const key = trimmed.toLowerCase();
    if (trimmed && !seen.has(key)) {
      seen.add(key);
      result.push(raw);
    }
  }
  return result;
}

export const escapeRegex = (s: string) =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const splitList = (value: unknown) =>
  String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export const toGeoPoint = (
  loc?: { lat?: number; lng?: number } | null,
): GeoPoint | undefined => {
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  if (lat === 0 && lng === 0) return undefined;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return { type: "Point", coordinates: [lng, lat] };
};
