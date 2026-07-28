"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Trash2,
  Check,
  FileText,
  Music,
  Video,
  File,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { axiosApi } from "@/lib/api";
import { MediaItem } from "@shared/types";
import { getAxiosError } from "@/utils/getAxiosError";
import clsx from "clsx";
import {ALLOWED_MIME_TYPES} from "@shared/data";

const ACCEPT_STRING = [...ALLOWED_MIME_TYPES].join(",");

type FilterType = "all" | "image" | "video" | "audio" | "document" | "other";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "image", label: "Images" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Documents" },
  { value: "other", label: "Other" },
];

function getFileType(mimeType?: string): FilterType {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("presentation") ||
    mimeType.includes("document") ||
    mimeType === "text/plain" ||
    mimeType === "text/csv"
  )
    return "document";
  return "other";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const ImageDisplay = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    className={clsx("w-full h-full object-cover", className)}
    src={src}
    alt={alt}
  />
);

function FileIcon({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}) {
  const type = getFileType(mimeType);
  const cls = clsx("text-grey", className);
  if (type === "video") return <Video className={cls} />;
  if (type === "audio") return <Music className={cls} />;
  if (type === "document") return <FileText className={cls} />;
  return <File className={cls} />;
}

function FileThumbnail({ item }: { item: MediaItem }) {
  if (item.mimeType.startsWith("image/")) {
    return <ImageDisplay src={item.url} alt={item.originalName} />;
  }
  return (
    <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-2 p-2">
      <FileIcon mimeType={item.mimeType} className="w-8 h-8" />
      <p className="text-[10px] text-grey text-center truncate w-full px-1">
        {item.originalName}
      </p>
    </div>
  );
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  accept = "image",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  accept?: FilterType;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<FilterType>(accept);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItem = items.find((i) => i._id === selected) ?? null;

  useEffect(() => {
    if (!open) return;
    axiosApi.getMedia().then(({ data }) => setItems(data.data.items));
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setFilter(accept === "image" ? "image" : "all");
      });
    }
  }, [open, accept]);

  const filtered = items.filter((item) =>
    filter === "all" ? true : getFileType(item.mimeType) === filter,
  );

  const uploadFile = useCallback(async (file: File) => {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setError(`File type "${file.type}" is not allowed.`);
      return;
    }
    setFilter(getFileType(file.type));
    setUploading(true);
    setError("");
    try {
      const { data } = await axiosApi.uploadMedia(file);
      const newItem = data.data.media;
      setItems((p) => [newItem, ...p]);
      setSelected(newItem._id);
    } catch (e) {
      setError(getAxiosError(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosApi.deleteMedia(id);
      setItems((p) => p.filter((i) => i._id !== id));
      if (selected === id) setSelected(null);
    } catch (e) {
      setError(getAxiosError(e));
    }
  };

  const handleConfirm = () => {
    if (!selectedItem) return;
    onSelect(selectedItem);
    onOpenChange(false);
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-5xl border-border p-0 gap-0 overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle>Media library</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-lg transition-colors",
                  filter === f.value
                    ? "bg-primary text-white"
                    : "text-grey hover:text-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label
            className={clsx(
              "flex items-center gap-1.5 text-xs font-medium text-primary",
              "hover:underline underline-offset-2 cursor-pointer transition-opacity",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : "Upload file"}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept === "image" ? "image/*" : ACCEPT_STRING}
              onChange={handleUpload}
            />
          </label>
        </div>
        <div className="flex h-130">
          <div
            className={clsx(
              "flex-1 overflow-y-auto p-4 transition-colors relative",
              dragOver && "bg-primary/25",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-grey">
                <Upload
                  className={clsx(
                    "w-10 h-10 opacity-30",
                    dragOver && "opacity-100 text-foreground",
                  )}
                />
                <p className={clsx("text-sm", dragOver && "text-foreground")}>
                  {dragOver
                    ? "Drop to upload"
                    : items.length === 0
                      ? "No files yet — drag and drop or upload"
                      : "No files in this category"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {filtered.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelected(item._id)}
                    className={clsx(
                      "relative aspect-square border-2 rounded-lg cursor-pointer overflow-hidden group transition-all",
                      selected === item._id
                        ? "border-primary"
                        : "border-transparent hover:border-border",
                    )}
                  >
                    <FileThumbnail item={item} />
                    {selected === item._id && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="w-64 border-l border-border flex flex-col shrink-0">
            {selectedItem ? (
              <>
                <div className="h-48 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedItem.mimeType.startsWith("image/") ? (
                    <ImageDisplay
                      src={selectedItem.url}
                      alt={selectedItem.originalName}
                      className="object-contain"
                    />
                  ) : (
                    <FileIcon
                      mimeType={selectedItem.mimeType}
                      className="w-16 h-16"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
                  <div>
                    <p className="text-xs text-grey mb-0.5">Name</p>
                    <p className="text-sm text-foreground break-all">
                      {selectedItem.originalName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-grey mb-0.5">Type</p>
                    <p className="text-sm text-foreground">
                      {selectedItem.mimeType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-grey mb-0.5">Size</p>
                    <p className="text-sm text-foreground">
                      {formatSize(selectedItem.size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-grey mb-0.5">Uploaded</p>
                    <p className="text-sm text-foreground">
                      {formatDate(selectedItem.uploadedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(selectedItem._id, e)}
                    className="flex items-center gap-1.5 text-xs text-red hover:underline mt-auto pt-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete permanently
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                <File className="w-10 h-10 text-grey opacity-30" />
                <p className="text-xs text-grey">
                  Select a file to see its details
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          {error && (
            <p className="text-xs text-red mr-auto self-center">{error}</p>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !selected || getFileType(selectedItem?.mimeType) !== accept
            }
          >
            Select
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
