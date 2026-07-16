"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  emailConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  monthlyAllowanceAmount?: number;
  allowanceDayOfMonth?: number;
  targetMonthlySavings?: number;
  currency?: string;
  resetFrequency?: string;
  updatedAt?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  isTwoFactorRequired?: boolean;
  userId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (userId: string, otpCode: string) => Promise<{ success: boolean; error?: string }>;
  sendRegisterOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string, fullName: string, otpCode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get("/api/auth/profile");
      const result = response.data;
      if (result.isSuccess && result.value) {
        setUser(result.value);
        setIsAuthenticated(true);
        localStorage.setItem("userProfile", JSON.stringify(result.value));
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuthTokens = async (value: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    username: string;
    email: string;
    fullName: string;
  }) => {
    localStorage.setItem("accessToken", value.accessToken);
    localStorage.setItem("refreshToken", value.refreshToken);

    const initialUser: UserProfile = {
      userId: value.userId,
      username: value.username,
      email: value.email,
      fullName: value.fullName,
    };
    setUser(initialUser);
    setIsAuthenticated(true);

    await fetchProfile();
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        const cachedProfile = localStorage.getItem("userProfile");

        if (token) {
          if (cachedProfile) {
            setUser(JSON.parse(cachedProfile));
            setIsAuthenticated(true);
            setIsLoading(false);
            fetchProfile();
          } else {
            await fetchProfile();
          }
        } else {
          setIsLoading(false);
        }
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await apiClient.post("/api/auth/login", { email, password });
      const result = response.data;

      if (result.isSuccess && result.value) {
        if (result.value.isTwoFactorRequired) {
          return {
            success: false,
            isTwoFactorRequired: true,
            userId: result.value.userId,
          };
        }

        const { accessToken, refreshToken, userId, username, fullName } = result.value;
        await storeAuthTokens({ accessToken, refreshToken, userId, username, email, fullName });
        return { success: true };
      } else {
        return { success: false, error: result.error?.message || "Login failed." };
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Invalid email or password.";
      return { success: false, error: msg };
    }
  };

  const verifyTwoFactor = async (userId: string, otpCode: string) => {
    try {
      const response = await apiClient.post("/api/auth/login/verify-2fa", { userId, otpCode });
      const result = response.data;

      if (result.isSuccess && result.value) {
        const { accessToken, refreshToken, username, email, fullName } = result.value;
        await storeAuthTokens({ accessToken, refreshToken, userId, username, email, fullName });
        return { success: true };
      } else {
        return { success: false, error: result.error?.message || "Verification failed." };
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Invalid verification code.";
      return { success: false, error: msg };
    }
  };

  const sendRegisterOtp = async (email: string) => {
    try {
      const response = await apiClient.post("/api/auth/register/send-otp", { email });
      const result = response.data;

      if (result.isSuccess) {
        return { success: true };
      } else {
        return { success: false, error: result.error?.message || "Failed to send verification code." };
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to send verification code.";
      return { success: false, error: msg };
    }
  };

  const register = async (username: string, email: string, password: string, fullName: string, otpCode: string) => {
    try {
      const response = await apiClient.post("/api/auth/register", {
        username,
        email,
        password,
        fullName,
        otpCode,
      });
      const result = response.data;

      if (result.isSuccess && result.value) {
        const { accessToken, refreshToken, userId } = result.value;
        await storeAuthTokens({ accessToken, refreshToken, userId, username, email, fullName });
        return { success: true };
      } else {
        return { success: false, error: result.error?.message || "Registration failed." };
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Registration failed. Try a different username/email.";
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userProfile");
    setUser(null);
    setIsAuthenticated(false);
    queryClient.clear();
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      const response = await apiClient.put("/api/auth/profile", {
        monthlyAllowanceAmount: profileData.monthlyAllowanceAmount,
        allowanceDayOfMonth: profileData.allowanceDayOfMonth,
        targetMonthlySavings: profileData.targetMonthlySavings,
        currency: profileData.currency,
        resetFrequency: profileData.resetFrequency,
      });
      const result = response.data;

      if (result.isSuccess && result.value) {
        setUser(result.value);
        localStorage.setItem("userProfile", JSON.stringify(result.value));
        return { success: true };
      } else {
        return { success: false, error: result.error?.message || "Profile update failed." };
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Profile update failed.";
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        verifyTwoFactor,
        sendRegisterOtp,
        register,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
