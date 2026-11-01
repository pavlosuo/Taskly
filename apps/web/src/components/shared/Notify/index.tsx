import { useTranslation } from "react-i18next";
import { useChats } from "@/providers/ChatProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  ClipboardList,
  Star,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";
import clsx from "clsx";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { formatListTime } from "@/utils/formatListTime";
import { useNotifications } from "@/hooks/useNotifications";
import { ChatWithMember } from "shared/types";
import { NotificationType } from "shared/index";

type NotifyEntry = {
  id: string;
  kind: "message" | "task" | "system";
  title: string;
  description?: string;
  time?: string;
  url: string;
  sortAt: number;
  unread: boolean;
  type?: NotificationType;
  chat?: ChatWithMember;
  data?: unknown;
  onOpen?: () => void;
};

const TASK_ICONS: Partial<Record<NotificationType, LucideIcon>> = {
  review_received: Star,
  task_completed: Wallet,
  task_auto_completed: Wallet,
};

export const Notify = () => {
  const { t } = useTranslation(["common", "notify"]);
  const { totalUnread, chats } = useChats();
  const { lang } = useTheme();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();

  const chatEntries: NotifyEntry[] = chats
    .filter((chat) => chat.unreadCount > 0)
    .map((c) => ({
      id: `chat-${c._id}`,
      kind: "message",
      title: t("notify.newMessage"),
      description: c.lastMessage?.text || "",
      time: formatListTime(c?.lastMessage?.createdAt || "", lang),
      url: `/chats/${c._id}`,
      sortAt: new Date(c?.lastMessage?.createdAt || 0).getTime(),
      unread: true,
      chat: c,
    }));

  const taskEntries: NotifyEntry[] = items.map((n) => ({
    id: `task-${n._id}`,
    kind: "task",
    title: t(`notify:types.${n.type}.title`),
    description: t(`notify:types.${n.type}.description`, n.data) as string,
    time: formatListTime(n.createdAt, lang),
    url: "/tasks",
    sortAt: new Date(n.createdAt).getTime(),
    unread: !n.read,
    type: n.type,
    onOpen: () => markRead(n._id),
  }));

  const entries = [...chatEntries, ...taskEntries].sort(
    (a, b) => b.sortAt - a.sortAt,
  );
  const badge = totalUnread + unreadCount;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-full border-border bg-background"
          aria-label={t("notify.title")}
        >
          <Bell className="h-4 w-4" />
          {badge > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          {t("notify.title")}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-normal text-primary"
            >
              {t("notify:markAllRead")}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {entries.length > 0 ? (
            entries.map((entry) => {
              const TaskIcon =
                (entry.type && TASK_ICONS[entry.type]) || ClipboardList;
              return (
                <Link
                  href={entry.url}
                  key={entry.id}
                  onClick={entry.onOpen}
                  className={clsx(
                    "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                    entry.unread && entry.kind === "task" && "bg-primary/5",
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {entry.kind === "message" ? (
                      entry.chat?.member.avatar ? (
                        <ImageDisplay
                          src={entry.chat.member.avatar.url}
                          alt={entry.chat.member.fullName}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {entry.chat?.member.initials}
                        </div>
                      )
                    ) : (
                      <TaskIcon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{entry.title}</p>
                      <span className="shrink-0 text-xs text-grey">
                        {entry.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-grey">
                      {entry.description}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-grey" />
              <p className="text-sm font-medium">{t("notify.emptyTitle")}</p>
              <p className="mt-1 text-xs text-grey">
                {t("notify.emptyDescription")}
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
