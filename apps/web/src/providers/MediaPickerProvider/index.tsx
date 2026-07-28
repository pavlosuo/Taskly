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

type MediaPickerOptions = {
  accept?: "image" | "all";
  onSelect: (item: MediaItem) => void;
};

interface MediaPickerContextType {
  openPicker: (options: MediaPickerOptions) => void;
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
    options?.onSelect(item);
    setOpen(false);
  };

  return (
    <MediaPickerContext.Provider value={{ openPicker }}>
      {children}
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        accept={options?.accept ?? "image"}
        onSelect={handleSelect}
      />
    </MediaPickerContext.Provider>
  );
};
