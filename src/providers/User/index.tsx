"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, LoginForm, AuthResponse, RegisterForm } from "@/types";
import { axiosApi } from "@/api";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (payload: LoginForm) => Promise<AuthResponse>;
  register: (payload: RegisterForm) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  sendResetOtp: (phone: string) => Promise<void>;
  verifyResetOtp: (phone: string, otp: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  updateProfile: (
    payload: Partial<{
      fullName: string;
      username: string;
      phone: string;
      email: string;
      payout: { iban: string; bankName: string };
    }>,
  ) => Promise<void>;
  requestEmailChange: (newEmail: string) => Promise<void>;
  confirmEmailChange: (token: string) => Promise<void>;
  deactivateAccount: () => Promise<void>;
  sendPhoneOtp: () => Promise<void>;
  verifyPhoneOtp: (otp: string) => Promise<void>;
  sendOtp: () => Promise<void>;
}

interface UserProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({
  children,
  initialUser = null,
}: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(initialUser);
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
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendResetOtp = useCallback(async (phone: string) => {
    try {
      setIsLoading(true);
      await axiosApi.sendResetOtp(phone);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyResetOtp = useCallback(async (phone: string, otp: string) => {
    try {
      setIsLoading(true);
      const { data } = await axiosApi.verifyResetOtp(phone, otp);
      if (!data.resetToken) throw new Error("No reset token received");
      return data.resetToken;
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

  const sendResetEmail = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      await axiosApi.sendResetEmail(email);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (
      payload: Partial<{ fullName: string; username: string; phone: string }>,
    ) => {
      try {
        setIsLoading(true);
        const { data } = await axiosApi.updateProfile(payload);
        if (data.user) setUser(data.user);
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestEmailChange = useCallback(async (newEmail: string) => {
    try {
      setIsLoading(true);
      await axiosApi.requestEmailChange(newEmail);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmEmailChange = useCallback(async (token: string) => {
    try {
      setIsLoading(true);
      await axiosApi.confirmEmailChange(token);
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
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendPhoneOtp = useCallback(async () => {
    try {
      setIsLoading(true);
      await axiosApi.sendPhoneOtp();
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

  const sendOtp = useCallback(async () => {
    try {
      setIsLoading(true);
      await axiosApi.sendOtp();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        setUser,
        login,
        register,
        logout,
        sendResetOtp,
        verifyResetOtp,
        resetPassword,
        sendResetEmail,
        updateProfile,
        requestEmailChange,
        confirmEmailChange,
        deactivateAccount,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendOtp,
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
