/* eslint-disable @typescript-eslint/no-explicit-any */
import { Db, ObjectId } from "mongodb";
import { Response, Request } from "express";
import nodemailer from "nodemailer";

export type Method = "phone" | "email";

export type Role = "tasker" | "client";

export type Lang = "en" | "fi" | "sv";

export type Theme = "light" | "dark";

export type Payout = {
  iban: string;
  bankName: string;
};

export type UpdateProfileForm = Partial<{
  fullName: string;
  username: string;
  phone: string;
  email: string;
  payout: Payout;
}>;

export type BankItem = { value: string; label: string; src: string };

export interface User {
  _id: ObjectId;
  passwordHash: string;
  username: string;
  email: string;
  role: "admin" | Role;
  createdAt: Date;
  acceptance: {
    phoneVerified: boolean;
    emailVerified: boolean;
    personVerified: boolean;
    agreementAccepted: boolean;
  };
  otps?: Partial<Record<OtpPurpose, OtpRecord>>;
  payout: Payout;
  profile: {
    fullName: string;
    phone: string;
    code: string;
    fullPhone: string;
    avatar: string;
  };
  settings: {
    lang: Lang;
    theme: Theme;
  };
}

export type PublicUser = Omit<User, "passwordHash" | "otp" | "phoneOtp">;

export interface IServer {
  time: number;
  getDb(): Promise<Db>;
  getTransporter(): nodemailer.Transporter;
  issueToken(res: Response, user: User): string;
  requireAuth(): (req: Request, res: Response, next: any) => void;
  requireAdmin(): (req: Request, res: Response, next: any) => void;
  getUserPublic(id: ObjectId): Promise<PublicUser | null>;
}

export type Step =
  "entry" | "otp" | "new-password" | "success" | "email-sent" | "token-error";

export type NewPasswordForm = {
  password: string;
  confirm: string;
};

export type LoginForm = {
  email: string;
  password: string;
};

export type NewPasswordErrors = {
  password?: string;
  confirm?: string;
  general?: string;
};

export interface ForgotPasswordContextValue {
  step: Step;
  method: Method;
  phone: string;
  resetToken: string;
  tokenError: { title: string; message: string };
  setStep: (step: Step) => void;
  setMethod: (method: Method) => void;
  setPhone: (phone: string) => void;
  setResetToken: (token: string) => void;
  goToEntry: (m?: Method) => void;
}

export type RegisterForm = {
  email: string;
  password: string;
  confirm: string;
  username: string;
  fullName: string;
  phone: string;
  role: Role | "";
  code: string;
  fullPhone: string;
};

export interface AuthResponse {
  success: boolean;
  message: string;
  user: PublicUser;
}

export type Data = {
  policyContent: string;
  policyTitle: string;
};

export type ZodErrors<T> = {
  [K in keyof T]?: string;
} & {
  general?: string;
};

export interface AuthRequest extends Request {
  user: User;
}

export type OtpPurpose =
  "verify-email" | "verify-phone" | "reset-password" | "verify-phone";

export type OtpChannel = "email" | "phone";

export interface OtpRecord {
  code: string;
  channel: OtpChannel;
  destination: string;
  expiresAt: Date;
}

export type ServiceResult<T = any> = {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
};
