"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
  startTransition,
} from "react";
import { MediaPicker } from "@/components/shared/MediaPicker";
import { MediaItem, FilterType } from "shared/types";
import { useUser } from "@/providers/UserProvider";

type MediaPickerOptions = {
  accept?: FilterType;
  onSelect?: (items: MediaItem[]) => void;
  IsWait?: boolean;
  multiple?: boolean;
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
  const { user } = useUser();

  const openPicker = useCallback((opts: MediaPickerOptions) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  const handleSelect = (items: MediaItem[]) => {
    options?.onSelect?.(items);
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

  useEffect(() => {
    if (!user?._id) {
      startTransition(() => {
        setOpen(false);
        setOptions(null);
      });
    }
  }, [user?._id]);

  return (
    <MediaPickerContext.Provider value={{ openPicker, isOpen: open }}>
      {children}
      <MediaPicker
        open={open}
        onOpenChange={handleOpenChange}
        accept={options?.accept ?? "all"}
        onSelect={options?.onSelect ? handleSelect : undefined}
        multiple={options?.multiple ?? false}
      />
    </MediaPickerContext.Provider>
  );
};
