import { Tag } from "shared/types";

export type TaskStatus = "open" | "assigned" | "completed" | "cancelled";

export type TaskResponseStatus =
  "pending" | "accepted" | "rejected" | "withdrawn";

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface TaskBudget {
  amount?: number;
  negotiable: boolean;
}

export interface Task {
  _id: string;
  clientId: string;
  title: string;
  description: string;
  skills: Tag[];
  certificates: Tag[];
  budget: TaskBudget;
  location: Location;
  deadline: Date;
  status: TaskStatus;
  assignedTaskerId: string | null;
  responsesCount: number;
  createdAt: Date;
  updatedAt: Date;
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
  deadline?: Date;
}

export type TaskUpdateForm = Partial<TaskCreateForm>;

//////

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
}

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
}

export interface TaskResponseCreateForm {
  message: string;
  price: number;
}
