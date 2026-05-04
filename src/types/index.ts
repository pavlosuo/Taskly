export type Method = "phone" | "email";

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

export type RegisterForm = {
  email: string;
  password: string;
  confirm: string;
  username: string;
  fullName: string;
  phone: string;
  HETU: string;
  agreementAccepted: boolean;
};

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "tasker" | "client";
  createdAt: string;
  profile?: {
    fullName: string;
    phone: string;
    HETU: string;
    verified: boolean;
    agreementAccepted: boolean;
  };
  agreement?: {
    pdfKey: string;
    pdfUrl: string;
    acceptedAt: string;
    ip: string;
    userAgent: string;
    agreementAccepted: boolean;
  };
}

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
