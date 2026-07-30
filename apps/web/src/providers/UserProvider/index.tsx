"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  PublicUser,
  LoginForm,
  AuthResponse,
  RegisterForm,
  UpdateProfileForm,
} from "@shared/types";
import { axiosApi } from "api/index";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";
import { redirect } from "next/navigation";

interface UserContextType {
  user: PublicUser | null;
  isLoading: boolean;
  setUser: (user: PublicUser | null) => void;
  login: (payload: LoginForm) => Promise<AuthResponse>;
  register: (payload: RegisterForm) => Promise<AuthResponse>;
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
  deactivateAccount: () => Promise<void>;
  changePassword: (payload: {
    oldPassword: string;
    newPassword: string;
  }) => Promise<void>;
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

  const login = useCallback(async (payload: LoginForm) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.login(payload);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterForm) => {
    setIsLoading(true);
    try {
      const { data } = await axiosApi.register(payload);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await axiosApi.logout();
      setUser(null);
      redirect("/login");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendEmailOtp = useCallback(async () => {
    try {
      setIsLoading(true);
      await axiosApi.sendOtp("verify-email");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyEmailOtp = useCallback(async (otp: string) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.verifyEmailOtp(otp);
      if (data.user) setUser(data.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendPhoneOtp = useCallback(async () => {
    try {
      setIsLoading(true);
      await axiosApi.sendOtp("verify-phone");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (otp: string) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.verifyPhoneOtp(otp);
      if (data.user) setUser(data.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendPasswordResetOtp = useCallback(async (fullPhone: string) => {
    try {
      setIsLoading(true);
      await axiosApi.sendOtp("reset-password", { fullPhone });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyPasswordResetOtp = useCallback(
    async (fullPhone: string, otp: string) => {
      try {
        setIsLoading(true);
        const { data } = await axiosApi.verifyPasswordResetOtp(fullPhone, otp);
        return data.resetToken;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const sendPasswordResetLink = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      await axiosApi.sendPasswordResetLink(email);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      setIsLoading(true);
      await axiosApi.resetPassword(token, password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfileForm) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.updateProfile(payload);
      if (data.user) setUser(data.user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deactivateAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      await axiosApi.deactivateAccount();
      setUser(null);
      redirect("/login");
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(
    async (payload: { oldPassword: string; newPassword: string }) => {
      try {
        setIsLoading(true);
        await axiosApi.changePassword(payload);
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return (
    <UserContext.Provider
      value={{
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
      }}
    >
      {user && <AutoLogoutPopup />}
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
