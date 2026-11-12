"use client";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  startTransition,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Upload,
  Trash2,
  Check,
  FileText,
  Music,
  Video,
  File,
  Maximize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/shared/FieldError";
import { axiosApi } from "@/api/index";
import {
  MediaItem,
  ALLOWED_MIME_TYPES,
  FilterType,
  MAX_FILES_PER_UPLOAD,
  FILTERS,
} from "shared/index";
import { getAxiosError } from "@/utils/getAxiosError";
import clsx from "clsx";
import { getFileType } from "@/utils/getFileType";
import { formatSize } from "@/utils/formatSize";
import { useFormatDate } from "@/hooks/useFormatDate";
import { useModal } from "@/providers/ModalProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { createPortal } from "react-dom";
import { Lightbox } from "@/components/shared/Lightbox";

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

export function FileIcon({
  mimeType,
  className,
}: {
  mimeType: string;
  className?: string;
}) {
  const type = getFileType(mimeType);
  const cls = clsx("text-grey", className);
  if (type === "video") return <Video aria-hidden="true" className={cls} />;
  if (type === "audio") return <Music aria-hidden="true" className={cls} />;
  if (type === "document")
    return <FileText aria-hidden="true" className={cls} />;
  return <File aria-hidden="true" className={cls} />;
}

