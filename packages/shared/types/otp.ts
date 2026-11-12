export type OtpPurpose = "verify-email" | "verify-phone" | "reset-password";

export type OtpChannel = "email" | "phone";

export interface OtpRecord {
  codeHash: string;
  channel: OtpChannel;
  destination: string;
  expiresAt: Date;
  sentAt: Date;
  attempts: number;
}
