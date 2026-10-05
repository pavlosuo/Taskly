import { PublicUser, Role } from "shared/types";

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
  role: Role;
  code: string;
  fullPhone: string;
  agreementAccepted: boolean;
};

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: PublicUser;
}

export interface CommonResponse {
  success: boolean;
  message?: string;
}
