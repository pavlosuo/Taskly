"use client";
import { TaskStatus } from "shared/types";
import clsx from "clsx";

export const TaskStatusBadge = ({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) => {
  return (
    <span
      className={clsx(
        "rounded-full px-2.5 py-1 text-[11px] font-medium",
        className,
        {
          "bg-primary/10 text-primary": status === "open",
          "bg-amber-500/10 text-amber-600": status === "assigned",
          "bg-emerald-500/10 text-emerald-600": status === "completed",
          "bg-grey/10 text-grey": status === "cancelled",
        },
      )}
    >
      {status}
    </span>
  );
};
