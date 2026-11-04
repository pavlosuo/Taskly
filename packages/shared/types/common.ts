export type Role = "tasker" | "client";

export type Lang = "en" | "fi-FI" | "sv-FI";

export type Theme = "light" | "dark";

export type PolicyTexts = {
  policyTitle: string;
  policyContent: string;
};

export type PolicyData = {
  translations: Partial<Record<Lang, PolicyTexts>>;
  updatedAt?: Date;
};

export type ZodErrors<T> = {
  [K in keyof T]?: string;
};

export type ServiceResult<T = unknown> = {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
};

export type PasswordStrength = {
  label: string;
  color: string;
  tips: string[];
} | null;

export type AccessReason = "same-account" | "admin" | "public";

export type Tag = {
  value: string;
  label: string;
};

export type ChangePasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};
