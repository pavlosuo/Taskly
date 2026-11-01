import { Tag, PublicUser } from "shared/types";

export type TaskStatus =
  | "open"
  | "assigned"
  | "completed"
  | "cancelled"
  | "pending_confirmation"
  | "expired";

export type PaymentState = "held" | "released" | "refunded";

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

export type ReviewItem = {
  _id: string;
  taskId: string;
  authorId: string;
  targetId: string;
  authorRole: "client" | "tasker";
  rating: number;
  comment: string;
  createdAt: Date;
};

export type TaskReviews = {
  mine: ReviewItem | null;
  received: ReviewItem | null;
};

export type PaymentStatus = "held" | "released" | "refunded";

export type PaymentItem = {
  _id: string;
  taskId: string;
  clientId: string;
  taskerId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentHistory = {
  items: PaymentItem[];
  totals: Record<PaymentStatus, number>;
};

export type ResponseStatus =
  "pending" | "accepted" | "rejected" | "withdrawn_after_accept";

export type NotificationType =
  | "response_new"
  | "response_accepted"
  | "response_rejected"
  | "task_done"
  | "task_completed"
  | "task_auto_completed"
  | "task_cancelled"
  | "task_overdue"
  | "task_abandoned"
  | "task_expired"
  | "review_received";

export type NotificationItem = {
  _id: string;
  type: NotificationType;
  taskId: string | null;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
};

export type NotificationList = {
  items: NotificationItem[];
  unreadCount: number;
};

export type ReviewCreateForm = {
  rating: number;
  comment: string;
};

export type TaskerRating = { avg: number; count: number } | null;

export type TaskerStats = {
  rating: TaskerRating;
  completedCount: number;
};

export type Tasker = Pick<PublicUser, "username"> &
  Pick<PublicUser["profile"], "avatar" | "initials"> & {
    publicLink: string | null;
  } & TaskerStats;
