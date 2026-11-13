import { useEffect, useState, startTransition } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  ClipboardList,
  Megaphone,
  Star,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";
import clsx from "clsx";
import { ImageDisplay } from "@/components/shared/MediaPicker";
import { formatListTime } from "@/utils/formatListTime";
import { useNotifications } from "@/providers/NotificationProvider";
import { NotificationItem, NotificationType } from "shared/index";
import { useIsMobile } from "@/hooks/useMobile";

const ICONS: Partial<Record<NotificationType, LucideIcon>> = {
  review_received: Star,
  task_completed: Wallet,
  task_auto_completed: Wallet,
  system_announcement: Megaphone,
};

const getUrl = (n: NotificationItem) => {
  if (n.category === "chat" && n.chatId) return `/chats/${n.chatId}`;
  if (n.category === "task") return "/tasks?taskId=" + n.taskId;
  return "/";
};

export const Notify = () => {
  const { t } = useTranslation(["common", "notify", "chats"]);
  const { lang } = useTheme();
  const { items, unreadCount, markRead, markAllRead, remove } =
    useNotifications();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      startTransition(() => {
        setOpen(false);
      });
    }
  }, [isMobile]);

  const getText = (n: NotificationItem) => {
    if (n.type === "chat_new") {
      const fullName =
        n.actor?.fullName === "user.deleted"
          ? t("chats:list.deletedUser")
          : n.actor?.fullName;
      return {
        title: t("notify:types.chat_new.title"),
        description: t("notify:types.chat_new.description", {
          userName: fullName,
        }),
      };
    }
    if (n.type === "chat_message") {
      const preview =
        n.data.preview || (n.data.hasMedia ? t("notify:media") : "");
      const extra = n.data.count > 1 ? ` (+${n.data.count - 1})` : "";
      return {
        title: n.actor?.fullName ?? t("notify:types.chat_message.title"),
        description: `${preview}${extra}`,
      };
    }
    return {
      title: t(`notify:types.${n.type}.title`),
      description: t(`notify:types.${n.type}.description`, {
        ...n.data,
        actor: n.actor?.fullName,
      }),
    };
  };

  const trigger = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative h-10 w-10 rounded-full border-border bg-background"
      aria-label={t("notify.title")}
      onClick={isMobile ? () => setOpen(true) : undefined}
    >
      <Bell className="h-4 w-4" />
      <span
        className={clsx(
          unreadCount ? "scale-100" : "scale-0",
          "transition-all transition-duration-1500 absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white",
        )}
      >
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    </Button>
  );

  const markAllButton = unreadCount > 0 && (
    <button
      type="button"
      onClick={markAllRead}
      className="text-xs font-normal text-primary"
    >
      {t("notify:markAllRead")}
    </button>
  );

  const list = (
    <div
      className={clsx(
        "overflow-y-auto",
        isMobile ? "max-h-[70vh]" : "max-h-96",
      )}
    >
      {items.length > 0 ? (
        items.map((n) => {
          const { title, description } = getText(n);
          const Icon =
            ICONS[n.type] ??
            (n.category === "system" ? Megaphone : ClipboardList);
          return (
            <div key={n._id} className="group relative">
              <Link
                href={getUrl(n)}
                onClick={() => {
                  markRead(n._id);
                  setOpen(false);
                }}
                className={clsx(
                  "flex gap-3 px-4 py-3 pr-9 transition-colors hover:bg-muted/50",
                  !n.read && "bg-primary/5",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  {n.category === "chat" ? (
                    n.actor?.avatar ? (
                      <ImageDisplay
                        src={n.actor.avatar.url}
                        alt={n.actor.fullName}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-primary">
                        {n.actor?.initials}
                      </span>
                    )
                  ) : (
                    <Icon className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <span className="shrink-0 text-xs text-grey">
                      {formatListTime(n.createdAt, lang)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-grey">
                    {description}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                aria-label={t("notify:delete")}
                onClick={() => remove(n._id)}
                className="absolute right-2 top-2 rounded p-1 text-grey transition-opacity hover:text-foreground focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
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
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm p-0 gap-0 overflow-hidden">
            <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-border px-4 py-5 pr-12 text-left">
              <DialogTitle className="text-sm font-medium">
                {t("notify.title")}
              </DialogTitle>
              {markAllButton}
            </DialogHeader>
            {list}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          {t("notify.title")}
          {markAllButton}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
