import axios from "axios";
import {
  LoginForm,
  PublicUser,
  AuthResponse,
  Data,
  RegisterForm,
  OtpPurpose,
  UpdateProfileForm,
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

  updateProfile: (payload: UpdateProfileForm) =>
    api.put<AuthResponse>("/api/profile", payload),

  deactivateAccount: () =>
    api.delete<{ success: boolean; message: string }>("/api/profile"),

  verifyPhoneOtp: (otp: string) =>
    api.post<AuthResponse>("/api/profile/phone/verify-otp", { otp }),

  sendOtp: (purpose: OtpPurpose, data?: { phone?: string }) =>
    api.post<{ success: boolean; message: string }>("/api/otp/send", {
      purpose,
      ...(data ? data : {}),
    }),

  verifyEmailOtp: (otp: string) =>
    api.post<{ success: boolean; user: PublicUser }>(
      "/api/profile/email/verify-otp",
      { otp },
    ),

  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    api.put<{ success: boolean; message: string }>("/api/profile/password", {
      ...payload,
    }),
};
