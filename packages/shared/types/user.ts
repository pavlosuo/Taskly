import { MediaItem } from "@shared/types/media";

export type Role = "tasker" | "client";

export type Lang = "en" | "fi-FI" | "sv-FI";

export type Theme = "light" | "dark";

export type PublicProfileLang = {
  value: string;
  label: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  certificate?: {
    media: MediaItem | undefined | null;
    description?: string;
  };
};

export type PublicProfileSkill = {
  value: string;
  label: string;
  description?: string;
};

export type PublicProfileCertificate = {
  value: string;
  label: string;
  media?: MediaItem | undefined | null;
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
  avatar: MediaItem | undefined | null;
  newPhone?: string;
  newFullPhone?: string;
  newCode?: string;
  initials: string;
}

export interface PublicProfile {
  bio?: string;
  skills?: PublicProfileSkill[];
  certificates?: PublicProfileCertificate[];
  languages?: PublicProfileLang[];
  header?: MediaItem | undefined | null;
  introduction?: MediaItem | undefined | null;
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
  checkboxes: {
    email?: boolean;
    phone?: boolean;
    privateProfile?: boolean;
    noOnlineStatus?: boolean;
  };
}

export interface PublicUser {
  _id: string;
  username: string;
  publicLink: string;
  email: string;
  newEmail?: string;
  role: "admin" | Role;
  createdAt: string;
  acceptance: UserAcceptance;
  payout: Payout;
  profile: UserProfile;
  settings: UserSettings;
  publicProfile: PublicProfile;
  lastSeenAt?: string;
}

export type PublicProfileUser = {
  lastSeenAt: string;
  username: string;
  role: string;
  createdAt: string | Date;
  profile: {
    fullName: string;
    avatar: MediaItem | undefined | null;
    initials: string;
  };
  publicProfile: PublicProfile;
};
