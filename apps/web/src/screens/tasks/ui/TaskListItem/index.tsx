"use client";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { Clock, MapPin, MessageSquare } from "lucide-react";
import { Task } from "shared/types";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useFormatDate } from "@/hooks/useFormatDate";
import { TASK_STATUS_STYLES } from "@/screens/tasks/data/taskStatus";

export const TaskListItem = ({
  task,
  onClick,
}: {
  task: Task;
  onClick?: (task: Task) => void;
}) => {
  const { t } = useTranslation("tasks");
  const deadline = useFormatDate(task.deadline.date, {
    month: "long",
    day: "numeric",
  });
  const visibleSkills = task.skills?.slice(0, 3) ?? [];
  const extraSkillsCount = Math.max(
    0,
    (task.skills?.length ?? 0) - visibleSkills.length,
  );
  const price = useFormatPrice(task?.budget?.amount);
  return (
    <button
      type="button"
      onClick={() => onClick?.(task)}
      className={clsx(
        "group relative w-full overflow-hidden rounded-2xl border border-border bg-card p-5 pl-6 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-y-0 left-0 w-1",
          TASK_STATUS_STYLES[task.status].bar,
        )}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex items-center gap-2">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                TASK_STATUS_STYLES[task.status].chip,
              )}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "size-1.5 rounded-full",
                  TASK_STATUS_STYLES[task.status].dot,
                )}
              />
              {t(`status.${task.status}`)}
            </span>
          </div>
          <h3 className="line-clamp-1 text-base font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
            {task.title}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-base font-semibold tracking-tight text-foreground">
            {task.budget?.amount ? price : t("item.negotiable")}
          </div>
          {task.budget?.amount && (
            <span className="text-xs text-grey">{t("item.budget")}</span>
          )}
        </div>
      </div>
      {task.description && (
        <p className="mt-3 line-clamp-2 max-w-[90%] text-sm leading-5 text-grey">
          {task.description}
        </p>
      )}
      {visibleSkills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill.value}
              className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {skill.label}
            </span>
          ))}
          {extraSkillsCount > 0 && (
            <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs font-medium text-grey">
              +{extraSkillsCount}
            </span>
          )}
        </div>
      )}
      <div className="mt-5 border-t border-border/50 pt-4 text-xs text-grey grid grid-cols-[1fr_max-content_max-content]">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin aria-hidden="true" className="shrink-0 w-3.5 h-3.5" />
          <span className="truncate">{task.location.address}</span>
        </span>
        <span className="flex items-center gap-1.5 ml-4">
          <Clock aria-hidden="true" className="w-3.5 h-3.5" />
          {deadline}
        </span>
        {task.responsesCount > 0 && (
          <span className="ml-4 flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 font-medium text-grey">
            <MessageSquare aria-hidden="true" className="w-3.5 h-3.5" />
            <span aria-hidden="true">{task.responsesCount}</span>
            <span className="sr-only">
              {t("item.responses", { count: task.responsesCount })}
            </span>
          </span>
        )}
      </div>
    </button>
  );
};
