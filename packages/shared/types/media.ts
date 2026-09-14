export type MediaItem = {
  _id: string;
  ownerId: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  publicSources: string[];
  chatIds: string[];
};

export type MediaItemPublic = {
  url: string;
  originalName: string;
  mimeType: string;
};
