"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { TaskResponseStatus } from "shared/types";
import clsx from "clsx";

export const ResponseStatusBadge = ({
  status,
  className,
}: {
  status: TaskResponseStatus;
  className?: string;
}) => {
  const { t } = useTranslation("tasks");
  return (
    <span
      className={clsx(
        "text-xs font-medium px-2 py-0.5 rounded-full",
        className,
        {
          "bg-amber-500/10 text-amber-600": status === "pending",
          "bg-emerald-500/10 text-emerald-600": status === "accepted",
          "bg-destructive/10 text-destructive": status === "rejected",
          "bg-grey/10 text-grey":
            status === "withdrawn_after_accept" || status === "cancelled",
        },
      )}
    >
      {t(`responseStatus.${status}`)}
    </span>
  );
};
