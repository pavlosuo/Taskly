"use client";
import { FC, useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Check,
  CheckCheck,
  Pencil,
  Copy,
  Trash2,
  SmilePlus,
} from "lucide-react";
import { Message as MessageType, EMOJI } from "shared/index";
import { useUser } from "@/providers/UserProvider";
import { axiosApi } from "@/api/index";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSingleChat } from "@/providers/SingleChatProvider";
import { useLightbox } from "@/providers/LightboxProvider";
import { FileThumbnail } from "@/components/shared/MediaPicker";
import { useModal } from "@/providers/ModalProvider";
import { getAxiosError } from "@/utils/getAxiosError";
import { useToast } from "@/hooks/useToast";

const formatTime = (value: string | Date, lang: string) =>
  new Date(value).toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
  });

const Time: FC<{
  message: MessageType;
  className?: string;
  location?: "message" | "image";
  isOwn?: boolean;
}> = ({ message, className, location = "message", isOwn }) => {
  const { t } = useTranslation("chats");
  const { lang } = useTheme();
  const { chat } = useSingleChat();
  const isRead = chat ? message.readBy.includes(chat.member._id) : false;
  return (
    <span
      className={clsx(
        className,
        "rounded-full inline-flex gap-1 text-xs leading-none whitespace-nowrap",
        isOwn ? "text-white" : "text-foreground",
        location === "image" && "p-1.5 items-center absolute right-2 bottom-2",
        location === "image" && isOwn && "bg-primary",
        location === "image" && !isOwn && "bg-muted",
      )}
    >
      {message.edited && <span className="italic">{t("message.edited")}</span>}
      <span>{formatTime(message.createdAt, lang)}</span>
      {isOwn &&
        (isRead ? (
          <>
            <CheckCheck aria-hidden="true" className="w-3 h-3" />
            <span className="sr-only">{t("message.read")}</span>
          </>
        ) : (
          <>
            <Check aria-hidden="true" className="w-3 h-3" />
            <span className="sr-only">{t("message.sent")}</span>
          </>
        ))}
    </span>
  );
};

const Reactions: FC<{
  message: MessageType;
  isOwn: boolean;
  isEditing: boolean;
  handleToggleReaction: (emoji: string) => void;
}> = ({ message, isOwn, isEditing, handleToggleReaction }) => {
  const { t } = useTranslation("chats");
  const { user } = useUser();
  const { chat } = useSingleChat();
  const member = chat.member;

  const reactionGroups = message.reactions?.reduce<Record<string, string[]>>(
    (acc, r) => {
      (acc[r.emoji] ??= []).push(r.userId);
      return acc;
    },
    {},
  );

  const reactorLabel = (userIds: string[]) => {
    const iReacted = userIds.includes(user?._id ?? "");
    const otherReacted = userIds.includes(member._id);
    if (iReacted && otherReacted)
      return t("reactions.youAnd", { name: member.fullName });
    if (iReacted) return t("reactions.you");
    if (otherReacted) return member.fullName;
    return "";
  };

  return (
    reactionGroups &&
    Object.keys(reactionGroups).length > 0 &&
    !isEditing && (
      <BubbleReactions
        role="group"
        aria-label={t("reactions.label", {
          list: Object.entries(reactionGroups)
            .map(([emoji, ids]) => `${emoji} (${ids.length})`)
            .join(", "),
        })}
        className={clsx(isOwn ? "bg-primary" : "bg-muted")}
      >
        {Object.entries(reactionGroups).map(([emoji, userIds]) => (
          <button
            key={emoji}
            type="button"
            title={reactorLabel(userIds)}
            aria-pressed={userIds.includes(user?._id ?? "")}
            onClick={() => handleToggleReaction(emoji)}
            className="cursor-pointer select-none inline-flex items-center px-1"
          >
            <span>{emoji}</span>
            {userIds.length > 1 && (
              <span
                className={clsx(
                  "text-[9px] -ml-0.5",
                  isOwn ? "text-white" : "text-foreground",
                )}
              >
                x{userIds.length}
              </span>
            )}
          </button>
        ))}
      </BubbleReactions>
    )
  );
};

