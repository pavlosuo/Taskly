"use client";
import { FC, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { axiosApi } from "api/index";
import { useChats } from "@/providers/ChatProvider";
import { Message, ChatWithMember } from "@shared/types";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import { MessageBubble } from "@/screens/chats/ui/MessageBubble";
import { ChatInput } from "@/screens/chats/ui/ChatInput";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { SingleChatProvider } from "@/providers/SingleChatProvider";

export const Single: FC<{
  chat: ChatWithMember;
  messages?: Message[] | null;
  nextCursor?: string | null;
}> = ({ chat, messages: initialMessages, nextCursor: initialNextCursor }) => {
  const router = useRouter();
  const { upsertChat, activeChat, setActiveChat } = useChats();
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

  useEffect(() => {
    upsertChat(chat);
  }, [upsertChat, chat]);

  useEffect(() => {
    setActiveChat(chat);
    return () => setActiveChat(null);
  }, [chat, setActiveChat]);

  useEffect(() => {
    if (initialMessages) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      setIsLoadingInitial(true);
    });
    axiosApi.getMessages(chatId).then(({ data }) => {
      if (cancelled) return;
      setMessages(data.data.items);
      setNextCursor(data.data.nextCursor);
      setIsLoadingInitial(false);
      didInitialScroll.current = false;
    });
    return () => {
      cancelled = true;
    };
  }, [chatId, initialMessages]);

  useEffect(() => {
    axiosApi.markChatRead(chatId).catch(() => {});
  }, [chatId]);

  useEffect(() => {
    if (!isLoadingInitial && !didInitialScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      didInitialScroll.current = true;
    }
  }, [isLoadingInitial, messages.length]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const container = scrollRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    const { data } = await axiosApi.getMessages(chatId, nextCursor);
    setMessages((prev) => [...data.data.items, ...prev]);
    setNextCursor(data.data.nextCursor);
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
    setIsLoadingMore(false);
  }, [chatId, nextCursor, isLoadingMore]);

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

  const handleMessageSent = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    requestAnimationFrame(() => {
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
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto flex w-full flex-col py-12 px-6"
        >
          <div ref={topSentinelRef} />
          {isLoadingInitial && (
            <div className="py-8 text-center text-sm text-grey">Loading...</div>
          )}
          {!isLoadingInitial &&
            messages.map((m) => <MessageBubble key={m._id} message={m} />)}
          <Marker role="status" className="mt-4">
            <MarkerContent className="shimmer">
              <span className="font-medium">{chat.member.fullName}</span> is
              typing...
            </MarkerContent>
          </Marker>
        </div>
        <ChatInput />
      </div>
    </SingleChatProvider>
  );
};
