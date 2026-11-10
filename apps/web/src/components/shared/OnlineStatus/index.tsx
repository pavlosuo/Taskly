"use client";
import { PublicUser, PublicProfileUser, ChatMemberPreview } from "shared/types";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePresence } from "@/providers/PresenceProvider";

export function OnlineStatus({
  user,
  variant = "default",
}: {
  user: PublicUser | PublicProfileUser | ChatMemberPreview;
  variant?: "default" | "compact";
}) {
  const { t } = useTranslation("common");
  const [now, setNow] = useState(() => Date.now());
  const { onlineUserIds } = usePresence();
  const liveOnline = onlineUserIds.has(user._id);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const status = useMemo(() => {
    if (liveOnline)
      return { type: "online" as const, label: t("status.online") };
    if (!user.lastSeenAt) return null;
    const diff = now - new Date(user.lastSeenAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1)
      return { type: "online" as const, label: t("status.online") };
    const label =
      minutes < 60
        ? t("status.minutesAgo", { count: minutes })
        : hours < 24
          ? t("status.hoursAgo", { count: hours })
          : t("status.daysAgo", { count: days });
    return { type: "offline" as const, label };
  }, [liveOnline, user.lastSeenAt, now, t]);

  if (!status) return null;

  if (status.type === "online") {
    return variant === "default" ? (
      <span className="inline-flex items-center gap-1 text-xs text-green-500">
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-green-500 inline-block"
        />
        {status.label}
      </span>
    ) : (
      <span
        role="img"
        aria-label={status.label}
        className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-green-500"
      />
    );
  }

  return variant === "default" ? (
    <span className="inline-flex items-center gap-1 text-xs text-grey">
      <span
        aria-hidden="true"
        className="w-2 h-2 rounded-full bg-grey inline-block"
      />
      {status.label}
    </span>
  ) : (
    <span
      role="img"
      aria-label={t("status.lastSeen", { time: status.label })}
      className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-grey opacity-50"
    />
  );
}
