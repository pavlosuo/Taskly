import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { fromFile } from "file-type";
import { Request } from "express";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "shared/data";

export class UploadError extends Error {
  name = "UploadError";
}

export const INLINE_RE =
  /^(image\/(jpeg|png|webp|gif|avif)|video\/|audio\/|application\/pdf$)/;

const TMP_ROOT = path.join(os.tmpdir(), "uploads");

const IMAGE_CONFIG = {
  maxWidth: 1440,
  jpegQuality: 90,
  pngCompressionLevel: 9,
  webpQuality: 90,
};

export const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const LEGACY_OFFICE = new Set([
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
]);

const TEXT_EXT: Record<string, string> = {
  "text/plain": ".txt",
  "text/csv": ".csv",
};

const MIME_ALIASES: Record<string, string> = {
  "audio/vnd.wave": "audio/wav",
  "audio/x-wav": "audio/wav",
};

const EXT_OVERRIDE: Record<string, string> = {
  "application/msword": ".doc",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.ms-powerpoint": ".ppt",
  "audio/webm": ".webm",
  "audio/wav": ".wav",
};

async function verifyFile(
  p: string,
  declared: string,
): Promise<{ mime: string; ext: string } | null> {
  const detected = await fromFile(p).catch(() => undefined);
  if (!detected) {
    const ext = TEXT_EXT[declared];
    return ext ? { mime: declared, ext } : null;
  }
  let mime = MIME_ALIASES[detected.mime] ?? detected.mime;
  if (mime === "application/x-cfb" && LEGACY_OFFICE.has(declared)) {
    mime = declared;
  }
  if (mime === "video/webm" && declared === "audio/webm") mime = declared;
  if (!ALLOWED_MIME_TYPES.has(mime)) return null;
  return { mime, ext: EXT_OVERRIDE[mime] ?? `.${detected.ext}` };
}

class TempDiskStorage implements multer.StorageEngine {
  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ) {
    let settled = false;
    let tmpPath = "";
    const done = (err?: Error | null, info?: Partial<Express.Multer.File>) => {
      if (settled) return;
      settled = true;
      if (err) {
        if (tmpPath) fs.unlink(tmpPath, () => cb(err));
        else cb(err);
        return;
      }
      cb(null, info);
    };
    try {
      const dir = path.join(TMP_ROOT, req.user._id.toString());
      fs.mkdirSync(dir, { recursive: true });
      const isImage = Object.prototype.hasOwnProperty.call(
        IMAGE_MIME_EXT,
        file.mimetype,
      );
      const id = nanoid();
      tmpPath = path.join(
        dir,
        `${id}${isImage ? IMAGE_MIME_EXT[file.mimetype] : ".tmp"}`,
      );
      const out = fs.createWriteStream(tmpPath);
      out.on("error", (e) => done(e));
      file.stream.on("error", (e) => done(e));
      out.on("finish", async () => {
        if (settled) return;
        const size = out.bytesWritten;
        const base = { destination: dir, size };
        if (isImage) {
          return done(null, {
            ...base,
            path: tmpPath,
            filename: path.basename(tmpPath),
          });
        }
        const verified = await verifyFile(tmpPath, file.mimetype);
        if (!verified) return done(new UploadError("media.typeNotAllowed"));
        const finalPath = path.join(dir, `${id}${verified.ext}`);
        fs.rename(tmpPath, finalPath, (err) => {
          if (err) return done(err);
          tmpPath = finalPath;
          done(null, {
            ...base,
            path: finalPath,
            filename: path.basename(finalPath),
            mimetype: verified.mime,
          });
        });
      });
      if (!isImage) {
        file.stream.pipe(out);
        return;
      }
      const transformer = sharp().rotate().resize({
        width: IMAGE_CONFIG.maxWidth,
        fit: "inside",
        withoutEnlargement: true,
      });
      if (file.mimetype === "image/jpeg") {
        transformer.jpeg({
          quality: IMAGE_CONFIG.jpegQuality,
          mozjpeg: true,
          progressive: true,
        });
      } else if (file.mimetype === "image/png") {
        transformer.png({
          compressionLevel: IMAGE_CONFIG.pngCompressionLevel,
          palette: true,
        });
      } else {
        transformer.webp({ quality: IMAGE_CONFIG.webpQuality });
      }
      transformer.on("error", () => {
        out.destroy();
        done(new UploadError("media.typeNotAllowed"));
      });
      file.stream.pipe(transformer).pipe(out);
    } catch (e) {
      done(e as Error);
    }
  }

  _removeFile(
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ) {
    const p = (file as any).path as string | undefined;
    if (!p) return cb(null);
    fs.unlink(p, () => cb(null));
  }
}

export const upload = multer({
  storage: new TempDiskStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED_MIME_TYPES.has(file.mimetype);
    if (!ok) (req as any).fileRejected = true;
    cb(null, ok);
  },
});
