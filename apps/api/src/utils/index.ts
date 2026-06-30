import { RequestHandler, Response } from "express";
import { AuthRequest } from "@shared/types";
import multer from "multer";
import type { Request } from "express";
import rateLimit from "express-rate-limit";

export function asAuth(
  handler: (req: AuthRequest, res: Response) => unknown,
): RequestHandler {
  return (req, res) => handler(req as AuthRequest, res);
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests." },
});

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_: Request, file: Express.Multer.File, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});
