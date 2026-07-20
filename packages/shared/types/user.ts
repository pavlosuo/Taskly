import { ObjectId } from "mongodb";
import { OtpPurpose, OtpRecord } from "./otp";

export type Role = "tasker" | "client";

export type Lang = "en" | "fi" | "sv";

export type Theme = "light" | "dark";

export type publicProfileLang = {
  value: string;
  label: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  certificate?: {
    src: string;
    label: string;
  };
};

export type publicProfileSkill = {
  value: string;
  label: string;
  description?: string;
};

export type publicProfileCertificate = {
  value: string;
  label: string;
  src: string;
  description?: string;
};

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

export interface PublicProfile {
  bio?: string;
  skills?: publicProfileSkill[];
  certificates?: publicProfileCertificate[];
  languages?: publicProfileLang[];
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
  notifications: {
    email?: boolean;
  };
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
  publicProfile: PublicProfile;
}

export type PublicUser = Omit<User, "passwordHash" | "otps">;
