import { Db, ObjectId } from "mongodb";
import { Response, Request, NextFunction } from "express";
import { Transporter } from "nodemailer";
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
} from "shared/types";
import { Server as SocketIOServer } from "socket.io";

export interface User extends Omit<PublicUser, "_id"> {
  _id: ObjectId;
  otps?: Partial<Record<OtpPurpose, OtpRecord>>;
  passwordHash: string;
}

export interface MediaItemBack extends Omit<MediaItem, "_id" | "ownerId"> {
  _id: ObjectId;
  ownerId: ObjectId;
}

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
  mailer: Transporter | null;
  emitToUser(userId: ObjectId, event: string, payload: unknown): void;
  getIO(): SocketIOServer;
  getDb(): Promise<Db>;
  indexesConfig(): Promise<void>;
  sendEmail(args: { to: string; subject: string; text: string }): Promise<void>;
  sendSms(phone: string, text: string): Promise<void>;
  issueToken(res: Response, user: User): string;
  getUserFromCookie(req: Request): Promise<User | null>;
  requireAuth(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void | Response>;
  optionalAuth(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  requireAdmin(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => void | Response;
}
