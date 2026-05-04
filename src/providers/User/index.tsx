"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, LoginForm, AuthResponse } from "@/types";
import { axiosApi } from "@/api";
import { AutoLogoutPopup } from "@/shared/components/AutoLogoutPopup";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (payload: LoginForm) => Promise<AuthResponse>;
  register: (payload: FormData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  sendResetOtp: (phone: string) => Promise<void>;
  verifyResetOtp: (phone: string, otp: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
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

  const register = useCallback(async (payload: FormData) => {
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
