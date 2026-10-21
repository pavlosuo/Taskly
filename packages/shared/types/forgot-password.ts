export type Step =
  "entry" | "otp" | "new-password" | "success" | "email-sent" | "token-error";

export type NewPasswordForm = {
  password: string;
  confirm: string;
};

export type TokenErrorType = "expired" | "invalid";
