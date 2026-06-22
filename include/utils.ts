import multer from "multer";
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

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_: Request, file: Express.Multer.File, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});
