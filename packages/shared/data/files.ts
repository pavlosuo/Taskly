import { FilterType } from "shared/index";

export const MEDIA_QUOTA_BYTES = 100 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

export const FILTERS: { value: FilterType; labelKey: string }[] = [
  { value: "all", labelKey: "filters.all" },
  { value: "image", labelKey: "filters.image" },
  { value: "video", labelKey: "filters.video" },
  { value: "audio", labelKey: "filters.audio" },
  { value: "pdf", labelKey: "filters.pdf" },
  { value: "word", labelKey: "filters.word" },
  { value: "excel", labelKey: "filters.excel" },
  { value: "other", labelKey: "filters.other" },
];

export const INLINE_RE =
  /^(image\/(jpeg|png|webp|gif|avif)|video\/|audio\/|application\/pdf$)/;

export const MAX_PIXELS = 100_000_000;

export const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const LEGACY_OFFICE = new Set([
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
]);

export const TEXT_EXT: Record<string, string> = {
  "text/plain": ".txt",
  "text/csv": ".csv",
};

export const MIME_ALIASES: Record<string, string> = {
  "audio/vnd.wave": "audio/wav",
  "audio/x-wav": "audio/wav",
};

export const EXT_OVERRIDE: Record<string, string> = {
  "application/msword": ".doc",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.ms-powerpoint": ".ppt",
  "audio/webm": ".webm",
  "audio/wav": ".wav",
};
