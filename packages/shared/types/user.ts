import { ObjectId } from "mongodb";
import { OtpPurpose, OtpRecord } from "./otp";

export type Role = "tasker" | "client";

export type Lang = "en" | "fi" | "sv";

export type Theme = "light" | "dark";

export type Payout = {
  iban: string;
  bankName: string;
};

export type BankItem = { value: string; label: string; src: string };

export interface UserProfile {
  fullName: string;
  phone: string;
  code: string;
  fullPhone: string;
  avatar: string;
  newPhone?: string;
  newFullPhone?: string;
  newCode?: string;
}

export interface UserAcceptance {
  phoneVerified: boolean;
  emailVerified: boolean;
  personVerified: boolean;
  agreementAccepted: boolean;
}

export interface UserSettings {
  lang: Lang;
  theme: Theme;
}

export interface User {
  _id: ObjectId;
  passwordHash: string;
  username: string;
  email: string;
  newEmail?: string;
  role: "admin" | Role;
  createdAt: Date;
  acceptance: UserAcceptance;
  otps?: Partial<Record<OtpPurpose, OtpRecord>>;
  payout: Payout;
  profile: UserProfile;
  settings: UserSettings;
}

export type PublicUser = Omit<User, "passwordHash" | "otps">;
