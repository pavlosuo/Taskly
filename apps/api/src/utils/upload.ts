import multer from "multer";
import type { Request } from "express";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_: Request, file: Express.Multer.File, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
});
