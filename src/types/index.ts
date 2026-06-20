export type Method = "phone" | "email";

export type Role = "tasker" | "client";

export type Lang = "en" | "fi" | "sv";

export type Theme = "light" | "dark";

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
  role: Role | "";
};

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "admin" | Role;
  createdAt: string;
  profile?: {
    fullName: string;
    phone: string;
    verified: boolean;
    agreementAccepted: boolean;
    avatar?: string;
  };
  settings?: {
    lang: Lang;
    theme: Theme;
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
