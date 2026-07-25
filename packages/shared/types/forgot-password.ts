export type Step =
  "entry" | "otp" | "new-password" | "success" | "email-sent" | "token-error";

export type NewPasswordForm = {
  password: string;
  confirm: string;
};

export type NewPasswordErrors = {
  password?: string;
  confirm?: string;
  general?: string;
};
