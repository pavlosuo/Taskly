import { useChats } from "@/providers/ChatProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, MessageCircle } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import Link from "next/link";
import { ImageDisplay } from "@/components/shared/MediaPicker";

export const Notify = () => {
  const { totalUnread, chats } = useChats();
  const now = new Date();
  const { lang } = useTheme();

  const unreadChats = chats
    .filter((chat) => chat.unreadCount > 0)
    .map((c) => {
      const date = new Date(c?.lastMessage?.createdAt || "");
      const sameDay = date.toDateString() === now.toDateString();
      const time = sameDay
        ? date.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString(lang, { month: "short", day: "numeric" });
      return {
        id: c._id,
        type: "message",
        title: `New message in chat`,
        description: c.lastMessage?.text,
        time: time,
        url: `/chats/${c._id}`,
        chat: c,
      };
    });

  const notifications = [...unreadChats];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-10 w-10 rounded-full border-border bg-background"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[12px] text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 py-3">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const content = (
                <>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    {notification.type === "message" ? (
                      notification.chat.member.avatar ? (
                        <ImageDisplay
                          src={notification.chat.member.avatar.url}
                          alt={notification.chat.member.fullName}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {notification.chat.member.initials}
                        </div>
                      )
                    ) : (
                      <MessageCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                  </div>
                </>
              );

              return notification.url ? (
                <Link
                  href={notification.url}
                  key={notification.id}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={notification.id}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  {content}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">You have no notifications</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {"When you have notifications, they'll appear here."}
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
