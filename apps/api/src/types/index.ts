import { Db, ObjectId, MongoClient } from "mongodb";
import { Response, Request, NextFunction } from "express";
import {
  OtpPurpose,
  OtpRecord,
  MediaItem,
  PublicUser,
  Chat,
  Message,
  ChatLastMessage,
  Task,
  TaskResponse,
  GeoPoint,
  OtpChannel,
  NotificationItem,
  NotificationType,
  NotificationActor,
} from "shared/types";
import { Server as SocketIOServer } from "socket.io";

export type InfoUpload = Partial<Express.Multer.File> & {
  width?: number;
  height?: number;
};

export class UploadError extends Error {
  name = "UploadError";
}

export interface NotificationInputBack {
  userId: ObjectId;
  type: NotificationType;
  taskId?: ObjectId;
  chatId?: ObjectId;
  actor?: NotificationActor;
  data?: Record<string, unknown>;
}

export type NotificationItemBack = Omit<
  NotificationItem,
  "_id" | "taskId" | "chatId" | "userId"
> & {
  _id: ObjectId;
  userId: ObjectId;
  taskId: ObjectId | null;
  chatId: ObjectId | null;
};

export interface SendOtpParams {
  userId: ObjectId;
  purpose: OtpPurpose;
  channel: OtpChannel;
  destination: string;
}

export type ConsumeResult =
  | { ok: true; record: SendOtpParams }
  | { ok: false; status: number; message: string };

export interface User extends Omit<PublicUser, "_id"> {
  _id: ObjectId;
  otps?: Partial<Record<OtpPurpose, OtpRecord>>;
  passwordHash: string;
  tokenVersion?: number;
}

export type MediaItemBack = Omit<MediaItem, "_id" | "ownerId"> & {
  _id: ObjectId;
  ownerId: ObjectId;
};

export interface MediaSource {
  ownerId: ObjectId;
  localPath: string;
  mimeType: string;
}

export interface MediaUpdate {
  key: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  durationSec?: number;
  posterKey?: string;
  final: boolean;
}

export type MediaEmit = (update: MediaUpdate) => Promise<void>;

export type FirstUpdate = Omit<MediaUpdate, "final">;

export interface ChatLastMessageBack extends Omit<ChatLastMessage, "senderId"> {
  senderId: ObjectId;
}

export interface ChatBack extends Omit<
  Chat,
  "_id" | "participants" | "deletedBy" | "lastMessage"
> {
  _id: ObjectId;
  participants: ObjectId[];
  deletedBy: ObjectId[];
  lastMessage: ChatLastMessageBack | null;
  pairKey: string;
}

export interface MessageBack extends Omit<
  Message,
  "_id" | "chatId" | "senderId" | "media" | "readBy" | "reactions"
> {
  _id: ObjectId;
  chatId: ObjectId;
  senderId: ObjectId;
  mediaIds: ObjectId[];
  readBy: ObjectId[];
  reactions: { userId: ObjectId; emoji: string }[];
}

export interface TaskBack extends Omit<
  Task,
  "_id" | "clientId" | "assignedTaskerId"
> {
  _id: ObjectId;
  clientId: ObjectId;
  assignedTaskerId: ObjectId | null;
  geo?: GeoPoint;
}

export interface TaskResponseBack extends Omit<
  TaskResponse,
  "_id" | "taskId" | "clientId" | "taskerId"
> {
  _id: ObjectId;
  taskId: ObjectId;
  clientId: ObjectId;
  taskerId: ObjectId;
}

export interface IServer {
  getIO(): SocketIOServer;
  getDb(): Promise<Db>;
  getClient(): MongoClient;
  sendEmail(args: { to: string; subject: string; text: string }): Promise<void>;
  sendSms(phone: string, text: string): Promise<void>;
  issueToken(res: Response, user: User): string;
  requireAuth(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response>;
  optionalAuth(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response>;
  requireAdmin(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response>;
  requireTasker(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response>;
  requireClient(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response>;
  revokeSessions(userId: ObjectId): Promise<void>;
  setPresenceVisibility(userId: string, hidden: boolean): void;
}
