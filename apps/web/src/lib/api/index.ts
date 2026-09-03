import axios from "axios";
import {
  LoginForm,
  PublicUser,
  AuthResponse,
  PolicyData,
  RegisterForm,
  OtpPurpose,
  UpdateProfileForm,
  MediaItem,
  Theme,
  Lang,
} from "@shared/types";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const axiosApi = {
  preferences: (payload: { theme?: Theme; lang?: Lang }) =>
    api.post<{ theme: Theme; lang: Lang }>("/api/preferences", payload),

  me: () => api.get<{ user: PublicUser }>("/api/auth/me"),

  login: (payload: LoginForm) =>
    api.post<AuthResponse>("/api/auth/login", payload),

  register: (payload: RegisterForm) =>
    api.post<AuthResponse>("/api/auth/register", payload),

  logout: () => api.post("/api/auth/logout"),

  verifyPasswordResetOtp: (fullPhone: string, otp: string) =>
    api.post<{ success: boolean; resetToken: string }>(
      "/api/auth/otp/verify-password-reset",
      { fullPhone, otp },
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

  saveDataPolicy: (payload: PolicyData) =>
    api.put<{ success: boolean; message: string }>("/api/policy", payload),

  updateProfile: (payload: UpdateProfileForm) =>
    api.put<AuthResponse>("/api/profile", payload),

  deactivateAccount: () =>
    api.delete<{ success: boolean; message: string }>("/api/profile"),

  verifyPhoneOtp: (otp: string) =>
    api.post<AuthResponse>("/api/profile/phone/verify-otp", { otp }),

  sendOtp: (purpose: OtpPurpose, data?: { fullPhone?: string }) =>
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

  uploadMedia: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ data: { media: MediaItem } }>("/api/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMedia: () => api.get<{ data: { items: MediaItem[] } }>("/api/media"),

  deleteMedia: (id: string) => api.delete(`/api/media/${id}`),

  searchSkills: (q: string) =>
    api.get<{ data: { items: { _id: string; label: string }[] } }>(
      `/api/skills?q=${q}`,
    ),

  upsertSkill: (label: string) =>
    api.post<{ data: { skill: { _id: string; label: string } } }>(
      `/api/skills`,
      { label },
    ),

  searchCertificates: (q: string) =>
    api.get<{
      data: { items: { _id: string; label: string; description?: string }[] };
    }>(`/api/certificates?q=${q}`),

  upsertCertificate: (label: string, description?: string) =>
    api.post<{
      data: {
        certificate: { _id: string; label: string; description?: string };
      };
    }>(`/api/certificates`, { label, description }),
};
