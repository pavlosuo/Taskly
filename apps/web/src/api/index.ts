import axios from "axios";
import {
  LoginForm,
  User,
  AuthResponse,
  Data,
  RegisterForm,
} from "root/apps/api/include/types";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const axiosApi = {
  me: () => api.get<{ user: User }>("/api/auth/me"),

  login: (payload: LoginForm) =>
    api.post<AuthResponse>("/api/auth/login", payload),

  register: (payload: RegisterForm) =>
    api.post<AuthResponse>("/api/auth/register", payload),

  logout: () => api.post("/api/auth/logout"),

  sendResetOtp: (phone: string) =>
    api.post<{ success: boolean; message: string }>(
      "/api/auth/otp/send-reset",
      { phone },
    ),

  verifyResetOtp: (phone: string, otp: string) =>
    api.post<{ success: boolean; resetToken: string }>(
      "/api/auth/otp/verify-reset",
      {
        phone,
        otp,
      },
    ),

  sendOtp: () =>
    api.post<{ success: boolean; message: string }>("/api/auth/otp/send"),

  verifyOtp: (otp: string) =>
    api.post<{ success: boolean; resetToken: string }>("/api/auth/otp/verify", {
      otp,
    }),

  resetPassword: (token: string, password: string) =>
    api.post<{ success: boolean; message: string }>(
      "/api/auth/reset-password",
      { token, password },
    ),

  sendResetEmail: (email: string) =>
    api.post<{ success: boolean; message: string }>("/api/auth/reset-email", {
      email,
    }),

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
    api.post<{ success: boolean; message: string }>(
      "/api/profile/email/confirm",
      { token },
    ),

  deactivateAccount: () =>
    api.delete<{ success: boolean; message: string }>("/api/profile"),

  sendPhoneOtp: () =>
    api.post<{ success: boolean; message: string }>(
      "/api/profile/phone/send-otp",
    ),

  verifyPhoneOtp: (otp: string) =>
    api.post<AuthResponse>("/api/profile/phone/verify-otp", { otp }),
};
