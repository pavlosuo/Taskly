import { Db, ObjectId } from "mongodb";
import { Response, Request, NextFunction } from "express";
import { Transporter } from "nodemailer";
import { OtpPurpose, OtpRecord, MediaItem, PublicUser } from "@shared/types";

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

export interface IServer {
  readonly time: number;
  mailer: Transporter | null;
  getDb(): Promise<Db>;
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

export interface AuthRequest extends Request {
  user: User;
}
