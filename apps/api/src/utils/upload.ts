import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { fileTypeFromFile } from "file-type";
import { Request } from "express";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_PIXELS,
  LEGACY_OFFICE,
  MIME_ALIASES,
  EXT_OVERRIDE,
  TEXT_EXT,
} from "shared/data";
import { InfoUpload, UploadError } from "@/types";
import { TMP_ROOT } from "@/utils/index";

async function looksLikeText(p: string) {
  const fh = await fs.promises.open(p, "r");
  try {
    const { buffer, bytesRead } = await fh.read(Buffer.alloc(8192), 0, 8192, 0);
    return !buffer.subarray(0, bytesRead).includes(0);
  } finally {
    await fh.close();
  }
}

async function verifyFile(
  p: string,
  declared: string,
): Promise<{ mime: string; ext: string } | null> {
  const detected = await fileTypeFromFile(p).catch(() => undefined);
  if (!detected) {
    const ext = TEXT_EXT[declared];
    return ext && (await looksLikeText(p)) ? { mime: declared, ext } : null;
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
    cb: (e?: unknown, info?: Partial<Express.Multer.File>) => void,
  ) {
    let settled = false;
    let tmpPath = "";
    let out: fs.WriteStream | undefined;
    const done = (err?: Error | null, info?: InfoUpload) => {
      if (settled) return;
      settled = true;
      if (err) {
        out?.destroy();
        if (tmpPath) fs.unlink(tmpPath, () => cb(err));
        else cb(err);
        return;
      }
      cb(null, info);
    };
    try {
      const dir = path.join(TMP_ROOT, req.user._id.toString());
      fs.mkdirSync(dir, { recursive: true });
      const id = nanoid();
      tmpPath = path.join(dir, `${id}.tmp`);
      const stream = fs.createWriteStream(tmpPath);
      out = stream;
      const finalize = async () => {
        if (settled) return;
        try {
          const size = stream.bytesWritten;
          const verified = await verifyFile(tmpPath, file.mimetype);
          if (!verified) return done(new UploadError("media.typeNotAllowed"));
          let width: number | undefined;
          let height: number | undefined;
          if (verified.mime.startsWith("image/")) {
            const meta = await sharp(tmpPath, { limitInputPixels: MAX_PIXELS })
              .metadata()
              .catch(() => null);
            if (!meta?.width || !meta.height) {
              return done(new UploadError("media.typeNotAllowed"));
            }
            const pageHeight = meta.pageHeight ?? meta.height;
            if (meta.width * pageHeight > MAX_PIXELS) {
              return done(new UploadError("media.tooLarge"));
            }
            const swap = (meta.orientation ?? 1) >= 5;
            width = swap ? pageHeight : meta.width;
            height = swap ? meta.width : pageHeight;
          }
          const finalPath = path.join(dir, `${id}${verified.ext}`);
          await fs.promises.rename(tmpPath, finalPath);
          tmpPath = finalPath;
          done(null, {
            destination: dir,
            size,
            path: finalPath,
            filename: path.basename(finalPath),
            mimetype: verified.mime,
            width,
            height,
          });
        } catch (e) {
          done(e as Error);
        }
      };
      stream.on("error", done);
      file.stream.on("error", done);
      stream.on("finish", () => void finalize());
      file.stream.pipe(stream);
    } catch (e) {
      done(e as Error);
    }
  }

  _removeFile(
    _req: Request,
    file: Express.Multer.File,
    cb: (e: Error | null) => void,
  ) {
    const p = file.path as string | undefined;
    if (!p) return cb(null);
    fs.unlink(p, () => cb(null));
  }
}

export const upload = multer({
  storage: new TempDiskStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new UploadError("media.typeNotAllowed"));
    }
    cb(null, true);
  },
});
