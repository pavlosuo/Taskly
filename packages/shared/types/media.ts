export type MediaStatus = "processing" | "ready" | "failed";

export type MediaItem = {
  _id: string;
  ownerId: string;
  filename: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  status: MediaStatus;
  optimizing: boolean;
  uploadedAt: Date;
  publicSources: string[];
  chatIds: string[];
  durationSec?: number;
  posterFilename?: string;
};

export type MediaItemPublic = {
  url: string;
  originalName: string;
  mimeType: string;
};

export type FilterType =
  | "all"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "other"
  | "pdf"
  | "word"
  | "excel";
