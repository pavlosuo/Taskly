"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
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
import { ALLOWED_MIME_TYPES } from "@shared/data";
import { getFileType, FilterType, FILTERS } from "@/utils/getFileType";
import { formatSize } from "@/utils/formatSize";
import { formatDate } from "@/utils/formatDate";

const ACCEPT_STRING = [...ALLOWED_MIME_TYPES].join(",");

export const VideoDisplay = ({ src }: { src: string; className?: string }) => {
  return (
    <video
      muted
      playsInline
      src={src}
      className="w-full h-full object-cover"
    ></video>
  );
};

export const ImageDisplay = ({
  src,
  alt,
  className,
  width,
  height,
}: {
  src?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) =>
  src && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      draggable={false}
      decoding="async"
      className={clsx("object-cover", className)}
      src={src}
      alt={alt}
      width={width}
      height={height}
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
    return (
      <ImageDisplay
        src={item.url}
        alt={item.originalName}
        className="w-full h-full"
      />
    );
  }
  if (item.mimeType.startsWith("video/")) {
    return (
      <div className="w-full h-full">
        <VideoDisplay src={item.url} />
      </div>
    );
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
  multiple = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (items: MediaItem[]) => void;
  accept?: FilterType;
  multiple?: boolean;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<FilterType>(accept);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    done: number;
  } | null>(null);

  const MAX_FILES_PER_UPLOAD = 25;

  const selectedItem =
    selectedIds.size === 1
      ? (items.find((i) => i._id === [...selectedIds][0]) ?? null)
      : null;

  useEffect(() => {
    if (!open) return;
    axiosApi.getMedia().then(({ data }) => setItems(data.data.items));
  }, [open]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (open) {
        setFilter(accept);
      } else {
        setSelectedIds(new Set());
        setAnchorIndex(null);
        setFocusIndex(0);
      }
    });
  }, [open, accept]);

  const filtered = items.filter((item) =>
    filter === "all" ? true : getFileType(item.mimeType) === filter,
  );

  const handleFilterChange = (next: FilterType) => {
    setFilter(next);
    const nextFiltered = items.filter((item) =>
      next === "all" ? true : getFileType(item.mimeType) === next,
    );
    setSelectedIds((prev) => {
      const kept = new Set(
        [...prev].filter((id) => nextFiltered.some((f) => f._id === id)),
      );
      return kept.size === prev.size ? prev : kept;
    });
    setFocusIndex((i) => Math.min(i, Math.max(nextFiltered.length - 1, 0)));
  };

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    if (files.length > MAX_FILES_PER_UPLOAD) {
      setError(
        `You can upload up to ${MAX_FILES_PER_UPLOAD} files at once (selected ${files.length}).`,
      );
      return;
    }

    const invalid = files.filter((f) => !ALLOWED_MIME_TYPES.has(f.type));
    if (invalid.length > 0) {
      setError(
        invalid.length === 1
          ? `File type "${invalid[0].type}" is not allowed.`
          : `${invalid.length} files have an unsupported type and were skipped.`,
      );
    }

    const valid = files.filter((f) => ALLOWED_MIME_TYPES.has(f.type));
    if (valid.length === 0) return;
    setFilter(getFileType(valid[0].type));
    setUploading(true);
    setUploadProgress({ total: valid.length, done: 0 });
    if (invalid.length === 0) setError("");
    const uploadedIds: string[] = [];
    const failed: string[] = [];
    for (const file of valid) {
      try {
        const { data } = await axiosApi.uploadMedia(file);
        const newItem = data.data.media;
        setItems((p) => [newItem, ...p]);
        uploadedIds.push(newItem._id);
      } catch (e) {
        failed.push(file.name);
      } finally {
        setUploadProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
    }

    if (failed.length > 0) {
      setError(
        failed.length === 1
          ? `Failed to upload "${failed[0]}".`
          : `Failed to upload ${failed.length} files.`,
      );
    }

    setSelectedIds(new Set(uploadedIds));
    setUploading(false);
    setUploadProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      setDragOver(true);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) {
      return;
    }
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles],
  );

  useEffect(() => {
    const reset = () => setDragOver(false);
    document.addEventListener("dragend", reset);
    document.addEventListener("drop", reset);
    return () => {
      document.removeEventListener("dragend", reset);
      document.removeEventListener("drop", reset);
    };
  }, []);

  const deleteIds = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => axiosApi.deleteMedia(id)));
      setItems((p) => p.filter((i) => !ids.includes(i._id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } catch (e) {
      setError(getAxiosError(e));
    }
  }, []);

  const handleDeleteSelected = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      deleteIds([...selectedIds]);
    },
    [selectedIds, deleteIds],
  );

  const handleConfirm = useCallback(() => {
    if (!selectedIds.size) return;
    const mediaItems = items.filter((i) => selectedIds.has(i._id));
    if (mediaItems) onSelect?.(multiple ? mediaItems : [mediaItems[0]]);
    onOpenChange(false);
    setSelectedIds(new Set());
  }, [selectedIds, onSelect, onOpenChange, items, multiple]);

  const selectRange = (fromIndex: number, toIndex: number) => {
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    setSelectedIds(new Set(filtered.slice(start, end + 1).map((i) => i._id)));
  };

  const handleItemClick = (id: string, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && anchorIndex !== null) {
      selectRange(anchorIndex, index);
    } else if (e.metaKey || e.ctrlKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      setAnchorIndex(index);
    } else {
      setSelectedIds(new Set([id]));
      setAnchorIndex(index);
    }
    setFocusIndex(index);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedIds(new Set());
    }
  };

  const getColumnCount = () => {
    if (!gridRef.current) return 1;
    const cols = window
      .getComputedStyle(gridRef.current)
      .gridTemplateColumns.split(" ").length;
    return cols || 1;
  };

  const moveFocus = (nextIndex: number, extend: boolean) => {
    if (filtered.length === 0) return;
    const clamped = Math.max(0, Math.min(nextIndex, filtered.length - 1));
    setFocusIndex(clamped);
    const id = filtered[clamped]._id;
    if (extend) {
      selectRange(anchorIndex ?? clamped, clamped);
    } else {
      setSelectedIds(new Set([id]));
      setAnchorIndex(clamped);
    }
  };

  const hotkeyOpts = { enabled: open, enableOnFormTags: false };

  useHotkeys(
    "mod+a",
    (e) => {
      e.preventDefault();
      setSelectedIds(new Set(filtered.map((i) => i._id)));
    },
    hotkeyOpts,
    [filtered],
  );

  useHotkeys("escape", () => setSelectedIds(new Set()), hotkeyOpts);

  useHotkeys(
    "delete, backspace",
    (e) => {
      e.preventDefault();
      if (selectedIds.size > 0) handleDeleteSelected();
    },
    hotkeyOpts,
    [selectedIds, handleDeleteSelected],
  );

  useHotkeys(
    "enter",
    () => {
      if (selectedIds.size === 1) handleConfirm();
    },
    hotkeyOpts,
    [selectedIds, handleConfirm],
  );

  useHotkeys(
    "right",
    (e) => {
      e.preventDefault();
      moveFocus(focusIndex + 1, e.shiftKey);
    },
    hotkeyOpts,
    [focusIndex, filtered, anchorIndex],
  );

  useHotkeys(
    "left",
    (e) => {
      e.preventDefault();
      moveFocus(focusIndex - 1, e.shiftKey);
    },
    hotkeyOpts,
    [focusIndex, filtered, anchorIndex],
  );

  useHotkeys(
    "down",
    (e) => {
      e.preventDefault();
      moveFocus(focusIndex + getColumnCount(), e.shiftKey);
    },
    hotkeyOpts,
    [focusIndex, filtered, anchorIndex],
  );

  useHotkeys(
    "up",
    (e) => {
      e.preventDefault();
      moveFocus(focusIndex - getColumnCount(), e.shiftKey);
    },
    hotkeyOpts,
    [focusIndex, filtered, anchorIndex],
  );

  useHotkeys(
    "home",
    (e) => {
      e.preventDefault();
      moveFocus(0, e.shiftKey);
    },
    hotkeyOpts,
    [filtered, anchorIndex],
  );

  useHotkeys(
    "end",
    (e) => {
      e.preventDefault();
      moveFocus(filtered.length - 1, e.shiftKey);
    },
    hotkeyOpts,
    [filtered, anchorIndex],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={clsx(
          "sm:max-w-5xl w-[calc(100%-2rem)] border-border p-0 gap-0 overflow-hidden",
          dragOver && "bg-primary/25 outline-dashed outline-primary outline-5",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.stopPropagation()}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        draggable={false}
      >
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle>Media library</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
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
              "hover:underline underline-offset-2 cursor-pointer transition-opacity whitespace-nowrap",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            <Upload className="w-3.5 h-3.5 min-w-3.5 min-h-3.5" />
            {uploading
              ? uploadProgress
                ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
                : "Uploading..."
              : "Upload files"}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              accept={ACCEPT_STRING}
              onChange={handleUpload}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 grid-rows-[1fr_max-content] h-130 w-full md:grid-rows-1 md:grid-cols-[1fr_max-content]">
          <div
            className="overflow-y-auto p-4 transition-colors relative w-full"
            onClick={handleBackgroundClick}
          >
            {dragOver || filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-grey">
                <Upload
                  className={clsx(
                    "w-10 h-10 opacity-30",
                    dragOver && "opacity-100 text-white",
                  )}
                />
                <p className={clsx("text-sm", dragOver && "text-white")}>
                  {dragOver
                    ? "Drop to upload"
                    : items.length === 0
                      ? "No files yet — drag and drop or upload"
                      : "No files in this category"}
                </p>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="grid gap-2 grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 w-full"
              >
                {filtered.map((item, index) => {
                  const isSelected = selectedIds.has(item._id);
                  const isFocused = index === focusIndex;
                  return (
                    <div
                      key={item._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item._id, index, e);
                      }}
                      onDoubleClick={() => {
                        setSelectedIds(new Set([item._id]));
                        handleConfirm();
                      }}
                      className={clsx(
                        "relative aspect-square border-2 rounded-lg cursor-pointer overflow-hidden group transition-all",
                        isSelected
                          ? "border-primary"
                          : "border-transparent hover:border-border",
                        isFocused &&
                          !isSelected &&
                          "outline-2 outline-offset-1 outline-primary/40",
                      )}
                    >
                      <FileThumbnail item={item} />
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="h-auto md:h-full overflow-auto md:overflow-hidden w-full md:w-60 md:border-l md:border-border flex flex-col">
            {!dragOver && selectedIds.size === 1 && selectedItem ? (
              <>
                <div className="hidden h-33.75 bg-muted md:flex items-center justify-center shrink-0 overflow-hidden">
                  {selectedItem.mimeType.startsWith("image/") ? (
                    <ImageDisplay
                      src={selectedItem.url}
                      alt={selectedItem.originalName}
                      className="object-contain"
                    />
                  ) : selectedItem.mimeType.startsWith("video/") ? (
                    <VideoDisplay
                      src={selectedItem.url}
                      className="object-contain"
                    />
                  ) : (
                    <FileIcon
                      mimeType={selectedItem.mimeType}
                      className="w-16 h-16"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 p-4 overflow-y-auto flex-1">
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
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 text-xs text-red hover:underline mt-auto pt-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete permanently
                  </button>
                </div>
              </>
            ) : !dragOver && selectedIds.size > 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                <Check className="w-10 h-10 text-primary" />
                <p className="text-sm text-foreground">
                  {selectedIds.size} files selected
                </p>
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 text-xs text-red hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete all selected
                </button>
              </div>
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
          {onSelect && (
            <Button
              onClick={handleConfirm}
              disabled={
                !items.every((m) => {
                  const type = getFileType(m.mimeType);
                  return type === accept || accept === "all";
                })
              }
            >
              Select
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
