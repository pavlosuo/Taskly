import { TaskStatus } from "shared/index";

type StatusStyle = { bar: string; chip: string; dot: string };

export const TASK_STATUS_STYLES: Record<TaskStatus, StatusStyle> = {
  open: {
    bar: "bg-primary",
    chip: "border-primary/15 bg-primary/8 text-primary",
    dot: "bg-primary",
  },
  assigned: {
    bar: "bg-amber-500",
    chip: "border-amber-500/15 bg-amber-500/8 text-amber-600",
    dot: "bg-amber-500",
  },
  pending_confirmation: {
    bar: "bg-sky-500",
    chip: "border-sky-500/15 bg-sky-500/8 text-sky-600",
    dot: "bg-sky-500",
  },
  completed: {
    bar: "bg-emerald-500",
    chip: "border-emerald-500/15 bg-emerald-500/8 text-emerald-600",
    dot: "bg-emerald-500",
  },
  cancelled: {
    bar: "bg-destructive",
    chip: "border-destructive/15 bg-destructive/8 text-destructive",
    dot: "bg-destructive",
  },
  expired: {
    bar: "bg-muted-foreground/40",
    chip: "border-muted bg-muted text-grey",
    dot: "bg-muted-foreground",
  },
};