export function FileThumbnail({
  item,
  className,
  onClick,
}: {
  item: MediaItem;
  className?: string;
  onClick?: () => void;
}) {
  const baseClassName = clsx(
    "w-full h-full",
    onClick && "cursor-pointer",
    className,
  );

  if (item.mimeType.startsWith("image/")) {
    return (
      <div
        onClick={onClick}
        className={clsx("relative overflow-hidden", baseClassName)}
      >
        <ImageDisplay
          src={item.url}
          alt={item.originalName}
          width={220}
          height={220}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  if (item.mimeType.startsWith("video/")) {
    return (
      <div
        onClick={onClick}
        className={clsx("relative overflow-hidden", baseClassName)}
      >
        <VideoDisplay src={item.url} />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-muted flex flex-col items-center justify-center gap-2 p-2",
        baseClassName,
      )}
    >
      <FileIcon mimeType={item.mimeType} className="w-8 h-8" />
      <p className="text-xs text-grey text-center truncate w-full px-1">
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
  const { t } = useTranslation(["media", "common"]);
  const { confirm } = useModal();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<FilterType>(accept);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null);
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<{
    message: string;
    values?: Record<string, unknown>;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    done: number;
  } | null>(null);
  const { lang } = useTheme();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openPreview = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);
  const closePreview = useCallback(() => setLightboxIndex(null), []);

  const selectedItem =
    selectedIds.size === 1
      ? (items.find((i) => i._id === [...selectedIds][0]) ?? null)
      : null;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    startTransition(() => {
      setIsLoadingMedia(true);
      setError(null);
    });
    axiosApi
      .getMedia()
      .then(({ data }) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((err) => {
        if (!cancelled) setError({ message: getAxiosError(err) });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMedia(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    startTransition(() => {
      if (open) {
        setFilter(accept);
      } else {
        setSelectedIds(new Set());
        setAnchorIndex(null);
        setFocusIndex(0);
        setLightboxIndex(null);
      }
    });
  }, [open, accept]);

  const filtered = items.filter((item) =>
    filter === "all" ? true : getFileType(item.mimeType) === filter,
  );

  const handleFilterChange = (next: FilterType) => {
    setLightboxIndex(null);
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

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (uploading) return;
      const files = Array.from(fileList);
      if (files.length === 0) return;

      if (files.length > MAX_FILES_PER_UPLOAD) {
        setError({
          message: "upload.tooMany",
          values: { max: MAX_FILES_PER_UPLOAD, selected: files.length },
        });
        return;
      }

      const invalid = files.filter((f) => !ALLOWED_MIME_TYPES.has(f.type));
      if (invalid.length > 0) {
        setError({
          message: "upload.unsupported",
          values: { count: invalid.length, type: invalid[0].type },
        });
      }

      const valid = files.filter((f) => ALLOWED_MIME_TYPES.has(f.type));
      if (valid.length === 0) return;
      setFilter(getFileType(valid[0].type));
      setUploading(true);
      setUploadProgress({ total: valid.length, done: 0 });
      if (invalid.length === 0) setError(null);
      const uploadedIds: string[] = [];
      const failed: string[] = [];
      for (const file of valid) {
        try {
          const { data } = await axiosApi.uploadMedia(file);
          const newItem = data.media;
          setItems((p) => [newItem, ...p]);
          uploadedIds.push(newItem._id);
        } catch {
          failed.push(file.name);
        } finally {
          setUploadProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
        }
      }

      if (failed.length > 0) {
        setError({
          message: "upload.failed",
          values: { count: failed.length, name: failed[0] },
        });
      }

      setSelectedIds(new Set(uploadedIds));
      setUploading(false);
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploading],
  );

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

  const deleteIds = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const confirmed = await confirm(
        t("deleteConfirm", { count: ids.length }),
      );
      if (!confirmed) return;
      const results = await Promise.allSettled(
        ids.map((id) => axiosApi.deleteMedia(id)),
      );
      const deleted = ids.filter((_, i) => results[i].status === "fulfilled");
      const failure = results.find(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      if (deleted.length > 0) {
        setItems((p) => p.filter((i) => !deleted.includes(i._id)));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          deleted.forEach((id) => next.delete(id));
          return next;
        });
      }
      if (failure) setError({ message: getAxiosError(failure.reason) });
    },
    [confirm, t],
  );

  const handleDeleteSelected = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      deleteIds([...selectedIds]);
    },
    [selectedIds, deleteIds],
  );

  const handleConfirmDisabled = useMemo(() => {
    const mediaItems = items.filter((i) => selectedIds.has(i._id));
    if (mediaItems.length === 0) return true;
    return !mediaItems.every((m) => {
      const type = getFileType(m.mimeType);
      return type === accept || accept === "all";
    });
  }, [items, selectedIds, accept]);

  const handleConfirm = useCallback(() => {
    if (handleConfirmDisabled) return;
    const mediaItems = items.filter((i) => selectedIds.has(i._id));
    if (mediaItems) onSelect?.(multiple ? mediaItems : [mediaItems[0]]);
    onOpenChange(false);
    setSelectedIds(new Set());
  }, [
    selectedIds,
    onSelect,
    onOpenChange,
    items,
    multiple,
    handleConfirmDisabled,
  ]);

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

  const hotkeyOpts = {
    enabled: open && lightboxIndex === null,
    enableOnFormTags: false,
  };

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

  useHotkeys(
    "space",
    (e) => {
      if ((e.target as HTMLElement).closest("button, label")) return;
      if (filtered.length === 0) return;
      e.preventDefault();
      const selectedIndex =
        selectedIds.size === 1
          ? filtered.findIndex((i) => selectedIds.has(i._id))
          : -1;
      openPreview(selectedIndex >= 0 ? selectedIndex : focusIndex);
    },
    hotkeyOpts,
    [filtered, selectedIds, focusIndex, openPreview],
  );

  const selectedItemDate = useFormatDate(selectedItem?.uploadedAt) || "";

  const emptyText = dragOver
    ? t("empty.drop")
    : isLoadingMedia
      ? t("empty.loading")
      : items.length === 0
        ? t("empty.library")
        : t("empty.category");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={clsx(
          "sm:max-w-5xl w-[calc(100%-2rem)] border-border p-0 gap-0 overflow-hidden",
          dragOver && "bg-primary/25 outline-dashed outline-primary outline-5",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.stopPropagation();
          if (lightboxIndex !== null) {
            e.preventDefault();
            setLightboxIndex(null);
          }
        }}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        draggable={false}
      >
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border">
          <div className="flex items-center gap-1 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => handleFilterChange(f.value)}
                className={clsx(
                  "text-xs px-3 py-1.5 rounded-lg transition-colors",
                  filter === f.value
                    ? "bg-primary text-white"
                    : "text-grey hover:text-foreground hover:bg-muted",
                )}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
          <label
            className={clsx(
              "flex items-center gap-1.5 text-xs font-medium text-primary",
              "hover:underline focus-within:underline underline-offset-2 cursor-pointer transition-opacity whitespace-nowrap",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            <Upload
              aria-hidden="true"
              className="w-3.5 h-3.5 min-w-3.5 min-h-3.5"
            />
            {uploading
              ? uploadProgress
                ? t("upload.progress", uploadProgress)
                : t("upload.uploading")
              : t("upload.label")}
            <input
              ref={inputRef}
              type="file"
              className="sr-only"
              multiple
              accept={[...ALLOWED_MIME_TYPES].join(",")}
              onChange={handleUpload}
            />
          </label>
        </div>
        <div className="grid grid-cols-1 grid-rows-[1fr_max-content] h-100 md:h-130 w-full md:grid-rows-1 md:grid-cols-[1fr_max-content]">
          <div
            className="overflow-y-auto p-4 transition-colors relative w-full"
            onClick={handleBackgroundClick}
          >
            {dragOver || isLoadingMedia || filtered.length === 0 ? (
              <div
                role="status"
                className="h-full flex flex-col items-center justify-center gap-3 text-grey"
              >
                <Upload
                  aria-hidden="true"
                  className={clsx(
                    "w-10 h-10 opacity-30",
                    dragOver && "opacity-100 text-white",
                  )}
                />
                <p className={clsx("text-sm", dragOver && "text-white")}>
                  {emptyText}
                </p>
              </div>
            ) : (
              <div
                ref={gridRef}
                role="listbox"
                aria-multiselectable={multiple}
                aria-label={t("title")}
                className="grid gap-2 grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 w-full"
              >
                {filtered.map((item, index) => {
                  const isSelected = selectedIds.has(item._id);
                  const isFocused = index === focusIndex;
                  return (
                    <div
                      key={item._id}
                      role="option"
                      aria-selected={isSelected}
                      aria-label={item.originalName}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item._id, index, e);
                      }}
                      onDoubleClick={() => {
                        if (!onSelect) {
                          openPreview(index);
                          return;
                        }
                        onSelect(multiple ? [item] : [item]);
                        onOpenChange(false);
                        setSelectedIds(new Set());
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
                      <button
                        type="button"
                        aria-label={t("preview.open")}
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(index);
                        }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/70 transition-opacity"
                      >
                        <Maximize2 aria-hidden="true" className="w-3.5 h-3.5" />
                      </button>
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check
                            aria-hidden="true"
                            className="w-3 h-3 text-white"
                          />
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
                <div className="grid grid-cols-2 md:grid-rows-[auto_auto_auto_1fr_auto_auto] md:grid-cols-1 gap-3 p-4 overflow-y-auto flex-1">
                  <div>
                    <p className="text-xs text-grey mb-0.5">
                      {t("details.name")}
                    </p>
                    <p className="text-sm text-foreground break-all">
                      {selectedItem.originalName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-grey mb-0.5">
                      {t("details.type")}
                    </p>
                    <p className="text-sm text-foreground">
                      {t(`filters.${getFileType(selectedItem.mimeType)}`)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-grey mb-0.5">
                      {t("details.size")}
                    </p>
                    <p className="text-sm text-foreground">
                      {formatSize(selectedItem.size, lang)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-grey mb-0.5">
                      {t("details.uploaded")}
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedItemDate}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = filtered.findIndex(
                        (i) => i._id === selectedItem._id,
                      );
                      if (idx >= 0) openPreview(idx);
                    }}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <Maximize2 aria-hidden="true" className="w-3.5 h-3.5" />
                    {t("details.preview")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 text-xs text-destructive hover:underline mt-auto pt-2"
                  >
                    <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                    {t("details.delete")}
                  </button>
                </div>
              </>
            ) : !dragOver && selectedIds.size > 1 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                <Check aria-hidden="true" className="w-10 h-10 text-primary" />
                <p className="text-sm text-foreground">
                  {t("details.selected", { count: selectedIds.size })}
                </p>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
                >
                  <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                  {t("details.deleteAll")}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3 text-center">
                <File
                  aria-hidden="true"
                  className="w-10 h-10 text-grey opacity-30"
                />
                <p className="text-xs text-grey">{t("details.empty")}</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          {error && (
            <FieldError
              role="alert"
              message={error.message}
              values={error.values}
              className="mr-auto self-center mt-0"
            />
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common:actions.cancel")}
          </Button>
          {onSelect && (
            <Button onClick={handleConfirm} disabled={handleConfirmDisabled}>
              {t("common:actions.select")}
            </Button>
          )}
        </div>
        {lightboxIndex !== null &&
          filtered[lightboxIndex] &&
          typeof document !== "undefined" &&
          createPortal(
            <div className="pointer-events-auto relative z-60">
              <Lightbox
                items={filtered}
                index={lightboxIndex}
                onClose={closePreview}
                onIndexChange={setLightboxIndex}
              />
            </div>,
            document.body,
          )}
      </DialogContent>
    </Dialog>
  );
}
