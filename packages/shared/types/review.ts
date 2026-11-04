import { PublicUser } from "shared/types";

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
