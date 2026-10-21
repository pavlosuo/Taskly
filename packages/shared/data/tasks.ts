import { TaskStatus, TaskSort, TaskFilters, TasksTab } from "shared/index";

export const TASK_STATUSES: TaskStatus[] = [
  "open",
  "assigned",
  "completed",
  "cancelled",
];

export const TASK_SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1, _id: -1 },
  deadline: { deadline: 1, _id: 1 },
  budget_desc: { "budget.amount": -1, _id: -1 },
  budget_asc: { "budget.amount": 1, _id: 1 },
  distance: { distanceMeters: 1, _id: 1 },
};

export const TASK_DEFAULT_FILTERS: TaskFilters = {
  status: "all",
  sort: "newest",
  minBudget: 0,
  maxBudget: 0,
  onlyNegotiable: false,
  skills: [],
  certificates: [],
  near: null,
  radiusKm: 20,
};

export const TASK_RADIUS_OPTIONS = [5, 10, 20, 50, 100];

export const TASK_SORT_OPTIONS: { value: TaskSort; label: string }[] = [
  { value: "newest", label: "sort.newest" },
  { value: "deadline", label: "sort.deadline" },
  { value: "budget_desc", label: "sort.budget_desc" },
  { value: "budget_asc", label: "sort.budget_asc" },
  { value: "distance", label: "sort.distance" },
];

export const TABS: TasksTab[] = ["all", "my"];

export const TAB_LABELS = {
  all: "general.allTasks",
  my: "general.myTasks",
};
