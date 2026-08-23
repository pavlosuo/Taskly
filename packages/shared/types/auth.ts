import {
  PublicUser,
  Role,
  Payout,
  UserSettings,
  PublicProfile,
  MediaItem,
} from "@shared/types";

export type LoginForm = {
  email: string;
  password: string;
};

export type RegisterForm = {
  email: string;
  password: string;
  confirm: string;
  username: string;
  fullName: string;
  phone: string;
  role: Role | "";
  code: string;
  fullPhone: string;
};

export interface AuthResponse {
  success: boolean;
  message: string;
  user: PublicUser;
}

export type UpdateProfileForm = Partial<{
  fullName: string;
  username: string;
  phone: string;
  email: string;
  payout: Payout;
  fullPhone: string;
  code: string;
  avatar: MediaItem | undefined | null;
  settings: Partial<UserSettings>;
  publicProfile: Partial<PublicProfile>;
}>;
