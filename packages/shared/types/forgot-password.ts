import { OtpChannel } from "./otp";

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

export interface ForgotPasswordContextValue {
  step: Step;
  method: OtpChannel;
  phone: string;
  resetToken: string;
  tokenError: { title: string; message: string };
  setStep: (step: Step) => void;
  setMethod: (method: OtpChannel) => void;
  setPhone: (phone: string) => void;
  setResetToken: (token: string) => void;
  goToEntry: (m?: OtpChannel) => void;
}
