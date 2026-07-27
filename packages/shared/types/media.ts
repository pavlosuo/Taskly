export type MediaVisibility = "public" | "chat";

export type MediaItem = {
  _id: string;
  userId: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  visibility: MediaVisibility;
  chatId?: string;
};
