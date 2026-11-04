export type NotificationCategory = "chat" | "task" | "system";

export type NotificationType =
  | "chat_new"
  | "chat_message"
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
  | "review_received"
  | "system_announcement";

export const NOTIFICATION_CATEGORY: Record<
  NotificationType,
  NotificationCategory
> = {
  chat_new: "chat",
  chat_message: "chat",
  response_new: "task",
  response_accepted: "task",
  response_rejected: "task",
  task_done: "task",
  task_completed: "task",
  task_auto_completed: "task",
  task_cancelled: "task",
  task_overdue: "task",
  task_abandoned: "task",
  task_expired: "task",
  review_received: "task",
  system_announcement: "system",
};

export type NotificationActor = {
  _id: string;
  fullName: string;
  initials: string;
  avatar: { url: string } | null;
};

export type NotificationItem = {
  _id: string;
  type: NotificationType;
  category: string;
  taskId: string | null;
  chatId: string | null;
  actor: NotificationActor | null;
  data: Record<string, any>;
  read: boolean;
  createdAt: Date;
};
