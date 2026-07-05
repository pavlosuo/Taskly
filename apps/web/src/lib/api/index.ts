import axios from "axios";
import {
  LoginForm,
  PublicUser,
  AuthResponse,
  Data,
  RegisterForm,
  OtpPurpose,
} from "@shared/types";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const axiosApi = {
  me: () => api.get<{ user: PublicUser }>("/api/auth/me"),

  login: (payload: LoginForm) =>
    api.post<AuthResponse>("/api/auth/login", payload),

  register: (payload: RegisterForm) =>
    api.post<AuthResponse>("/api/auth/register", payload),

  logout: () => api.post("/api/auth/logout"),

  sendOtp: (purpose: OtpPurpose, phone?: string) =>
    api.post<{ success: boolean; message: string }>("/api/otp/send", {
      purpose,
      ...(phone ? { phone } : {}),
    }),

  verifyEmailOtp: (otp: string) =>
    api.post<{ success: boolean; user: PublicUser }>(
      "/api/auth/otp/verify-email",
      { otp },
    ),

  verifyPasswordResetOtp: (phone: string, otp: string) =>
    api.post<{ success: boolean; resetToken: string }>(
      "/api/auth/otp/verify-password-reset",
      { phone, otp },
    ),

  sendPasswordResetLink: (email: string) =>
    api.post<{ success: boolean; message: string }>(
      "/api/auth/password-reset/send-link",
      { email },
    ),

  verifyPasswordResetToken: (token: string) =>
    api.post<{ success: boolean }>("/api/auth/password-reset/verify-token", {
      token,
    }),

  resetPassword: (token: string, password: string) =>
    api.post<{ success: boolean; message: string }>(
      "/api/auth/password-reset/confirm",
      { token, password },
    ),

  saveDataPolicy: (payload: Data) =>
    api.put<{ success: boolean; message: string }>("/api/policy", payload),

  updateProfile: (
    payload: Partial<{ fullName: string; username: string; phone: string }>,
  ) => api.put<AuthResponse>("/api/profile", payload),

  requestEmailChange: (newEmail: string) =>
    api.post<{ success: boolean; message: string }>(
      "/api/profile/email/request",
      { newEmail },
    ),

  confirmEmailChange: (token: string) =>
    api.post<AuthResponse>("/api/profile/email/confirm", { token }),

  deactivateAccount: () =>
    api.delete<{ success: boolean; message: string }>("/api/profile"),

  verifyPhoneOtp: (otp: string) =>
    api.post<AuthResponse>("/api/profile/phone/verify-otp", { otp }),
};
