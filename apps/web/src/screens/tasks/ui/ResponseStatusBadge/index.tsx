"use client";
import { TaskResponseStatus } from "@shared/types";
import clsx from "clsx";

export const ResponseStatusBadge = ({
  status,
  className,
}: {
  status: TaskResponseStatus;
  className?: string;
}) => {
  const LABEL: Record<TaskResponseStatus, string> = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };
  return (
    <span
      className={clsx(
        "text-[11px] font-medium px-2 py-0.5 rounded-full",
        className,
        {
          "bg-amber-500/10 text-amber-600": status === "pending",
          "bg-emerald-500/10 text-emerald-600": status === "accepted",
          "bg-red/10 text-red": status === "rejected",
          "bg-grey/10 text-grey": status === "withdrawn",
        },
      )}
    >
      {LABEL[status]}
    </span>
  );
};
