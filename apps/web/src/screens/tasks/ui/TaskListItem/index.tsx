"use client";
import clsx from "clsx";
import { Clock, MapPin, MessageSquare } from "lucide-react";
import { Task, TaskStatus } from "shared/types";
import { formatPrice } from "@/utils/formatPrice";

export const TaskListItem = ({
  task,
  onClick,
}: {
  task: Task;
  onClick?: (task: Task) => void;
}) => {
  const deadline = new Date(task.deadline).toLocaleDateString();
  const visibleSkills = task.skills?.slice(0, 3) ?? [];
  const extraSkillsCount = Math.max(
    0,
    (task.skills?.length ?? 0) - visibleSkills.length,
  );
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
        className={clsx("absolute inset-y-0 left-0 w-1", {
          "bg-primary": task.status === "open",
          "bg-amber-500": task.status === "assigned",
          "bg-emerald-500": task.status === "completed",
          "bg-muted-foreground/40": task.status === "cancelled",
        })}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2.5 flex items-center gap-2">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                {
                  "border-primary/15 bg-primary/8 text-primary":
                    task.status === "open",
                  "border-amber-500/15 bg-amber-500/8 text-amber-600":
                    task.status === "assigned",
                  "border-emerald-500/15 bg-emerald-500/8 text-emerald-600":
                    task.status === "completed",
                  "border-muted bg-muted text-muted-foreground":
                    task.status === "cancelled",
                },
              )}
            >
              <span
                className={clsx("size-1.5 rounded-full", {
                  "bg-primary": task.status === "open",
                  "bg-amber-500": task.status === "assigned",
                  "bg-emerald-500": task.status === "completed",
                  "bg-muted-foreground": task.status === "cancelled",
                })}
              />
              {task.status}
            </span>
          </div>
          <h3 className="line-clamp-1 text-[15px] font-semibold tracking-[-0.01em] text-foreground transition-colors group-hover:text-primary">
            {task.title}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1 text-base font-semibold tracking-tight text-foreground">
            {task.budget?.amount ? (
              <>{formatPrice(task.budget.amount)}</>
            ) : (
              "Negotiable"
            )}
          </div>
          {task.budget?.amount && (
            <span className="text-[11px] text-muted-foreground">
              task budget
            </span>
          )}
        </div>
      </div>
      {task.description && (
        <p className="mt-3 line-clamp-2 max-w-[90%] text-sm leading-5 text-muted-foreground">
          {task.description}
        </p>
      )}
      {visibleSkills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill.value}
              className="rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary"
            >
              {skill.label}
            </span>
          ))}
          {extraSkillsCount > 0 && (
            <span className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              +{extraSkillsCount}
            </span>
          )}
        </div>
      )}
      <div className="mt-5 border-t border-border/50 pt-4 text-xs text-muted-foreground grid grid-cols-[1fr_max-content_max-content]">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="shrink-0 w-3.5 h-3.5" />
          <span className="truncate">{task.location.address}</span>
        </span>
        <span className="flex items-center gap-1.5 ml-4">
          <Clock className="w-3.5 h-3.5" />
          {deadline}
        </span>
        {task.responsesCount > 0 && (
          <span className="ml-4 flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 font-medium text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            {task.responsesCount}
          </span>
        )}
      </div>
    </button>
  );
};
