"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowUp, Paperclip, X } from "lucide-react";
import { axiosApi } from "@/api/index";
import { MediaItem } from "shared/types";
import { CHAT_MESSAGE_MAX_LENGTH, CHAT_MAX_MEDIA } from "shared/index";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { useSingleChat } from "@/providers/SingleChatProvider";
import { useSocket } from "@/providers/SocketProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { useToast } from "@/hooks/useToast";
import { useUser } from "@/providers/UserProvider";
import { FileThumbnail } from "@/components/shared/MediaPicker";

const TYPING_STOP_DELAY_MS = 2000;
const MAX_TEXTAREA_HEIGHT = 160;
const COUNTER_THRESHOLD = 0.85;

export const ChatInput = () => {
  const { t } = useTranslation("chats");
  const { openPicker } = useMediaPicker();
  const { chat, onMessageSent, onMessageDelete } = useSingleChat();
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { socket } = useSocket();
  const toast = useToast();
  const { user } = useUser();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const enterSendsRef = useRef(true);
  const chatId = chat._id;
  const memberId = chat.member._id;
  const hasContent = text.trim().length > 0 || pendingMedia.length > 0;
  const canSend = hasContent && !isSending;
  const mediaFull = pendingMedia.length >= CHAT_MAX_MEDIA;
  const showCounter =
    text.length >= CHAT_MESSAGE_MAX_LENGTH * COUNTER_THRESHOLD;

  useEffect(() => {
    enterSendsRef.current = !window.matchMedia("(pointer: coarse)").matches;
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [text]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket?.emit("typing:stop", { chatId, memberId });
      }
    };
  }, [socket, chatId, memberId]);

  const setTyping = (on: boolean) => {
    if (isTypingRef.current === on) return;
    isTypingRef.current = on;
    socket?.emit(on ? "typing:start" : "typing:stop", { chatId, memberId });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!value.trim()) {
      setTyping(false);
      return;
    }
    setTyping(true);
    typingTimeoutRef.current = setTimeout(
      () => setTyping(false),
      TYPING_STOP_DELAY_MS,
    );
  };

  const handleAttach = () => {
    openPicker({
      accept: "all",
      multiple: true,
      onSelect: (items) => {
        setPendingMedia((prev) =>
          [
            ...prev,
            ...items.filter((i) => !prev.some((m) => m._id === i._id)),
          ].slice(0, CHAT_MAX_MEDIA),
        );
      },
    });
  };

  const removePending = (id: string) => {
    setPendingMedia((prev) => prev.filter((m) => m._id !== id));
  };

  const handleSend = async () => {
    if (!canSend) return;
    const trimmed = text.trim();
    const media = [...pendingMedia];
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticMessage = {
      _id: tempId,
      chatId: chat._id,
      senderId: user?._id || "",
      text: trimmed,
      media: media.map((m) => ({ ...m, _id: `temp-${m._id}` })),
      readBy: [],
      reactions: [],
      edited: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setText("");
    setPendingMedia([]);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(false);
    onMessageSent(optimisticMessage);
    textareaRef.current?.focus();
    setIsSending(true);
    try {
      const { data } = await axiosApi.sendMessage(chat._id, {
        text: trimmed || undefined,
        mediaIds: media.map((m) => m._id),
      });
      if (data?.message) {
        onMessageDelete(tempId);
        onMessageSent(data.message);
      }
    } catch (e) {
      onMessageDelete(tempId);
      setText(trimmed);
      setPendingMedia(media);
      toast(getAxiosError(e));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      enterSendsRef.current
    ) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-background px-3 pt-2.5 pb-2.5 md:px-5">
      {pendingMedia.length > 0 && (
        <ul className="mb-1 flex gap-2 overflow-x-auto pt-2 pr-2 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {pendingMedia.map((m) => {
            return (
              <li key={m._id} className="relative shrink-0">
                <div className="h-16 w-16 rounded-xl object-cover ring-1 ring-border">
                  <FileThumbnail item={m} />
                </div>
                <button
                  type="button"
                  onClick={() => removePending(m._id)}
                  aria-label={t("input.removeAttachment", {
                    name: m.originalName,
                  })}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-transform after:absolute after:-inset-2 after:content-[''] hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <X aria-hidden="true" className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-end gap-1 rounded-[1.75rem] border border-transparent bg-muted p-1.5 transition-colors duration-150 focus-within:border-primary/40 focus-within:bg-background motion-reduce:transition-none">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAttach}
          disabled={mediaFull}
          aria-label={t("input.attach")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-grey transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        >
          <Paperclip aria-hidden="true" className="h-5 w-5" />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={t("input.placeholder")}
          aria-label={t("input.label")}
          maxLength={CHAT_MESSAGE_MAX_LENGTH}
          rows={1}
          className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-[15px] leading-5 text-foreground outline-none placeholder:text-grey"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSend}
          disabled={!canSend}
          aria-label={t("input.send")}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
            canSend
              ? "bg-primary text-white shadow-sm shadow-primary/30 hover:brightness-110"
              : "bg-foreground/10 text-grey"
          }`}
        >
          <ArrowUp aria-hidden="true" strokeWidth={2.5} className="h-5 w-5" />
        </button>
      </div>
      {showCounter && (
        <p
          className={`mt-1 pr-4 text-right text-xs tabular-nums ${
            text.length >= CHAT_MESSAGE_MAX_LENGTH
              ? "text-destructive"
              : "text-grey"
          }`}
        >
          {text.length}/{CHAT_MESSAGE_MAX_LENGTH}
        </p>
      )}
    </div>
  );
};
