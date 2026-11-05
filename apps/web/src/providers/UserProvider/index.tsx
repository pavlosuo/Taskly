"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import {
  PublicUser,
  LoginForm,
  RegisterForm,
  UpdateProfileForm,
  ChangePasswordForm,
} from "shared/types";
import { axiosApi } from "@/api/index";
import { useRouter } from "next/navigation";
import { useRun } from "@/hooks/useRun";

interface UserContextType {
  user: PublicUser | null;
  isLoading: boolean;
  setUser: (user: PublicUser | null) => void;
  login: (payload: LoginForm) => Promise<void>;
  register: (payload: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  sendEmailOtp: () => Promise<void>;
  verifyEmailOtp: (otp: string) => Promise<void>;
  sendPhoneOtp: () => Promise<void>;
  verifyPhoneOtp: (otp: string) => Promise<void>;
  sendPasswordResetOtp: (phone: string) => Promise<void>;
  verifyPasswordResetOtp: (phone: string, otp: string) => Promise<string>;
  sendPasswordResetLink: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (payload: UpdateProfileForm) => Promise<void>;
  deactivateAccount: (password: string) => Promise<void>;
  changePassword: (payload: ChangePasswordForm) => Promise<void>;
}

interface UserProviderProps {
  children: ReactNode;
  initialUser?: PublicUser | null;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({
  children,
  initialUser = null,
}: UserProviderProps) => {
  const [user, setUser] = useState<PublicUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const run = useRun(setIsLoading);

  const login = useCallback(
    (payload: LoginForm) =>
      run(async () => {
        const { data } = await axiosApi.login(payload);
        setUser(data.user);
        router.push("/");
      }),
    [run, router],
  );

  const register = useCallback(
    (payload: RegisterForm) =>
      run(async () => {
        const { data } = await axiosApi.register(payload);
        setUser(data.user);
        router.push("/profile");
      }),
    [run, router],
  );

  const logout = useCallback(
    () =>
      run(async () => {
        await axiosApi.logout();
        setUser(null);
        router.push("/login");
      }),
    [run, router],
  );

  const sendEmailOtp = useCallback(
    () =>
      run(
        async () => {
          await axiosApi.sendOtp("verify-email");
        },
        { success: "common:toast.codeSent" },
      ),
    [run],
  );

  const verifyEmailOtp = useCallback(
    (otp: string) =>
      run(
        async () => {
          const { data } = await axiosApi.verifyEmailOtp(otp);
          if (data.user) setUser(data.user);
        },
        { success: "common:toast.emailVerified" },
      ),
    [run],
  );

  const sendPhoneOtp = useCallback(
    () =>
      run(
        async () => {
          await axiosApi.sendOtp("verify-phone");
        },
        { success: "common:toast.codeSent" },
      ),
    [run],
  );

  const verifyPhoneOtp = useCallback(
    (otp: string) =>
      run(
        async () => {
          const { data } = await axiosApi.verifyPhoneOtp(otp);
          if (data.user) setUser(data.user);
        },
        { success: "common:toast.phoneVerified" },
      ),
    [run],
  );

  const sendPasswordResetOtp = useCallback(
    (fullPhone: string) =>
      run(async () => {
        await axiosApi.sendOtp("reset-password", { fullPhone });
      }),
    [run],
  );

  const verifyPasswordResetOtp = useCallback(
    (fullPhone: string, otp: string) =>
      run(async () => {
        const { data } = await axiosApi.verifyPasswordResetOtp(fullPhone, otp);
        return data.resetToken;
      }),
    [run],
  );

  const sendPasswordResetLink = useCallback(
    (email: string) =>
      run(async () => {
        await axiosApi.sendPasswordResetLink(email);
      }),
    [run],
  );

  const resetPassword = useCallback(
    (token: string, password: string) =>
      run(async () => {
        await axiosApi.resetPassword(token, password);
      }),
    [run],
  );

  const updateProfile = useCallback(
    (payload: UpdateProfileForm) =>
      run(
        async () => {
          const { data } = await axiosApi.updateProfile(payload);
          if (data.user) setUser(data.user);
        },
        { success: "common:toast.profileUpdated" },
      ),
    [run],
  );

  const deactivateAccount = useCallback(
    (password: string) =>
      run(
        async () => {
          await axiosApi.deactivateAccount(password);
          setUser(null);
          router.push("/login");
        },
        { success: "common:toast.accountDeactivated" },
      ),
    [run, router],
  );

  const changePassword = useCallback(
    (payload: ChangePasswordForm) =>
      run(
        async () => {
          await axiosApi.changePassword(payload);
        },
        { success: "common:toast.passwordChanged" },
      ),
    [run],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      setUser,
      login,
      register,
      logout,
      sendEmailOtp,
      verifyEmailOtp,
      sendPhoneOtp,
      verifyPhoneOtp,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      sendPasswordResetLink,
      resetPassword,
      updateProfile,
      deactivateAccount,
      changePassword,
    }),
    [
      user,
      isLoading,
      setUser,
      login,
      register,
      logout,
      sendEmailOtp,
      verifyEmailOtp,
      sendPhoneOtp,
      verifyPhoneOtp,
      sendPasswordResetOtp,
      verifyPasswordResetOtp,
      sendPasswordResetLink,
      resetPassword,
      updateProfile,
      deactivateAccount,
      changePassword,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
