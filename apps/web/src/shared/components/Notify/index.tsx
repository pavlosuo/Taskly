import { useChats } from "@/providers/ChatProvider";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export const Notify = () => {
  const { totalUnread } = useChats();
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative h-10 w-10 rounded-full border-border bg-background shadow-md transition-all hover:scale-105"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {totalUnread > 0 && (
        <span className="absolute text-white text-[8px] flex items-center justify-center -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary">
          {totalUnread > 9 ? "9+" : totalUnread}
        </span>
      )}
    </Button>
  );
};
