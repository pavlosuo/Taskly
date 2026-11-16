import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

const byUser = (req: Request) => String(req.user._id);

const byIpAndAccount = (req: Request) => {
  const ip = ipKeyGenerator(req.ip ?? "");
  const raw = req.body?.email;
  const account =
    typeof raw === "string" ? raw.trim().toLowerCase().slice(0, 254) : "";
  return account ? `${ip}|${account}` : ip;
};

export const tagCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: byUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});

export const messageLimiter = rateLimit({
  windowMs: 60_000,
  limit: 40,
  keyGenerator: byUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});

export const chatCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  keyGenerator: byUser,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: byIpAndAccount,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});

export const globalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.method === "GET" && req.originalUrl.startsWith("/api/media"),
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 429, message: "general.tooManyRequests" },
});
