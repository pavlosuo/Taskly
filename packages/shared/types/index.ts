/* eslint-disable @typescript-eslint/no-explicit-any */
import { Db } from "mongodb";
import { Response } from "express";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";

export type Method = "phone" | "email";

export type Role = "tasker" | "client";

export type Lang = "en" | "fi" | "sv";

export type Theme = "light" | "dark";

export interface User {
  _id: ObjectId;
  passwordHash: string;
  username: string;
  email: string;
  role: "admin" | Role;
  createdAt: Date;
  acceptance?: {
    phoneVerified: boolean;
    emailVerified: boolean;
    personVerified: boolean;
    agreementAccepted: boolean;
  };
  otp?: {
    code: string;
    expiresAt: Date;
  }
  phoneOtp?: {
    code: string;
    expiresAt: Date;
  }
  payout?: {
    iban: string;
    bankName: string;
  };
  profile?: {
    fullName: string;
    phone: string;
    code: string;
    fullPhone: string;
    avatar?: string;
  };
  settings?: {
    lang: Lang;
    theme: Theme;
  };
}

export interface IServer {
  time: number;
  smsSender: any;
  getDb(): Promise<Db>;
  getTransporter(): nodemailer.Transporter;
  issueToken(res: Response, user: User): string;
}

export type Step =
  | "entry"
  | "otp"
  | "new-password"
  | "success"
  | "email-sent"
  | "token-error";

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
  user: User;
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
