"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  startTransition,
} from "react";
import { usePathname } from "next/navigation";

export function useTabNotifications(totalUnread: number) {
  const [originalTitle, setOriginalTitle] = useState("");
  const originalFaviconImg = useRef<HTMLImageElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    startTransition(() => {
      setOriginalTitle(document.title);
    });
    return () => {
      startTransition(() => {
        setOriginalTitle("");
      });
    };
  }, [pathname]);

  useEffect(() => {
    const img = new Image();
    img.src = "/favicon.ico";
    img.onload = () => {
      originalFaviconImg.current = img;
    };
    startTransition(() => {
      setOriginalTitle(document.title);
    });
    const audio = new Audio(
      "/sounds/universfield-new-notification-012-363675.mp3",
    );
    audio.volume = 0.5;
    audioRef.current = audio;
    return () => {
      startTransition(() => {
        setOriginalTitle("");
      });
    };
  }, []);

  const setFavicon = useCallback((href: string) => {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, []);

  const drawBadgedFavicon = useCallback(
    (count: number) => {
      const img = originalFaviconImg.current;
      if (!img) return;
      if (count === 0) {
        setFavicon(img.src);
        return;
      }
      const size = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      const radius = size / 2;
      const x = size - radius;
      ctx.beginPath();
      ctx.arc(x, radius, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#e40016";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 44px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = count > 9 ? "9+" : String(count);
      ctx.fillText(label, x, radius + 4);
      setFavicon(canvas.toDataURL("image/png"));
    },
    [setFavicon],
  );

  const updateTitle = useCallback(
    (count: number) => {
      document.title =
        count > 0 ? `(${count}) ${originalTitle}` : originalTitle;
    },
    [originalTitle],
  );

  const notify = useCallback(() => {
    updateTitle(totalUnread);
    drawBadgedFavicon(totalUnread);
    audioRef.current?.play();
  }, [updateTitle, drawBadgedFavicon, totalUnread]);

  useEffect(() => {
    drawBadgedFavicon(totalUnread);
  }, [totalUnread, drawBadgedFavicon]);

  return { notify };
}
