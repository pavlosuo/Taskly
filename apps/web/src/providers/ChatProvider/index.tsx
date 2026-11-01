"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
  startTransition,
} from "react";
import { ChatWithMember } from "shared/types";
import { axiosApi } from "@/api/index";
import { useUser } from "@/providers/UserProvider";
import { useSocket } from "@/providers/SocketProvider";
import { useRun } from "@/hooks/useRun";
import { useToast } from "@/hooks/useToast";
import { getAxiosError } from "@/utils/getAxiosError";

interface ChatContextType {
  chats: ChatWithMember[];
  isLoading: boolean;
  totalUnread: number;
  activeChat: ChatWithMember | null;
  isInitialized: boolean;
  typingByChat: Record<string, boolean>;
  fetchChats: () => Promise<void>;
  createChat: (memberId: string) => Promise<ChatWithMember>;
  deleteChat: (chatId: string) => Promise<void>;
  upsertChat: (chat: ChatWithMember) => void;
  setActiveChat: (chat: ChatWithMember | null) => void;
}

interface ChatProviderProps {
  children: ReactNode;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [chats, setChats] = useState<ChatWithMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatWithMember | null>(null);
  const { user } = useUser();
  const { socket } = useSocket();
  const [isInitialized, setIsInitialized] = useState(false);
  const [typingByChat, setTypingByChat] = useState<Record<string, boolean>>({});
  const run = useRun(setIsLoading);
  const toast = useToast();

  const totalUnread = useMemo(
    () =>
      chats.reduce((sum, c) => {
        return c._id === activeChat?._id ? sum : sum + c.unreadCount;
      }, 0),
    [chats, activeChat],
  );

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.getChats();
      setChats(data.chats);
    } catch (e) {
      toast(getAxiosError(e));
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [toast]);

  const createChat = useCallback(
    (memberId: string) =>
      run(
        async () => {
          const { data } = await axiosApi.createChat(memberId);
          const chat = data.chat;
          setChats((prev) => {
            const exists = prev.some((c) => c._id === chat._id);
            return exists
              ? prev.map((c) => (c._id === chat._id ? chat : c))
              : [chat, ...prev];
          });
          return chat;
        },
        { loading: false },
      ),
    [run],
  );

  const deleteChat = useCallback(
    (chatId: string) =>
      run(
        async () => {
          await axiosApi.deleteChat(chatId);
          setChats((prev) => prev.filter((c) => c._id !== chatId));
        },
        { loading: false, success: "chats:toast.deleted" },
      ),
    [run],
  );

  const upsertChat = useCallback((updated: ChatWithMember) => {
    setChats((prev) => {
      const exists = prev.some((c) => c._id === updated._id);
      const next = exists
        ? prev.map((c) => (c._id === updated._id ? updated : c))
        : [updated, ...prev];
      return [...next].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    });
  }, []);

  useEffect(() => {
    if (user) {
      startTransition(() => fetchChats());
    } else {
      startTransition(() => setChats([]));
    }
  }, [user, fetchChats]);

  useEffect(() => {
    if (!socket) return;
    const handleChat = ({ chat }: { chat: ChatWithMember }) => {
      upsertChat(chat);
    };
    socket.on("chat:new", handleChat);
    socket.on("chat:updated", handleChat);
    return () => {
      socket.off("chat:new", handleChat);
      socket.off("chat:updated", handleChat);
    };
  }, [socket, upsertChat]);

  useEffect(() => {
    if (!socket) return;

    const handleStart = ({ chatId }: { chatId: string }) => {
      setTypingByChat((prev) => ({ ...prev, [chatId]: true }));
    };
    const handleStop = ({ chatId }: { chatId: string }) => {
      setTypingByChat((prev) => ({ ...prev, [chatId]: false }));
    };

    socket.on("typing:start", handleStart);
    socket.on("typing:stop", handleStop);
    return () => {
      socket.off("typing:start", handleStart);
      socket.off("typing:stop", handleStop);
    };
  }, [socket]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        isLoading,
        totalUnread,
        activeChat,
        isInitialized,
        typingByChat,
        fetchChats,
        createChat,
        deleteChat,
        upsertChat,
        setActiveChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChats must be used within ChatProvider");
  return context;
};
