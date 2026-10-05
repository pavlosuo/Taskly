export type MediaItem = {
  _id: string;
  ownerId: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  publicSources: string[];
  chatIds: string[];
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
