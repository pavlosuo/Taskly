"use client";
import { FC, useState } from "react";
import Link from "next/link";
import { Trash2, Paperclip } from "lucide-react";
import { ChatWithMember } from "@shared/types";
import { useChats } from "@/providers/ChatProvider";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import { useModal } from "@/providers/ModalProvider";
import { OnlineStatus } from "@/shared/components/OnlineStatus";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { useTheme } from "@/providers/ThemeProvider";
import clsx from "clsx";

export const ChatListItem: FC<{ chat: ChatWithMember }> = ({ chat }) => {
  const { deleteChat, typingByChat } = useChats();
  const [isDeleting, setIsDeleting] = useState(false);
  const { confirm } = useModal();
  const preview = chat.lastMessage ? (chat.lastMessage.text ?? null) : null;
  const isTyping = typingByChat[chat._id] ?? false;
  const date = new Date(chat?.lastMessage?.createdAt || "");
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const { lang } = useTheme();
  const time = sameDay
    ? date.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString(lang, { month: "short", day: "numeric" });

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    confirm(`Delete conversation with ${chat.member.fullName}?`).then(
      async (confirmed) => {
        if (!confirmed) return;
        try {
          setIsDeleting(true);
          await deleteChat(chat._id);
        } finally {
          setIsDeleting(false);
        }
      },
    );
  };

  return (
    <Link
      href={`/chats/${chat._id}`}
      className="group flex items-center gap-3 py-4 px-4 hover:bg-muted transition-colors"
    >
      <div className="relative shrink-0">
        {chat.member.avatar ? (
          <ImageDisplay
            src={chat.member.avatar.url}
            alt={chat.member.fullName}
            width={52}
            height={52}
            className="w-13 h-13 rounded-full object-cover"
          />
        ) : (
          <div className="w-13 h-13 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {chat.member.initials}
          </div>
        )}
        {chat.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
            {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
          </span>
        )}
        <OnlineStatus user={chat.member} variant="compact" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-[1fr_max-content] grid-rows-2 gap-0.5">
        <span
          className={clsx(
            "truncate text-sm",
            chat.unreadCount > 0
              ? "font-semibold text-foreground"
              : "font-medium text-foreground",
          )}
        >
          {chat.member.fullName}
        </span>
        <div className="flex items-center gap-1">
          {chat.lastMessage?.hasMedia && (
            <Paperclip className="w-3.5 h-3.5 text-grey shrink-0" />
          )}
          {isTyping ? (
            <Marker role="status" className="h-4 flex items-center">
              <MarkerContent className="shimmer">
                <span className="truncate text-xs text-foreground">
                  {chat.member.fullName}
                </span>{" "}
                is typing...
              </MarkerContent>
            </Marker>
          ) : (
            <p className="truncate text-xs h-4 flex items-center text-foreground">
              {preview ??
                (chat.lastMessage?.hasMedia ? "Attachment" : "No messages yet")}
            </p>
          )}
        </div>
        {chat.lastMessage && (
          <span className="shrink-0 text-xs text-grey row-span-full col-start-2 self-center">
            {time}
          </span>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="shrink-0 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-border transition-opacity text-grey hover:text-red"
        aria-label="Delete chat"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </Link>
  );
};
