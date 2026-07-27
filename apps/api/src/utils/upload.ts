import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { AuthRequest } from "@/types";

const IMAGE_CONFIG = {
  maxWidth: 1440,
  jpegQuality: 90,
  pngCompressionLevel: 9,
  webpQuality: 90,
};

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

class OptimizedDiskStorage implements multer.StorageEngine {
  _handleFile(
    req: AuthRequest,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ) {
    try {
      const userId = req.user._id.toString();
      const uploadDir = path.join(process.cwd(), "../../uploads", userId);
      fs.mkdirSync(uploadDir, { recursive: true });

      const isImage = Object.prototype.hasOwnProperty.call(
        IMAGE_MIME_EXT,
        file.mimetype,
      );

      const ext = isImage
        ? IMAGE_MIME_EXT[file.mimetype]
        : path.extname(file.originalname);

      const filename = `${nanoid()}${ext}`;
      const finalPath = path.join(uploadDir, filename);

      let size = 0;
      const writeStream = fs.createWriteStream(finalPath);

      const onError = (err: Error) => {
        writeStream.destroy();
        fs.unlink(finalPath, () => cb(err));
      };

      writeStream.on("error", onError);
      file.stream.on("error", onError);

      writeStream.on("finish", () => {
        cb(null, {
          path: finalPath,
          filename,
          size,
          destination: uploadDir,
        });
      });

      if (!isImage) {
        file.stream.on("data", (chunk) => (size += chunk.length));
        file.stream.pipe(writeStream);
        return;
      }

      const transformer = sharp().resize({
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
      } else if (file.mimetype === "image/webp") {
        transformer.webp({ quality: IMAGE_CONFIG.webpQuality });
      }
      transformer.on("error", onError);
      transformer.on("data", (chunk) => (size += chunk.length));
      file.stream.pipe(transformer).pipe(writeStream);
    } catch (err) {
      cb(err as Error);
    }
  }

  _removeFile(
    _req: AuthRequest,
    file: Express.Multer.File,
    cb: (error: Error | null) => void,
  ) {
    fs.unlink((file as any).path, (err) => cb(err));
  }
}

export const upload = multer({
  storage: new OptimizedDiskStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});
