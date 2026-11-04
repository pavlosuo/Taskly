import { Tag, Tasker } from "shared/types";

export type TaskStatus =
  | "open"
  | "assigned"
  | "completed"
  | "cancelled"
  | "pending_confirmation"
  | "expired";

export type TaskResponseStatus =
  "pending" | "accepted" | "rejected" | "withdrawn_after_accept";

export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface TaskBudget {
  amount?: number;
  negotiable: boolean;
}

export type Deadline = {
  date?: Date;
  time: string;
};

export interface Task {
  _id: string;
  clientId: string;
  title: string;
  description: string;
  skills: Tag[];
  certificates: Tag[];
  budget: TaskBudget;
  location: Location;
  deadline: Deadline;
  status: TaskStatus;
  responsesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deadlineAt?: Date;
  doneAt?: Date;
  autoConfirmAt?: Date;
  completedAt?: Date;
  completionType?: "client" | "auto";
  cancelReason?: "client" | "overdue";
  assignedTaskerId?: string | null;
}

export interface TaskResponse {
  _id: string;
  taskId: string;
  clientId: string;
  taskerId: string;
  message: string;
  price?: number;
  status: TaskResponseStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCreateForm {
  title: string;
  description: string;
  skills: Tag[];
  certificates: Tag[];
  budget: TaskBudget;
  location: Location;
  deadline: Deadline;
}

export interface TaskUpdateForm extends Partial<TaskCreateForm> {}

export interface TaskList {
  allItems: Task[];
  myItems: Task[];
  page: number;
  limit: number;
  total: number;
}

export interface TaskResponseItem {
  _id: string;
  taskId: string;
  clientId: string;
  taskerId: string;
  message: string;
  price: number;
  status: TaskResponseStatus;
  createdAt: Date;
  updatedAt: Date;
  tasker: Tasker;
}

export interface TaskResponseCreateForm {
  message: string;
  price: number;
}

export type TaskSort =
  "newest" | "deadline" | "budget_desc" | "budget_asc" | "distance";

export interface TaskListQuery {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  skill?: string;
  certificate?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  minBudget?: number;
  maxBudget?: number;
  negotiable?: boolean;
  sort?: TaskSort;
  includeMine?: boolean;
}

export type TasksTab = "all" | "my";

export type TaskerStep = "overview" | "respond" | "complete";

export interface StatusOption {
  value: TaskStatusFilter;
  label: string;
  count: number;
}

export type TaskStatusFilter = "all" | TaskStatus;

export interface NearFilter {
  lat: number;
  lng: number;
}

export interface TaskFilters {
  status: TaskStatusFilter;
  sort: TaskSort;
  minBudget: number;
  maxBudget: number;
  onlyNegotiable: boolean;
  skills: Tag[];
  certificates: Tag[];
  near: NearFilter | null;
  radiusKm: number;
}
