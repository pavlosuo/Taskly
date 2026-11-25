import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import sharp, { Metadata } from "sharp";
import { storage } from "@/utils/storage";
import { mediaKey } from "@/utils/index";
import { MAX_PIXELS } from "shared/data";
import { MediaSource, MediaEmit, FirstUpdate } from "@/types";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";

const BIN: Record<string, string> = {
  ffmpeg: process.env.FFMPEG_PATH || (ffmpegPath as string) || "ffmpeg",
  ffprobe: process.env.FFPROBE_PATH || ffprobe.path || "ffprobe",
};

const IMAGE = {
  maxSide: 1440,
  jpegQuality: 80,
  webpQuality: 80,
  avifQuality: 80,
  gifMinGain: 0.9,
};

const VIDEO = {
  maxSide: 1080,
  crf: 26,
  preset: "veryfast",
  audioBitrate: "96k",
  minGain: 0.9,
  threads: 2,
};

const STILL = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function createLimiter(max: number) {
  let active = 0;
  const queue: Array<() => void> = [];
  const release = () => {
    const next = queue.shift();
    if (next) next();
    else active--;
  };
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active < max) active++;
    else await new Promise<void>((resolve) => queue.push(resolve));
    try {
      return await fn();
    } finally {
      release();
    }
  };
}

const imageLimit = createLimiter(3);

const plainLimit = createLimiter(4);

const gifLimit = createLimiter(1);

const readyLimit = createLimiter(2);

const transcodeLimit = createLimiter(1);

