"use client";
import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Check } from "lucide-react";
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

export const ImageDisplay = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={clsx(className, "w-full h-full object-cover")}
      src={src}
      alt={alt}
    />
  );
};

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  accept = "image",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  accept?: "image" | "all";
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    axiosApi.getMedia().then(({ data }) => {
      const all = data.data.items;
      setItems(
        accept === "image"
          ? all.filter((i) => i.mimeType.startsWith("image/"))
          : all,
      );
    });
  }, [open, accept]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
  };

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
    const item = items.find((i) => i._id === selected);
    if (!item) return;
    onSelect(item);
    onOpenChange(false);
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-border">
        <DialogHeader>
          <DialogTitle>Media library</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 border border-dashed border-border",
              "text-sm text-grey hover:text-foreground hover:border-primary/50 cursor-pointer transition-colors",
              uploading && "opacity-50 pointer-events-none",
            )}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload new file"}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={
                accept === "image" ? "image/*" : "image/*,application/pdf"
              }
              onChange={handleUpload}
            />
          </label>
          {items.length === 0 ? (
            <p className="text-sm text-grey text-center py-8">No files yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-80 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelected(item._id)}
                  className={clsx(
                    "relative aspect-square border-2 cursor-pointer overflow-hidden group transition-all",
                    selected === item._id
                      ? "border-primary"
                      : "border-transparent hover:border-border",
                  )}
                >
                  {item.mimeType.startsWith("image/") ? (
                    <ImageDisplay src={item.url} alt={item.originalName} />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-grey p-2 text-center">
                      {item.originalName}
                    </div>
                  )}
                  {selected === item._id && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <button
                    onClick={(e) => handleDelete(item._id, e)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-red">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selected}>
              Select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
