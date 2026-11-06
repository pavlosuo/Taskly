"use client";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Paperclip, Send, X } from "lucide-react";
import { axiosApi } from "@/api/index";
import { MediaItem } from "shared/types";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { useChats } from "@/providers/ChatProvider";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { useSingleChat } from "@/providers/SingleChatProvider";
import { useSocket } from "@/providers/SocketProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { useToast } from "@/hooks/useToast";
import { useUser } from "@/providers/UserProvider";

const TYPING_STOP_DELAY_MS = 2000;

export const ChatInput = () => {
  const { t } = useTranslation("chats");
  const { openPicker } = useMediaPicker();
  const { fetchChats } = useChats();
  const { chat, onMessageSent } = useSingleChat();
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { socket } = useSocket();
  const toast = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUser();

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const emitTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket?.emit("typing:stop", {
      chatId: chat._id,
      memberId: chat.member._id,
    });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    socket?.emit("typing:start", {
      chatId: chat._id,
      memberId: chat.member._id,
    });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing:stop", {
        chatId: chat._id,
        memberId: chat.member._id,
      });
    }, TYPING_STOP_DELAY_MS);
  };

  const handleAttach = () => {
    openPicker({
      accept: "all",
      multiple: true,
      onSelect: (items) => {
        setPendingMedia((prev) => [
          ...prev,
          ...items.filter((i) => !prev.some((m) => m._id === i._id)),
        ]);
      },
    });
  };

  const removePending = (id: string) => {
    setPendingMedia((prev) => prev.filter((m) => m._id !== id));
  };

  const handleSend = async () => {
    if (isSending) return;
    const trimmed = text.trim();
    const media = [...pendingMedia];
    if (!trimmed && media.length === 0) return;
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
    emitTypingStop();
    onMessageSent(optimisticMessage);
    setIsSending(true);
    try {
      await axiosApi.sendMessage(chat._id, {
        text: trimmed || undefined,
        mediaIds: media.map((m) => m._id),
      });
      fetchChats();
    } catch (e) {
      setText(trimmed);
      setPendingMedia(media);
      toast(getAxiosError(e));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border px-4 py-3 shrink-0">
      {pendingMedia.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {pendingMedia.map((m) => (
            <div key={m._id} className="relative shrink-0">
              {m.mimeType?.startsWith("image/") ? (
                <ImageDisplay
                  src={m.url}
                  alt={m.originalName}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xs text-grey px-1 text-center truncate">
                  {m.originalName}
                </div>
              )}
              <button
                type="button"
                onClick={() => removePending(m._id)}
                aria-label={t("input.removeAttachment", {
                  name: m.originalName,
                })}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center"
              >
                <X aria-hidden="true" className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={handleAttach}
          className="shrink-0 p-2.5 rounded-full hover:bg-muted text-grey"
          aria-label={t("input.attach")}
        >
          <Paperclip aria-hidden="true" className="w-5 h-5" />
        </button>
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={t("input.placeholder")}
          aria-label={t("input.label")}
          rows={1}
          className="flex-1 resize-none bg-muted rounded-2xl px-4 py-2.5 text-sm outline-none max-h-32"
        />
        <button
          type="button"
          onClick={handleSend}
          className="shrink-0 p-2.5 rounded-full bg-primary text-white disabled:opacity-40"
          aria-label={t("input.send")}
        >
          <Send aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
