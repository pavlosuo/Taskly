import { FilterType } from "shared/index";

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
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
