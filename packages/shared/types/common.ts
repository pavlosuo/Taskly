export type PolicyData = {
  policyContent: string;
  policyTitle: string;
  updatedAt?: Date;
};

export type ZodErrors<T> = {
  [K in keyof T]?: string;
} & {
  general?: string;
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