function run(cmd: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn(BIN[cmd] ?? cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => p.kill("SIGKILL"), timeoutMs);
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr = (stderr + d).slice(-2000)));
    p.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    p.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited with ${code}: ${stderr}`));
    });
  });
}

const rmQuiet = (p: string) => fs.promises.rm(p, { force: true });

const removeQuiet = (key: string) => storage.remove(key).catch(() => undefined);

async function imageSize(p: string) {
  const m = await sharp(p, { limitInputPixels: MAX_PIXELS }).metadata();
  const h = m.pageHeight ?? m.height;
  const swap = (m.orientation ?? 1) >= 5;
  return { width: swap ? h : m.width, height: swap ? m.width : h };
}

async function probeVideo(p: string) {
  const out = JSON.parse(
    await run(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        p,
      ],
      30_000,
    ),
  );
  const s = out.streams?.[0];
  if (!s) throw new Error("no video stream");
  const rotation = Number(
    s.side_data_list?.find(
      (d: { rotation?: number }) => d.rotation !== undefined,
    )?.rotation ??
      s.tags?.rotate ??
      0,
  );
  const rotated = Math.abs(rotation) % 180 === 90;
  return {
    width: (rotated ? s.height : s.width) as number,
    height: (rotated ? s.width : s.height) as number,
    durationSec: Number(out.format?.duration ?? s.duration) || undefined,
  };
}

async function uploadAsIs(i: MediaSource, emit: MediaEmit) {
  const key = mediaKey(i.ownerId, path.basename(i.localPath));
  const { size } = await fs.promises.stat(i.localPath);
  await storage.put(key, i.localPath, i.mimeType);
  const dims = i.mimeType.startsWith("image/")
    ? await imageSize(i.localPath)
    : {};
  await emit({ key, mimeType: i.mimeType, size, ...dims, final: true });
}

async function processStill(i: MediaSource, emit: MediaEmit, meta: Metadata) {
  const key = mediaKey(i.ownerId, path.basename(i.localPath));
  const outPath = `${i.localPath}.out`;
  try {
    const originalSize = (await fs.promises.stat(i.localPath)).size;
    const resized = Math.max(meta.width ?? 0, meta.height ?? 0) > IMAGE.maxSide;
    let img = sharp(i.localPath, { limitInputPixels: MAX_PIXELS })
      .rotate()
      .resize({
        width: IMAGE.maxSide,
        height: IMAGE.maxSide,
        fit: "inside",
        withoutEnlargement: true,
      });
    if (i.mimeType === "image/jpeg") {
      img = img.jpeg({
        quality: IMAGE.jpegQuality,
        mozjpeg: true,
        progressive: true,
      });
    } else if (i.mimeType === "image/png") {
      img = img.png({ compressionLevel: 9, adaptiveFiltering: true });
    } else if (i.mimeType === "image/webp") {
      img = img.webp({
        quality: IMAGE.webpQuality,
        effort: 5,
        smartSubsample: true,
      });
    } else {
      img = img.avif({ quality: IMAGE.avifQuality, effort: 4 });
    }
    const info = await img.toFile(outPath);
    const useOriginal = !resized && !meta.exif && info.size >= originalSize;
    const finalPath = useOriginal ? i.localPath : outPath;
    await storage.put(key, finalPath, i.mimeType);
    await emit({
      key,
      mimeType: i.mimeType,
      size: useOriginal ? originalSize : info.size,
      ...(await imageSize(finalPath)),
      final: true,
    });
  } finally {
    await rmQuiet(outPath);
  }
}

async function processGif(i: MediaSource, emit: MediaEmit) {
  const base = path.basename(i.localPath, path.extname(i.localPath));
  const outPath = path.join(path.dirname(i.localPath), `${base}.opt.gif`);
  const key = mediaKey(i.ownerId, path.basename(i.localPath));
  const originalSize = (await fs.promises.stat(i.localPath)).size;
  await storage.put(key, i.localPath, i.mimeType);
  const first: FirstUpdate = {
    key,
    mimeType: i.mimeType,
    size: originalSize,
    ...(await imageSize(i.localPath)),
  };
  await emit({ ...first, final: false });
  let optKey: string | undefined;
  try {
    await gifLimit(async () => {
      const info = await sharp(i.localPath, {
        animated: true,
        limitInputPixels: MAX_PIXELS,
      })
        .resize({
          width: IMAGE.maxSide,
          height: IMAGE.maxSide,
          fit: "inside",
          withoutEnlargement: true,
        })
        .gif({ effort: 10 })
        .toFile(outPath);
      if (info.size >= originalSize * IMAGE.gifMinGain) {
        await emit({ ...first, final: true });
        return;
      }
      optKey = mediaKey(i.ownerId, `${base}.opt.gif`);
      await storage.put(optKey, outPath, "image/gif");
      await emit({
        key: optKey,
        mimeType: "image/gif",
        size: info.size,
        ...(await imageSize(outPath)),
        final: true,
      });
      await removeQuiet(key);
    });
  } catch {
    if (optKey) await removeQuiet(optKey);
    await emit({ ...first, final: true });
  } finally {
    await rmQuiet(outPath);
  }
}

async function processAnimatedWebp(
  i: MediaSource,
  emit: MediaEmit,
  meta: Metadata,
) {
  const key = mediaKey(i.ownerId, path.basename(i.localPath));
  const outPath = `${i.localPath}.out`;
  try {
    await gifLimit(async () => {
      const originalSize = (await fs.promises.stat(i.localPath)).size;
      const resized =
        Math.max(meta.width ?? 0, meta.pageHeight ?? meta.height ?? 0) >
        IMAGE.maxSide;
      const info = await sharp(i.localPath, {
        animated: true,
        limitInputPixels: MAX_PIXELS,
      })
        .resize({
          width: IMAGE.maxSide,
          height: IMAGE.maxSide,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: IMAGE.webpQuality, effort: 4 })
        .toFile(outPath);
      const useOriginal =
        !resized && info.size >= originalSize * IMAGE.gifMinGain;
      const finalPath = useOriginal ? i.localPath : outPath;
      await storage.put(key, finalPath, i.mimeType);
      await emit({
        key,
        mimeType: i.mimeType,
        size: useOriginal ? originalSize : info.size,
        ...(await imageSize(finalPath)),
        final: true,
      });
    });
  } finally {
    await rmQuiet(outPath);
  }
}

async function processVideo(i: MediaSource, emit: MediaEmit) {
  const dir = path.dirname(i.localPath);
  const base = path.basename(i.localPath, path.extname(i.localPath));
  const remuxPath = path.join(dir, `${base}.fast.mp4`);
  const optPath = path.join(dir, `${base}.opt.mp4`);
  const posterPath = path.join(dir, `${base}.poster.jpg`);
  try {
    const first: FirstUpdate = await readyLimit(async () => {
      const src = await probeVideo(i.localPath).catch(() => null);
      let readyPath = i.localPath;
      let mimeType = i.mimeType;
      let key = mediaKey(i.ownerId, path.basename(i.localPath));
      if (i.mimeType === "video/mp4" || i.mimeType === "video/quicktime") {
        try {
          await run(
            "ffmpeg",
            [
              "-nostdin",
              "-y",
              "-v",
              "error",
              "-i",
              i.localPath,
              "-c",
              "copy",
              "-movflags",
              "+faststart",
              remuxPath,
            ],
            600_000,
          );
          readyPath = remuxPath;
          mimeType = "video/mp4";
          key = mediaKey(i.ownerId, `${base}.mp4`);
        } catch {
          readyPath = i.localPath;
        }
      }
      await storage.put(key, readyPath, mimeType);
      let posterKey: string | undefined;
      try {
        await run(
          "ffmpeg",
          [
            "-nostdin",
            "-y",
            "-v",
            "error",
            "-i",
            i.localPath,
            "-vf",
            "thumbnail=100,scale='min(720,iw)':-2",
            "-frames:v",
            "1",
            "-q:v",
            "4",
            posterPath,
          ],
          60_000,
        );
        posterKey = mediaKey(i.ownerId, `${base}.poster.jpg`);
        await storage.put(posterKey, posterPath, "image/jpeg");
      } catch {
        posterKey = undefined;
      }
      const { size } = await fs.promises.stat(readyPath);
      return {
        key,
        mimeType,
        size,
        width: src?.width,
        height: src?.height,
        durationSec: src?.durationSec,
        posterKey,
      };
    });
    await emit({ ...first, final: false });
    await transcodeLimit(async () => {
      let optKey: string | undefined;
      try {
        const side = VIDEO.maxSide;
        const scale = `scale=w='trunc(iw*min(1,${side}/max(iw,ih))/2)*2':h='trunc(ih*min(1,${side}/max(iw,ih))/2)*2'`;
        await run(
          "ffmpeg",
          [
            "-nostdin",
            "-y",
            "-v",
            "error",
            "-i",
            i.localPath,
            "-map",
            "0:v:0",
            "-map",
            "0:a:0?",
            "-vf",
            scale,
            "-c:v",
            "libx264",
            "-preset",
            VIDEO.preset,
            "-crf",
            String(VIDEO.crf),
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            VIDEO.audioBitrate,
            "-map_metadata",
            "-1",
            "-movflags",
            "+faststart",
            "-threads",
            String(VIDEO.threads),
            optPath,
          ],
          1_800_000,
        );
        const opt = await probeVideo(optPath).catch(() => null);
        const optSize = (await fs.promises.stat(optPath)).size;
        if (optSize >= first.size * VIDEO.minGain) {
          await emit({ ...first, final: true });
          return;
        }
        optKey = mediaKey(i.ownerId, `${base}.opt.mp4`);
        await storage.put(optKey, optPath, "video/mp4");
        await emit({
          ...first,
          key: optKey,
          mimeType: "video/mp4",
          size: optSize,
          width: opt?.width ?? first.width,
          height: opt?.height ?? first.height,
          durationSec: opt?.durationSec ?? first.durationSec,
          final: true,
        });
        await removeQuiet(first.key);
      } catch {
        if (optKey) await removeQuiet(optKey);
        await emit({ ...first, final: true });
      }
    });
  } finally {
    await Promise.all([
      rmQuiet(remuxPath),
      rmQuiet(optPath),
      rmQuiet(posterPath),
    ]);
  }
}

async function processImage(i: MediaSource, emit: MediaEmit) {
  if (!STILL.has(i.mimeType)) return uploadAsIs(i, emit);
  const meta = await sharp(i.localPath, {
    limitInputPixels: MAX_PIXELS,
  }).metadata();
  if ((meta.pages ?? 1) > 1) {
    return i.mimeType === "image/webp"
      ? processAnimatedWebp(i, emit, meta)
      : uploadAsIs(i, emit);
  }
  return processStill(i, emit, meta);
}

export async function processMedia(
  i: MediaSource,
  emit: MediaEmit,
): Promise<void> {
  try {
    if (i.mimeType === "image/gif") await processGif(i, emit);
    else if (i.mimeType.startsWith("image/"))
      await imageLimit(() => processImage(i, emit));
    else if (i.mimeType.startsWith("video/")) await processVideo(i, emit);
    else await plainLimit(() => uploadAsIs(i, emit));
  } finally {
    await rmQuiet(i.localPath);
  }
}
