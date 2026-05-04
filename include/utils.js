import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { createHash, randomInt, timingSafeEqual } from "crypto";

export function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress
  );
}

export function getDeviceInfo(req) {
  return req.headers["user-agent"] || "unknown";
}

export async function uploadAgreementLocally(buffer, filename) {
  try {
    const dir = path.resolve("uploads/agreements");
    await fs.mkdir(dir, { recursive: true });
    const key = `agreements/${filename}`;
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    const url = `/uploads/${key}`;
    return { key, url };
  } catch (error) {
    console.error(error);
    return { key: null, url: null };
  }
}

export const hashToken = (t) => createHash("sha256").update(t).digest("hex");

export const safeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

export const generateOtp = () => randomInt(100000, 1000000).toString();

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});
