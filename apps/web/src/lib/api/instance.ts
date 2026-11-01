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
  ChatWithMember,
  Message,
  SendMessagePayload,
  ChatMemberPreview,
  CommonResponse,
  PublicProfileUser,
  AccessReason,
  Task,
  TaskCreateForm,
  TaskUpdateForm,
  TaskListQuery,
  TaskList,
  TaskResponseItem,
  TaskResponseCreateForm,
  NotificationItem,
  TaskReviews,
  ReviewCreateForm,
  ReviewItem,
  PaymentHistory,
} from "shared/types";
import axios, { AxiosInstance } from "axios";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export function createApi(config?: {
  headers?: Record<string, string>;
}): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    ...config,
  });
}

export const methods = (api: AxiosInstance) => {
  return {
    preferences: (payload: { theme?: Theme; lang?: Lang }) =>
      api.post<{ theme: Theme; lang: Lang }>("/api/preferences", payload),

    me: () =>
      api.get<{
        user: PublicUser;
        settings: { lang: Lang; theme: Theme };
      }>("/api/auth/me"),

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
      api.post<CommonResponse>("/api/auth/password-reset/send-link", { email }),

    verifyPasswordResetToken: (token: string) =>
      api.post<{ success: boolean; reason?: string }>(
        "/api/auth/password-reset/verify-token",
        {
          token,
        },
      ),

    resetPassword: (token: string, password: string) =>
      api.post<CommonResponse>("/api/auth/password-reset/confirm", {
        token,
        password,
      }),

    savePolicyData: (payload: PolicyData) =>
      api.put<CommonResponse>("/api/policy", payload),

    getPolicyData: () => api.get<{ data: PolicyData }>("/api/policy"),

    updateProfile: (payload: UpdateProfileForm) =>
      api.put<AuthResponse>("/api/users", payload),

    getUserForProfilePage: (username: string) =>
      api.get<{ user: PublicProfileUser | null; accessReason?: AccessReason }>(
        `/api/users/by-username/${encodeURIComponent(username)}`,
      ),

    deactivateAccount: () => api.delete<CommonResponse>("/api/users"),

    verifyPhoneOtp: (otp: string) =>
      api.post<AuthResponse>("/api/users/phone/verify-otp", { otp }),

    sendOtp: (purpose: OtpPurpose, data?: { fullPhone?: string }) =>
      api.post<CommonResponse>("/api/otp/send", {
        purpose,
        ...(data ? data : {}),
      }),

    verifyEmailOtp: (otp: string) =>
      api.post<AuthResponse>("/api/users/email/verify-otp", { otp }),

    changePassword: (payload: { oldPassword: string; newPassword: string }) =>
      api.put<CommonResponse>("/api/users/password", {
        ...payload,
      }),

    uploadMedia: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.post<{ media: MediaItem }>("/api/media", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },

    getMedia: () => api.get<{ items: MediaItem[] }>("/api/media"),

    deleteMedia: (id: string) => api.delete(`/api/media/${id}`),

    searchSkills: (q: string) =>
      api.get<{ items: { _id: string; label: string }[] }>(
        `/api/skills?q=${q}`,
      ),

    upsertSkill: (label: string) =>
      api.post<{ _id: string; label: string }>(`/api/skills`, {
        label,
      }),

    searchCertificates: (q: string) =>
      api.get<{
        items: { _id: string; label: string; description?: string }[];
      }>(`/api/certificates?q=${q}`),

    upsertCertificate: (label: string, description?: string) =>
      api.post<{
        _id: string;
        label: string;
        description?: string;
      }>(`/api/certificates`, { label, description }),

    createChat: (memberId: string) =>
      api.post<{ chat: ChatWithMember }>("/api/chats", { memberId }),

    getChats: () => api.get<{ chats: ChatWithMember[] }>("/api/chats"),

    getChat: (id: string) =>
      api.get<{ chat: ChatWithMember }>(`/api/chats/${id}`),

    deleteChat: (id: string) => api.delete(`/api/chats/${id}`),

    getMessages: (chatId: string, before?: string) =>
      api.get<{ items: Message[]; nextCursor: string | null }>(
        `/api/chats/${chatId}/messages`,
        {
          params: before ? { before } : {},
        },
      ),

    sendMessage: (chatId: string, payload: SendMessagePayload) =>
      api.post<{ message: Message }>(`/api/chats/${chatId}/messages`, payload),

    markChatRead: (chatId: string) =>
      api.patch<{ success: boolean }>(`/api/chats/${chatId}/messages/read`),

    searchUsers: (q: string) =>
      api.get<{ items: ChatMemberPreview[] }>("/api/users/search", {
        params: { q },
      }),

    editMessage: (chatId: string, messageId: string, text: string) =>
      api.patch<{ message: Message }>(
        `/api/chats/${chatId}/messages/${messageId}`,
        { text },
      ),

    deleteMessage: (chatId: string, messageId: string) =>
      api.delete<{ success: boolean }>(
        `/api/chats/${chatId}/messages/${messageId}`,
      ),

    manageReaction: (chatId: string, messageId: string, reaction: string) =>
      api.post<{ message: Message }>(
        `/api/chats/${chatId}/messages/${messageId}/react`,
        {
          reaction,
        },
      ),

    createTask: (payload: TaskCreateForm) =>
      api.post<{ task: Task }>("/api/tasks", payload),

    getTasks: (query?: TaskListQuery) =>
      api.get<TaskList>("/api/tasks", { params: query }),

    getTask: (id: string) => api.get<{ task: Task }>(`/api/tasks/${id}`),

    updateTask: (id: string, payload: TaskUpdateForm) =>
      api.patch<CommonResponse>(`/api/tasks/${id}`, payload),

    deleteTask: (id: string) => api.delete<CommonResponse>(`/api/tasks/${id}`),

    cancelTask: (id: string) =>
      api.post<CommonResponse>(`/api/tasks/${id}/cancel`),

    completeTask: (id: string) =>
      api.post<CommonResponse>(`/api/tasks/${id}/complete`),

    createTaskResponse: (taskId: string, payload: TaskResponseCreateForm) =>
      api.post<{ response: TaskResponseItem }>(
        `/api/tasks/${taskId}/responses`,
        payload,
      ),

    getTaskResponses: (taskId: string) =>
      api.get<{ items: TaskResponseItem[] }>(`/api/tasks/${taskId}/responses`),

    acceptTaskResponse: (taskId: string, responseId: string) =>
      api.post<CommonResponse>(
        `/api/tasks/${taskId}/responses/${responseId}/accept`,
      ),

    declineTaskResponse: (taskId: string, responseId: string) =>
      api.post<CommonResponse>(
        `/api/tasks/${taskId}/responses/${responseId}/decline`,
      ),

    withdrawTaskResponse: (taskId: string, responseId: string) =>
      api.delete<CommonResponse>(
        `/api/tasks/${taskId}/responses/${responseId}`,
      ),

    getNotifications: () =>
      api.get<{ items: NotificationItem[]; unreadCount: number }>(
        "/api/notifications",
      ),

    markNotificationRead: (notificationId: string) =>
      api.patch<CommonResponse>(`/api/notifications/${notificationId}/read`),

    markAllNotificationsRead: () =>
      api.patch<CommonResponse>("/api/notifications/read-all"),

    markTaskDone: (id: string) => api.patch(`/api/tasks/${id}/done`),

    abandonTask: (id: string) => api.patch(`/api/tasks/${id}/abandon`),

    getTaskReviews: (taskId: string) =>
      api.get<{ success: boolean } & TaskReviews>(`/api/reviews/${taskId}`),

    createReview: (taskId: string, payload: ReviewCreateForm) =>
      api.post<{ success: boolean; review: ReviewItem }>(
        `/api/reviews/${taskId}`,
        payload,
      ),

    getPayments: () =>
      api.get<{ success: boolean } & PaymentHistory>("/api/payments"),
  };
};
