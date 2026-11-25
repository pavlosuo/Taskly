"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { axiosApi } from "@/api/index";
import { useSocket } from "@/providers/SocketProvider";
import { useUser } from "@/providers/UserProvider";
import { NotificationItem } from "shared/index";

const MAX_ITEMS = 50;
const SOUND_SRC = "/sounds/universfield-new-notification-012-363675.mp3";
const SOUND_LOCK_MS = 3000;
const HIDDEN_TAB_DELAY_MS = 400;
const TITLE_PREFIX_RE = /^\(\d+\+?\)\s*/;

type ReadPayload = {
  id?: string;
  ids?: string[];
  chatId?: string;
  all?: boolean;
};

type DeletedPayload = { id?: string; ids?: string[]; chatId?: string };

interface NotificationContextType {
  items: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  markChatRead: (chatId: string) => void;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const useTabIndicators = (count: number) => {
  const pathname = usePathname();
  const countRef = useRef(count);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const audio = new Audio(SOUND_SRC);
    audio.volume = 0.5;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const apply = () => {
      const c = countRef.current;
      const base = document.title.replace(TITLE_PREFIX_RE, "");
      const next = c > 0 ? `(${c > 9 ? "9+" : c}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const titleEl = document.querySelector("title");
    if (!titleEl) return;
    const observer = new MutationObserver(apply);
    observer.observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [count, pathname]);

  const playSound = useCallback((key: string) => {
    const play = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };
    if (typeof navigator === "undefined" || !("locks" in navigator)) {
      play();
      return;
    }

    const delay =
      document.visibilityState === "visible" ? 0 : HIDDEN_TAB_DELAY_MS;

    setTimeout(() => {
      navigator.locks
        .request(`notif-sound:${key}`, { ifAvailable: true }, async (lock) => {
          if (!lock) return;
          play();
          await new Promise((r) => setTimeout(r, SOUND_LOCK_MS));
        })
        .catch(() => {});
    }, delay);
  }, []);

  return { playSound };
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocket();
  const { user } = useUser();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const itemsRef = useRef<NotificationItem[]>([]);
  const { playSound } = useTabIndicators(unreadCount);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const load = useCallback(async () => {
    try {
      const { data } = await axiosApi.getNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => {
    if (user?._id) {
      startTransition(() => {
        load();
      });
    } else {
      startTransition(() => {
        setItems([]);
        setUnreadCount(0);
      });
    }
  }, [user?._id, load]);

  useEffect(() => {
    if (!socket) return;

    const onNew = ({ notification }: { notification: NotificationItem }) => {
      const prev = itemsRef.current.find((n) => n._id === notification._id);
      const delta = !notification.read && (!prev || prev.read) ? 1 : 0;
      const isFresh =
        !notification.read &&
        (!prev || prev.createdAt !== notification.createdAt);
      setItems((list) =>
        [notification, ...list.filter((n) => n._id !== notification._id)].slice(
          0,
          MAX_ITEMS,
        ),
      );
      if (delta) setUnreadCount((c) => c + delta);
      if (isFresh) playSound(`${notification._id}:${notification.createdAt}`);
    };

    const onRead = (p: ReadPayload) => {
      const match = (n: NotificationItem) =>
        !!p.all ||
        n._id === p.id ||
        !!p.ids?.includes(n._id) ||
        (!!p.chatId && n.chatId === p.chatId);
      const delta = itemsRef.current.filter((n) => !n.read && match(n)).length;
      setItems((list) =>
        list.map((n) => (match(n) ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => (p.all ? 0 : Math.max(0, c - delta)));
    };

    const onDeleted = (p: DeletedPayload) => {
      const match = (n: NotificationItem) =>
        n._id === p.id ||
        !!p.ids?.includes(n._id) ||
        (!!p.chatId && n.chatId === p.chatId);
      const delta = itemsRef.current.filter((n) => !n.read && match(n)).length;
      setItems((list) => list.filter((n) => !match(n)));
      setUnreadCount((c) => Math.max(0, c - delta));
    };

    const onReconnect = () => load();

    socket.on("notification:new", onNew);
    socket.on("notification:read", onRead);
    socket.on("notification:deleted", onDeleted);
    socket.io.on("reconnect", onReconnect);
    return () => {
      socket.off("notification:new", onNew);
      socket.off("notification:read", onRead);
      socket.off("notification:deleted", onDeleted);
      socket.io.off("reconnect", onReconnect);
    };
  }, [socket, load, playSound]);

  const markRead = useCallback(
    async (id: string) => {
      const target = itemsRef.current.find((n) => n._id === id);
      if (!target || target.read) return;
      setItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await axiosApi.markNotificationRead(id);
      } catch {
        load();
      }
    },
    [load],
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

  const markChatRead = useCallback((chatId: string) => {
    const unread = itemsRef.current.filter(
      (n) => !n.read && n.chatId === chatId,
    ).length;
    if (!unread) return;
    setItems((list) =>
      list.map((n) => (n.chatId === chatId ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - unread));
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const target = itemsRef.current.find((n) => n._id === id);
      if (!target) return;
      setItems((prev) => prev.filter((n) => n._id !== id));
      if (!target.read) setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await axiosApi.deleteNotification(id);
      } catch {
        load();
      }
    },
    [load],
  );

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      markRead,
      markAllRead,
      markChatRead,
      remove,
      reload: load,
    }),
    [items, unreadCount, markRead, markAllRead, markChatRead, remove, load],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  }
  return context;
};
