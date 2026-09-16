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
} from "@shared/types";
import { Server as SocketIOServer } from "socket.io";

export interface User extends Omit<PublicUser, "_id" | "createdAt"> {
  _id: ObjectId;
  createdAt: Date;
  otps?: Partial<Record<OtpPurpose, OtpRecord>>;
  passwordHash: string;
}

export interface MediaItemBack extends Omit<MediaItem, "_id" | "ownerId"> {
  _id: ObjectId;
  ownerId: ObjectId;
}

export interface ChatLastMessageBack extends Omit<
  ChatLastMessage,
  "senderId" | "createdAt"
> {
  createdAt: Date;
  senderId: ObjectId;
}

export interface ChatBack extends Omit<
  Chat,
  | "_id"
  | "participants"
  | "deletedBy"
  | "createdAt"
  | "updatedAt"
  | "lastMessage"
> {
  _id: ObjectId;
  participants: ObjectId[];
  deletedBy: ObjectId[];
  lastMessage: ChatLastMessageBack | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageBack extends Omit<
  Message,
  | "_id"
  | "chatId"
  | "senderId"
  | "media"
  | "readBy"
  | "reactions"
  | "createdAt"
  | "updatedAt"
> {
  _id: ObjectId;
  chatId: ObjectId;
  senderId: ObjectId;
  mediaIds: ObjectId[];
  readBy: ObjectId[];
  reactions: { userId: ObjectId; emoji: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IServer {
  readonly time: number;
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
