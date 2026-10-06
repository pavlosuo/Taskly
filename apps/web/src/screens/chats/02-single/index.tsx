"use client";
import {
  FC,
  useEffect,
  useRef,
  useState,
  useCallback,
  startTransition,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { axiosApi } from "@/api/index";
import { useChats } from "@/providers/ChatProvider";
import {
  Message,
  ChatWithMember,
  CHAT_PAGE_META,
  APP_NAME,
} from "shared/index";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { MessageBubble } from "@/screens/chats/ui/MessageBubble";
import { ChatInput } from "@/screens/chats/ui/ChatInput";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { SingleChatProvider } from "@/providers/SingleChatProvider";
import { useSocket } from "@/providers/SocketProvider";
import Link from "next/link";
import { OnlineStatus } from "@/components/shared/OnlineStatus";
import { useTheme } from "@/providers/ThemeProvider";

export const Single: FC<{
  chat: ChatWithMember;
  messages?: Message[] | null;
  nextCursor?: string | null;
}> = ({ chat, messages: initialMessages, nextCursor: initialNextCursor }) => {
  const router = useRouter();
  const { upsertChat, activeChat, setActiveChat, typingByChat } = useChats();
  const displayChat = activeChat ?? chat;
  const chatId = displayChat._id;
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor ?? null,
  );
  const [isLoadingInitial, setIsLoadingInitial] = useState(!initialMessages);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const { socket } = useSocket();
  const isTyping = typingByChat[chatId] ?? false;
  const { lang } = useTheme();

  useEffect(() => {
    const texts = CHAT_PAGE_META[lang];
    if (!texts) return;
    document.title = texts.title(chat.member.fullName) + " | " + APP_NAME;
  }, [lang, chat]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const { data } = await axiosApi.getMessages(chatId, nextCursor);
    setMessages((prev) => [...data.items, ...prev]);
    setNextCursor(data.nextCursor);
    startTransition(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
    setIsLoadingMore(false);
  }, [chatId, nextCursor, isLoadingMore]);

  const handleMessageSent = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    startTransition(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const handleMessageUpdate = (updated: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m._id === updated._id ? updated : m)),
    );
  };

  const handleMessageDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  };

  useEffect(() => {
    if (!socket) return;
    socket.emit("chat:join", chatId);
    return () => {
      socket.emit("chat:leave", chatId);
    };
  }, [socket, chatId]);

  useEffect(() => {
    setActiveChat(chat);
    return () => setActiveChat(null);
  }, [chat, setActiveChat]);

  useEffect(() => {
    if (initialMessages) return;
    let cancelled = false;
    startTransition(() => {
      setIsLoadingInitial(true);
    });
    axiosApi.getMessages(chatId).then(({ data }) => {
      if (cancelled) return;
      setMessages(data.items);
      setNextCursor(data.nextCursor);
      setIsLoadingInitial(false);
      didInitialScroll.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, [chatId, initialMessages]);

  useEffect(() => {
    axiosApi.markChatRead(chatId).catch(() => {});
    upsertChat({
      ...chat,
      unreadCount: 0,
    });
  }, [chatId, upsertChat, chat]);

  useEffect(() => {
    if (!isLoadingInitial && !didInitialScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      didInitialScroll.current = true;
    }
  }, [isLoadingInitial, messages.length]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { root: scrollRef.current, threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  useEffect(() => {
    if (!socket) return;
    const handleNew = ({ message }: { message: Message }) => {
      setMessages((prev) => {
        return [...prev, message];
      });
      axiosApi.markChatRead(chatId).catch(() => {});
      upsertChat({
        ...chat,
        unreadCount: 0,
      });
      startTransition(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    };

    const handleUpdated = ({ message }: { message: Message }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m)),
      );
    };

    const handleDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    };

    const handleRead = () => {
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          readBy: m.readBy.includes(chat.member._id)
            ? m.readBy
            : [...m.readBy, chat.member._id],
        })),
      );
    };
    socket.on("message:new", handleNew);
    socket.on("message:updated", handleUpdated);
    socket.on("message:deleted", handleDeleted);
    socket.on("chat:read", handleRead);
    return () => {
      socket.off("message:new", handleNew);
      socket.off("message:updated", handleUpdated);
      socket.off("message:deleted", handleDeleted);
      socket.off("chat:read", handleRead);
    };
  }, [socket, chatId, chat, upsertChat]);

  return (
    <SingleChatProvider
      value={{
        chat: displayChat,
        onMessageSent: handleMessageSent,
        onMessageUpdate: handleMessageUpdate,
        onMessageDelete: handleMessageDelete,
      }}
    >
      <div className="flex flex-col w-full h-full">
        <div className="flex items-center gap-3 py-3.5 px-4 border-b border-border shrink-0">
          <button
            onClick={() => router.push("/chats")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted text-grey"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative shrink-0">
            {chat.member.avatar ? (
              <ImageDisplay
                src={chat.member.avatar.url}
                alt={chat.member.fullName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {chat.member.initials}
              </div>
            )}
            <OnlineStatus user={chat.member} variant="compact" />
          </div>
          {chat.member.publicLink ? (
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={chat.member.publicLink}
              className="min-w-0"
            >
              <p className="text-sm font-semibold text-foreground truncate">
                {chat.member.fullName}
              </p>
              {chat.member.username && (
                <p className="text-xs text-grey truncate">
                  @{chat.member.username}
                </p>
              )}
            </Link>
          ) : (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {chat.member.fullName}
              </p>
              {chat.member.username && (
                <p className="text-xs text-grey truncate">
                  @{chat.member.username}
                </p>
              )}
            </div>
          )}
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex w-full flex-col py-6 px-2 md:py-12 md:px-6"
        >
          <div ref={topSentinelRef} />
          {isLoadingInitial && (
            <div className="py-8 text-center text-sm text-grey">Loading...</div>
          )}
          {!isLoadingInitial &&
            messages.map((m) => <MessageBubble key={m._id} message={m} />)}
          {isTyping && (
            <Marker role="status" className="mt-4">
              <MarkerContent className="shimmer">
                <span className="font-medium">{chat.member.fullName}</span> is
                typing...
              </MarkerContent>
            </Marker>
          )}
        </div>
        <ChatInput />
      </div>
    </SingleChatProvider>
  );
};
