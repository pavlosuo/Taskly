"use client";
import { useState, useRef } from "react";
import { Paperclip, Send, X, Loader2 } from "lucide-react";
import { axiosApi } from "@/api/index";
import { MediaItem } from "shared/types";
import { useMediaPicker } from "@/providers/MediaPickerProvider";
import { useChats } from "@/providers/ChatProvider";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { useSingleChat } from "@/providers/SingleChatProvider";
import { useSocket } from "@/providers/SocketProvider";

export const ChatInput = () => {
  const { openPicker } = useMediaPicker();
  const { fetchChats } = useChats();
  const { chat, onMessageSent } = useSingleChat();
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<MediaItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    socket?.emit("typing:start", {
      chatId: chat._id,
      memberId: chat.member._id,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("typing:stop", {
        chatId: chat._id,
        memberId: chat.member._id,
      });
    }, 2000);
  };

  const handleAttach = () => {
    openPicker({
      accept: "all",
      multiple: true,
      onSelect: (items) => {
        setPendingMedia(
          items.filter((i) => !pendingMedia.some((m) => m._id === i._id)),
        );
      },
    });
  };

  const removePending = (id: string) => {
    setPendingMedia((prev) => prev.filter((m) => m._id !== id));
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && pendingMedia.length === 0) return;
    try {
      setIsSending(true);
      const { data } = await axiosApi.sendMessage(chat._id, {
        text: trimmed || undefined,
        mediaIds: pendingMedia.map((m) => m._id),
      });
      socket?.emit("typing:stop", {
        chatId: chat._id,
        memberId: chat.member._id,
      });
      onMessageSent(data.message);
      setText("");
      setPendingMedia([]);
      fetchChats();
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-[10px] text-grey px-1 text-center truncate">
                  {m.originalName}
                </div>
              )}
              <button
                onClick={() => removePending(m._id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={handleAttach}
          className="shrink-0 p-2.5 rounded-full hover:bg-muted text-grey"
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <textarea
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 resize-none bg-muted rounded-2xl px-4 py-2.5 text-sm outline-none max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={isSending || (!text.trim() && pendingMedia.length === 0)}
          className="shrink-0 p-2.5 rounded-full bg-primary text-white disabled:opacity-40"
          aria-label="Send"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};
