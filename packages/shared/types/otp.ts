export type OtpPurpose = "verify-email" | "verify-phone" | "reset-password";

export type OtpChannel = "email" | "phone";

export interface OtpRecord {
  code: string;
  channel: OtpChannel;
  destination: string;
  expiresAt: Date;
}
