"use client";
import { useTranslation } from "react-i18next";
import { TaskStatus } from "shared/types";
import clsx from "clsx";

export const TaskStatusBadge = ({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) => {
  const { t } = useTranslation("tasks");
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        className,
        {
          "bg-primary/10 text-primary": status === "open",
          "bg-amber-500/10 text-amber-600": status === "assigned",
          "bg-emerald-500/10 text-emerald-600": status === "completed",
          "bg-grey/10 text-grey": status === "cancelled",
        },
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
};
