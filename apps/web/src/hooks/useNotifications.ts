"use client";
import { useCallback, useEffect, useState, startTransition } from "react";
import { axiosApi } from "@/api/index";
import { NotificationItem } from "shared/index";

const POLL_INTERVAL_MS = 15000;

export const useNotifications = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosApi.getNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => {
    startTransition(() => {
      load();
    });
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((n) => n._id === id);
      if (!target || target.read) return;
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await axiosApi.markNotificationRead(id);
      } catch {
        load();
      }
    },
    [items, load],
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await axiosApi.markAllNotificationsRead();
    } catch {
      load();
    }
  }, [load]);

  return { items, unreadCount, markRead, markAllRead, reload: load };
};
