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
import { useTranslation, Trans } from "react-i18next";
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
import { FieldError } from "@/components/shared/FieldError";
import { useTheme } from "@/providers/ThemeProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { Button } from "@/components/ui/button";

export const Single: FC<{
  chat: ChatWithMember;
  messages?: Message[] | null;
  nextCursor?: string | null;
}> = ({ chat, messages: initialMessages, nextCursor: initialNextCursor }) => {
  const { t } = useTranslation(["chats", "common", "errors"]);
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
  const [error, setError] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const { socket } = useSocket();
  const isTyping = typingByChat[chatId] ?? false;
  const { lang } = useTheme();
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  useEffect(() => {
    const texts = CHAT_PAGE_META[lang];
    if (!texts) return;
    document.title = texts.title(chat.member.fullName) + " | " + APP_NAME;
  }, [lang, chat]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore || loadMoreFailed) return;
    setIsLoadingMore(true);
    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    try {
      const { data } = await axiosApi.getMessages(chatId, nextCursor);
      setMessages((prev) => [...data.items, ...prev]);
      setNextCursor(data.nextCursor);
      startTransition(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } catch (err) {
      setError(getAxiosError(err));
      setLoadMoreFailed(true);
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatId, nextCursor, isLoadingMore, loadMoreFailed]);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) =>
      prev.some((m) => m._id === message._id) ? prev : [...prev, message],
    );
  }, []);

  const handleMessageSent = (message: Message) => {
    appendMessage(message);
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
    axiosApi
      .getMessages(chatId)
      .then(({ data }) => {
        if (cancelled) return;
        setMessages(data.items);
        setNextCursor(data.nextCursor);
        didInitialScroll.current = false;
      })
      .catch((err) => {
        if (!cancelled) setError(getAxiosError(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInitial(false);
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
      appendMessage(message);
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
  }, [socket, chatId, chat, upsertChat, appendMessage]);

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
            type="button"
            onClick={() => router.push("/chats")}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted text-grey"
            aria-label={t("common:actions.back")}
          >
            <ArrowLeft aria-hidden="true" className="w-5 h-5" />
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
          {loadMoreFailed && (
            <div className="py-2 flex flex-col items-center gap-1">
              <FieldError role="alert" message={error} />
              <Button
                type="button"
                onClick={() => {
                  setError(undefined);
                  setLoadMoreFailed(false);
                }}
                size="sm"
                className="mt-1"
              >
                {t("common:actions.retry")}
              </Button>
            </div>
          )}
          {isLoadingInitial && (
            <div role="status" className="py-8 text-center text-sm text-grey">
              {t("room.loading")}
            </div>
          )}
          {!isLoadingInitial && !error && messages.length === 0 && (
            <p className="py-8 text-center text-sm text-grey">
              {t("room.empty")}
            </p>
          )}
          {!isLoadingInitial &&
            messages.map((m) => <MessageBubble key={m._id} message={m} />)}
          <FieldError
            role="alert"
            message={loadMoreFailed ? undefined : error}
            className="text-center mt-2"
          />
          {isTyping && (
            <Marker role="status" className="mt-4">
              <MarkerContent className="shimmer">
                <Trans
                  i18nKey="typing"
                  ns="chats"
                  values={{ name: chat.member.fullName }}
                  components={{ bold: <span className="font-medium" /> }}
                />
              </MarkerContent>
            </Marker>
          )}
        </div>
        <ChatInput />
      </div>
    </SingleChatProvider>
  );
};
