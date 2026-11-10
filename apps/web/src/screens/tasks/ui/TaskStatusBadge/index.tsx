"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { TaskStatus } from "shared/types";
import clsx from "clsx";
import { TASK_STATUS_STYLES } from "@/screens/tasks/data/taskStatus";

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
        TASK_STATUS_STYLES[status].chip,
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
};
