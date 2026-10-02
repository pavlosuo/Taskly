"use client";
import { useEffect, useState } from "react";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { X, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { MediaItemPublic } from "shared/types";
import { getFileType } from "@/utils/getFileType";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import { FileIcon } from "@/components/shared/MediaPicker";
import clsx from "clsx";

type Props = {
  items: MediaItemPublic[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function Lightbox({ items, index, onClose, onIndexChange }: Props) {
  const current = items[index];
  const type = getFileType(current.mimeType);
  const isPreviewAble =
    type === "image" || type === "video" || type === "pdf" || type === "audio";
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft")
        onIndexChange((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onClose, onIndexChange]);

  const handleDownload = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      const res = await fetch(current.url, { credentials: "include" });
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = current.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 px-4 py-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="z-10 absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
        disabled={isDownloading}
        className="z-10 absolute right-16 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-50"
        aria-label="Download"
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
      {items.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index - 1 + items.length) % items.length);
          }}
          className="z-10 absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Previous"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <div
        className="flex h-full max-w-full flex-col items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={clsx(
            "flex items-center justify-center",
            type === "pdf" ? "h-[80vh] w-[90vw] max-w-4xl" : "h-[50vh] w-full",
          )}
        >
          {type === "image" && (
            <ImageDisplay
              src={current.url}
              alt={current.originalName}
              className="h-full w-auto object-contain"
            />
          )}
          {type === "video" && (
            <VideoPlayer
              src={current.url}
              className="h-full w-auto aspect-video"
            />
          )}
          {type === "pdf" && (
            <iframe
              src={current.url}
              className="w-full h-full rounded-lg bg-white"
              title={current.originalName}
            />
          )}
          {type === "audio" && (
            <div className="flex flex-col items-center justify-center gap-4 w-80 max-w-full rounded-xl bg-white/5 p-8">
              <FileIcon
                mimeType={current.mimeType}
                className="w-14 h-14 text-white/60"
              />
              <audio controls src={current.url} className="w-full" />
            </div>
          )}
          {!isPreviewAble && (
            <div className="flex flex-col items-center justify-center gap-3 w-80 max-w-full rounded-xl bg-white/5 p-8">
              <FileIcon
                mimeType={current.mimeType}
                className={clsx(
                  "w-14 h-14",
                  type === "word" && "text-blue-400",
                  type === "excel" && "text-green-400",
                  type !== "word" && type !== "excel" && "text-white/60",
                )}
              />
              <p className="text-xs text-white/50 text-center">
                No preview available for this file type
              </p>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download
              </button>
            </div>
          )}
        </div>

        <p className="mt-4 text-sm font-medium text-white max-w-100 truncate">
          {current.originalName}
        </p>
        {items.length > 1 && (
          <p className="mt-1 text-xs text-white/60">
            {index + 1} / {items.length}
          </p>
        )}
      </div>

      {items.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index + 1) % items.length);
          }}
          className="z-10 absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Next"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
