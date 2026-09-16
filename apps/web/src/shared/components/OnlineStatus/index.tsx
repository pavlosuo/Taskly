"use client";
import {
  PublicUser,
  PublicProfileUser,
  ChatMemberPreview,
} from "@shared/types";
import { useEffect, useMemo, useState } from "react";
import { usePresence } from "@/providers/PresenceProvider";

export function OnlineStatus({
  user,
  variant = "default",
}: {
  user: PublicUser | PublicProfileUser | ChatMemberPreview;
  variant?: "default" | "compact";
}) {
  const [now, setNow] = useState(() => Date.now());
  const { isOnline } = usePresence();
  const liveOnline = isOnline(user._id);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [user.lastSeenAt]);
  
  const status = useMemo(() => {
    if (liveOnline) return { type: "online" as const, label: "Online" };
    if (!user.lastSeenAt) return null;
    const diff = now - new Date(user.lastSeenAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return { type: "online" as const, label: "Online" };
    const label =
      minutes < 1
        ? "Just now"
        : minutes < 60
          ? `${minutes}m ago`
          : hours < 24
            ? `${hours}h ago`
            : `${days}d ago`;
    return { type: "offline" as const, label };
  }, [liveOnline, user.lastSeenAt, now]);

  if (!status) return null;

  if (status.type === "online") {
    return variant === "default" ? (
      <span className="inline-flex items-center gap-1 text-xs text-green-500">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        Online
      </span>
    ) : (
      <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-green-500" />
    );
  }

  return variant === "default" ? (
    <span className="inline-flex items-center gap-1 text-xs text-grey">
      <span className="w-2 h-2 rounded-full bg-grey inline-block" />
      {status.label}
    </span>
  ) : (
    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-grey opacity-50" />
  );
}