const PopoverReactions: FC<{
  isOwn: boolean;
  handleToggleReaction: (emoji: string) => void;
}> = ({ isOwn, handleToggleReaction }) => {
  const { t } = useTranslation("chats");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="absolute top-full -translate-y-1/2 left-2 flex items-center justify-center w-6 h-6 rounded-full border border-border bg-background opacity-0 transition-opacity group-hover/bubble:opacity-100 focus-visible:opacity-100"
          aria-label={t("reactions.add")}
        >
          <SmilePlus aria-hidden="true" className="w-3 h-3 text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align={isOwn ? "end" : "start"}
        className="w-auto p-1 flex gap-0.5"
      >
        {EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleToggleReaction(emoji)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-base"
          >
            {emoji}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export const MessageBubble: FC<{
  message: MessageType;
}> = ({ message }) => {
  const { t } = useTranslation(["chats", "common"]);
  const { user } = useUser();
  const { chat, onMessageUpdate, onMessageDelete } = useSingleChat();
  const member = chat.member;
  const chatId = chat._id;
  const isOwn = message.senderId === user?._id;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.text ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const myReaction = message.reactions?.find(
    (r) => r.userId === user?._id,
  )?.emoji;
  const imageUrl = isOwn ? user?.profile.avatar?.url : member.avatar?.url;
  const { setLightbox } = useLightbox();
  const { lang } = useTheme();
  const { confirm } = useModal();
  const toast = useToast();

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  const cancelEdit = () => {
    setDraft(message.text ?? "");
    setIsEditing(false);
  };

  const saveEdit = async () => {
    if (isSaving) return;
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.text) {
      cancelEdit();
      return;
    }
    try {
      setIsSaving(true);
      const { data } = await axiosApi.editMessage(chatId, message._id, trimmed);
      onMessageUpdate(data.message);
      setDraft(data.message.text || "");
      setIsEditing(false);
    } catch (e) {
      toast(getAxiosError(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") cancelEdit();
  };

  const handleDelete = async () => {
    const confirmed = await confirm(t("message.deleteConfirm"));
    if (!confirmed) return;
    try {
      await axiosApi.deleteMessage(chatId, message._id);
      onMessageDelete(message._id);
    } catch (e) {
      toast(getAxiosError(e));
    }
  };

  const handleToggleReaction = async (emoji: string) => {
    if (!user || !message.reactions) return;
    const optimistic: MessageType = {
      ...message,
      reactions:
        myReaction === emoji
          ? message.reactions?.filter((r) => r.userId !== user._id)
          : [
              ...message.reactions?.filter((r) => r.userId !== user._id),
              { userId: user._id, emoji },
            ],
    };
    onMessageUpdate(optimistic);
    try {
      const { data } = await axiosApi.manageReaction(
        chatId,
        message._id,
        emoji,
      );
      onMessageUpdate(data.message);
    } catch {
      onMessageUpdate(message);
    }
  };

  const handleCopyText = () => {
    if (!message.text) return;
    navigator.clipboard.writeText(message.text).catch(() => {});
  };

  const bubbleInner = (
    <Bubble
      variant={isOwn ? "default" : "secondary"}
      className="relative items-end"
    >
      {message.media.length > 0 && (
        <div
          className={clsx(
            "grid gap-2 max-w-100 w-full",
            message.media.length > 1
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1",
          )}
        >
          {message.media.map((m, i) => (
            <div
              key={`${message._id}-${m.url}`}
              className="aspect-square max-w-48 w-[50vw]"
            >
              <FileThumbnail
                item={m}
                onClick={() => setLightbox({ items: message.media, index: i })}
              />
            </div>
          ))}
          {!message.text && !isEditing && (
            <Time message={message} location="image" isOwn={isOwn} />
          )}
        </div>
      )}
      {(message.text || isEditing) && (
        <BubbleContent
          className={clsx(
            !isOwn ? "bg-muted" : "bg-primary",
            "relative max-w-100",
            isEditing && "min-w-50",
          )}
        >
          <div className="flex gap-1.5 relative">
            {isEditing && (
              <div className="absolute inset-0 w-full h-full bg-primary z-1">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                  }}
                  onKeyDown={handleEditKeyDown}
                  aria-label={t("message.editLabel")}
                  className="bg-transparent outline-none resize-none text-sm w-full h-full whitespace-pre-wrap wrap-anywhere"
                  name={message._id}
                  id={message._id}
                />
                <div className="flex h-5 justify-end gap-3 text-xs absolute bottom-0 right-0 left-0 pointer-events-none">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="opacity-50 hover:opacity-100 pointer-events-auto"
                  >
                    {t("common:actions.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="font-medium disabled:opacity-50 pointer-events-auto"
                  >
                    {t("common:actions.save")}
                  </button>
                </div>
              </div>
            )}
            <p className="text-sm whitespace-pre-wrap wrap-anywhere">
              {isEditing ? draft : message.text}
              <span
                className={clsx(
                  "invisible inline-flex gap-1 text-xs align-bottom",
                  isEditing ? "ml-14" : "ml-4",
                )}
              >
                {message.edited && <span>{t("message.edited")}</span>}
                <span>{formatTime(message.createdAt, lang)}</span>
                {isOwn && <CheckCheck aria-hidden="true" className="w-3 h-3" />}
              </span>
            </p>
          </div>
          {!isEditing && (
            <Time
              message={message}
              isOwn={isOwn}
              className="absolute bottom-1.5 right-2.5"
            />
          )}
        </BubbleContent>
      )}
      <Reactions
        message={message}
        isOwn={isOwn}
        handleToggleReaction={handleToggleReaction}
        isEditing={isEditing}
      />
      <PopoverReactions
        isOwn={isOwn}
        handleToggleReaction={handleToggleReaction}
      />
    </Bubble>
  );

  return (
    <>
      <Message className="w-full py-3" align={isOwn ? "end" : "start"}>
        <div className="relative w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-sm font-semibold">
          {imageUrl ? (
            <ImageDisplay
              src={imageUrl}
              alt={isOwn ? user?.profile.fullName : member.fullName}
              width={36}
              height={36}
              className="rounded-full object-cover w-full h-full"
            />
          ) : isOwn ? (
            user?.profile.initials
          ) : (
            member.initials
          )}
        </div>
        <MessageContent>
          <div
            className={clsx(
              "group/bubble relative flex",
              isOwn ? "justify-end" : "justify-start",
            )}
          >
            {isEditing || !(isOwn || !!message.text) ? (
              bubbleInner
            ) : (
              <ContextMenu>
                <ContextMenuTrigger asChild>{bubbleInner}</ContextMenuTrigger>
                <ContextMenuContent className="w-40">
                  {isOwn && message.text && (
                    <ContextMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil aria-hidden="true" className="w-3.5 h-3.5" />
                      {t("message.actions.edit")}
                    </ContextMenuItem>
                  )}
                  {message.text && (
                    <ContextMenuItem onClick={handleCopyText}>
                      <Copy aria-hidden="true" className="w-3.5 h-3.5" />
                      {t("message.actions.copy")}
                    </ContextMenuItem>
                  )}
                  {isOwn && (
                    <ContextMenuItem
                      onClick={handleDelete}
                      variant="destructive"
                      className="text-destructive focus:text-destructive hover:bg-destructive hover:text-white"
                    >
                      <Trash2
                        aria-hidden="true"
                        className="w-3.5 h-3.5 text-[currentColor]"
                      />
                      {t("message.actions.delete")}
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            )}
          </div>
        </MessageContent>
      </Message>
    </>
  );
};
