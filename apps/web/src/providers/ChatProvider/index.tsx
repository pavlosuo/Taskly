"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { ChatWithMember } from "@shared/types";
import { axiosApi } from "api/index";
import { useUser } from "@/providers/UserProvider";
import { useEffect } from "react";

interface ChatContextType {
  chats: ChatWithMember[];
  isLoading: boolean;
  totalUnread: number;
  fetchChats: () => Promise<void>;
  hydrate: (chats: ChatWithMember[]) => void;
  createChat: (memberId: string) => Promise<ChatWithMember>;
  deleteChat: (chatId: string) => Promise<void>;
  upsertChat: (chat: ChatWithMember) => void;
  removeChatLocal: (chatId: string) => void;
  setActiveChat: (chat: ChatWithMember | null) => void;
  activeChat: ChatWithMember | null;
}

interface ChatProviderProps {
  children: ReactNode;
  initialChats: ChatWithMember[];
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider = ({ children, initialChats }: ChatProviderProps) => {
  const [chats, setChats] = useState<ChatWithMember[]>(initialChats);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatWithMember | null>(null);
  const { user } = useUser();

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: body } = await axiosApi.getChats();
      setChats(body.data.chats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hydrate = useCallback((initial: ChatWithMember[]) => {
    setChats(initial);
  }, []);

  const createChat = useCallback(async (memberId: string) => {
    const { data: body } = await axiosApi.createChat(memberId);
    const chat = body.data.chat;
    setChats((prev) => {
      const exists = prev.some((c) => c._id === chat._id);
      return exists
        ? prev.map((c) => (c._id === chat._id ? chat : c))
        : [chat, ...prev];
    });
    return chat;
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    await axiosApi.deleteChat(chatId);
    setChats((prev) => prev.filter((c) => c._id !== chatId));
  }, []);

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

  const removeChatLocal = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c._id !== chatId));
  }, []);

  const totalUnread = useMemo(
    () => chats.reduce((sum, c) => sum + c.unreadCount, 0),
    [chats],
  );

  useEffect(() => {
    if (initialChats.length === 0) fetchChats();
  }, [user, initialChats, fetchChats]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        isLoading,
        totalUnread,
        fetchChats,
        hydrate,
        createChat,
        deleteChat,
        upsertChat,
        removeChatLocal,
        setActiveChat,
        activeChat,
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
