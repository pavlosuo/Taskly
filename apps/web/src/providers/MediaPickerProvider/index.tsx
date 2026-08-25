"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { MediaPicker } from "@/shared/components/MediaPicker";
import { MediaItem } from "@shared/types";
import { FilterType } from "@/utils/getFileType";

type MediaPickerOptions = {
  accept?: FilterType;
  onSelect?: (item: MediaItem) => void;
  IsWait?: boolean;
};

interface MediaPickerContextType {
  openPicker: (options: MediaPickerOptions) => void;
  isOpen?: boolean;
}

const MediaPickerContext = createContext<MediaPickerContextType | null>(null);

export const useMediaPicker = () => {
  const ctx = useContext(MediaPickerContext);
  if (!ctx)
    throw new Error("useMediaPicker must be used within MediaPickerProvider");
  return ctx;
};

export const MediaPickerProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MediaPickerOptions | null>(null);

  const openPicker = useCallback((opts: MediaPickerOptions) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const handleSelect = (item: MediaItem) => {
    options?.onSelect?.(item);
    if (options?.IsWait) {
      setOpen(false);
      return;
    }
    setTimeout(() => setOpen(false), 50);
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      if (options?.IsWait) {
        setOpen(false);
        return;
      }
      setTimeout(() => setOpen(false), 50);
      return;
    }
    setOpen(o);
  };

  return (
    <MediaPickerContext.Provider value={{ openPicker, isOpen: open }}>
      {children}
      <MediaPicker
        open={open}
        onOpenChange={handleOpenChange}
        accept={options?.accept ?? "image"}
        onSelect={options?.onSelect ? handleSelect : undefined}
      />
    </MediaPickerContext.Provider>
  );
};
