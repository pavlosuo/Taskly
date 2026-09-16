"use client";
import { FC, useState, useRef, useEffect } from "react";
import clsx from "clsx";
import {
  Check,
  CheckCheck,
  Pencil,
  Copy,
  Trash2,
  SmilePlus,
} from "lucide-react";
import { Message as MessageType } from "@shared/types";
import { useUser } from "@/providers/UserProvider";
import { axiosApi } from "api/index";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ImageDisplay } from "@/shared/components/MediaPicker";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EMOJI } from "@shared/data";
import { useSingleChat } from "@/providers/SingleChatProvider";
import { useLightbox } from "@/providers/LightboxProvider";
import { FileThumbnail } from "@/shared/components/MediaPicker";

const Time: FC<{
  message: MessageType;
  className?: string;
  location?: "message" | "image";
  isOwn?: boolean;
}> = ({ message, className, location = "message", isOwn }) => {
  const { lang } = useTheme();
  const { chat } = useSingleChat();
  const isRead = chat ? message.readBy.includes(chat.member._id) : false;
  const time = new Date(message.createdAt).toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span
      className={clsx(
        className,
        "rounded-full inline-flex gap-1 text-[10px] leading-none whitespace-nowrap",
        isOwn ? "text-white" : "text-foreground",
        location === "image" && "p-1.5 items-center absolute right-2 bottom-2",
        location === "image" && isOwn && "bg-primary",
        location === "image" && !isOwn && "bg-muted",
      )}
    >
      {message.edited && <span className="italic">edited</span>}
      <span>{time}</span>
      {isOwn &&
        (isRead ? (
          <CheckCheck className="w-3 h-3" />
        ) : (
          <Check className="w-3 h-3" />
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
    if (iReacted && otherReacted) return `You and ${member.fullName}`;
    if (iReacted) return "You";
    if (otherReacted) return member.fullName;
    return "";
  };

  return (
    reactionGroups &&
    Object.keys(reactionGroups).length > 0 &&
    !isEditing && (
      <BubbleReactions
        role="img"
        aria-label={`Reactions: ${Object.entries(reactionGroups)
          .map(([emoji, ids]) => `${emoji} (${ids.length})`)
          .join(", ")}`}
        className={clsx(isOwn ? "bg-primary" : "bg-muted")}
      >
        {Object.entries(reactionGroups).map(([emoji, userIds]) => (
          <span
            key={emoji}
            title={reactorLabel(userIds)}
            onClick={() => handleToggleReaction(emoji)}
            className="cursor-pointer select-none inline-flex items-center"
          >
            <span>{emoji}</span>
            {userIds.length > 1 && (
              <span
                className={clsx(
                  "text-[9px] -ml-1",
                  isOwn ? "text-white" : "text-foreground",
                )}
              >
                x{userIds.length}
              </span>
            )}
          </span>
        ))}
      </BubbleReactions>
    )
  );
};

const PopoverReactions: FC<{
  isOwn: boolean;
  handleToggleReaction: (emoji: string) => void;
}> = ({ isOwn, handleToggleReaction }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="absolute -bottom-2.5 left-2 flex items-center justify-center w-6 h-6 rounded-full border border-border bg-background shadow-sm opacity-0 scale-90 transition-all group-hover/bubble:opacity-100 group-hover/bubble:scale-100"
          aria-label="React"
        >
          <SmilePlus className="w-3 h-3 text-foreground" />
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

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  const cancelEdit = () => {
    setDraft(message.text ?? "");
    setIsEditing(false);
  };

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.text) {
      setIsEditing(false);
      return;
    }
    try {
      setIsSaving(true);
      const { data } = await axiosApi.editMessage(chatId, message._id, trimmed);
      onMessageUpdate(data.message);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === "Escape") cancelEdit();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    await axiosApi.deleteMessage(chatId, message._id);
    onMessageDelete(message._id);
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
    if (message.text) navigator.clipboard.writeText(message.text);
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
            "relative max-w-200",
          )}
        >
          <div className="flex gap-1.5">
            {isEditing ? (
              <div className="flex flex-col gap-1 w-full">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={1}
                  className="w-full bg-transparent outline-none resize-none text-sm"
                />
                <div className="flex justify-end gap-3 text-xs">
                  <button
                    onClick={cancelEdit}
                    className="opacity-50 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="font-medium disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap wrap-break-word">
                  {message.text}
                  <span className="invisible inline-flex gap-1 ml-4 text-[10px] align-bottom">
                    {message.edited && <span>edited</span>}
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString(lang, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isOwn && <CheckCheck className="w-3 h-3" />}
                  </span>
                </p>
                <Time
                  message={message}
                  isOwn={isOwn}
                  className="absolute bottom-1.5 right-2.5"
                />
                {message.text && (
                  <PopoverReactions
                    isOwn={isOwn}
                    handleToggleReaction={handleToggleReaction}
                  />
                )}
              </>
            )}
          </div>
        </BubbleContent>
      )}
      <Reactions
        message={message}
        isOwn={isOwn}
        handleToggleReaction={handleToggleReaction}
        isEditing={isEditing}
      />
      {!isEditing && !message.text && (
        <PopoverReactions
          isOwn={isOwn}
          handleToggleReaction={handleToggleReaction}
        />
      )}
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
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </ContextMenuItem>
                  )}
                  {message.text && (
                    <ContextMenuItem onClick={handleCopyText}>
                      <Copy className="w-3.5 h-3.5" />
                      Copy text
                    </ContextMenuItem>
                  )}
                  {isOwn && (
                    <ContextMenuItem
                      onClick={handleDelete}
                      className="text-red focus:text-red hover:bg-red hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-inherit" />
                      Delete
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
