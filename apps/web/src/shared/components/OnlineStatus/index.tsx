"use client";
import { PublicUser, PublicProfileUser } from "@shared/types";
import { useEffect, useMemo, useState } from "react";

export function OnlineStatus({
  user,
}: {
  user: PublicUser | PublicProfileUser;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (user.isOnline) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [user.isOnline]);

  const status = useMemo(() => {
    if (user.isOnline) return { type: "online" as const };
    if (!user.lastSeenAt) return null;

    const diff = now - new Date(user.lastSeenAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    const label =
      minutes < 1
        ? "Just now"
        : minutes < 60
          ? `${minutes}m ago`
          : hours < 24
            ? `${hours}h ago`
            : `${days}d ago`;

    return { type: "offline" as const, label };
  }, [user.isOnline, user.lastSeenAt, now]);

  if (!status) return null;
  if (status.type === "online") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-500">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
        Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-grey">
      <span className="w-2 h-2 rounded-full bg-grey inline-block" />
      {status.label}
    </span>
  );
}