"use client";
import { FC, useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { Trash2, Paperclip } from "lucide-react";
import { ChatWithMember } from "shared/types";
import { useChats } from "@/providers/ChatProvider";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { useModal } from "@/providers/ModalProvider";
import { OnlineStatus } from "@/components/shared/OnlineStatus";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { useTheme } from "@/providers/ThemeProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { formatListTime } from "@/utils/formatListTime";
import Link from "next/link";
import clsx from "clsx";

export const ChatListItem: FC<{ chat: ChatWithMember }> = ({ chat }) => {
  const { t } = useTranslation(["chats", "errors"]);
  const { deleteChat, typingByChat } = useChats();
  const [isDeleting, setIsDeleting] = useState(false);
  const { confirm } = useModal();
  const { lang } = useTheme();
  const isTyping = typingByChat[chat._id] ?? false;
  const { lastMessage } = chat;
  const time = lastMessage ? formatListTime(lastMessage.createdAt, lang) : null;
  const preview =
    lastMessage?.text ||
    (lastMessage?.hasMedia ? t("list.attachment") : t("list.noMessages"));

  const handleDelete = async () => {
    const confirmed = await confirm(
      t("list.deleteConfirm", { name: chat.member.fullName }),
    );
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      await deleteChat(chat._id);
    } catch (err) {
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative">
      <Link
        href={`/chats/${chat._id}`}
        className="flex items-center gap-3 py-4 pl-4 pr-14 hover:bg-muted transition-colors"
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
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 px-1 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
              <span aria-hidden="true">
                {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
              </span>
              <span className="sr-only">
                {t("list.unread", { count: chat.unreadCount })}
              </span>
            </span>
          )}
          <OnlineStatus user={chat.member} variant="compact" />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-[1fr_max-content] grid-rows-2 gap-0.5">
          <span
            className={clsx(
              "truncate text-sm max-w-20 xs:max-w-50",
              chat.unreadCount > 0
                ? "font-semibold text-foreground"
                : "font-medium text-foreground",
            )}
          >
            {chat.member.fullName}
          </span>
          <div className="flex items-center gap-1">
            {lastMessage?.hasMedia && (
              <Paperclip
                aria-hidden="true"
                className="w-3.5 h-3.5 text-grey shrink-0"
              />
            )}
            {isTyping ? (
              <Marker role="status" className="h-4 flex items-center">
                <MarkerContent className="shimmer">
                  <Trans
                    i18nKey="typing"
                    ns="chats"
                    values={{ name: chat.member.fullName }}
                    components={{
                      bold: (
                        <span className="truncate text-xs text-foreground" />
                      ),
                    }}
                  />
                </MarkerContent>
              </Marker>
            ) : (
              <p className="max-w-20 xs:max-w-50 truncate text-xs text-foreground">
                {preview}
              </p>
            )}
          </div>
          {time && (
            <span className="shrink-0 text-xs text-grey row-span-full col-start-2 self-center">
              {time}
            </span>
          )}
        </div>
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 hover:bg-border transition-opacity text-grey hover:text-destructive"
        aria-label={t("list.deleteChat")}
      >
        <Trash2 aria-hidden="true" className="w-4 h-4" />
      </button>
    </div>
  );
};
