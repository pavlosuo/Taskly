import fs from "fs";
import path from "path";
import { createHash, randomInt, timingSafeEqual } from "crypto";
import { User, PublicUser } from "@shared/types";
import { RequestHandler, Response, Request } from "express";
import { AuthRequest } from "@shared/types";

export function asAuth(
  handler: (req: AuthRequest, res: Response) => unknown,
): RequestHandler {
  return (req, res) => handler(req as AuthRequest, res);
}

export function toPublicUser(
  user?: User | PublicUser | null,
): PublicUser | null {
  if (!user) return null;
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    acceptance: user.acceptance,
    payout: user.payout,
    profile: user.profile,
    settings: user.settings,
  };
}

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

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
}

function formatArgs(args: unknown[]) {
  return args
    .map((arg) => {
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(" ");
}

export function log(...args: unknown[]) {
  const logDir = "./logs";
  const logPath = path.join(logDir, "log.txt");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const timestamp = getTimestamp();
  const message = formatArgs(args);
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFile(logPath, logEntry, "utf8", (err) => {
    if (err) {
      console.error("❌ Error writing to log file:", err);
    }
  });
}
