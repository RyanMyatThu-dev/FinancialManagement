"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
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
  enableQuotaPacing?: boolean;
  updatedAt?: string;
  role?: string;
  permissions?: string[];
}

// What the enriched profile fetch says about the session, as distinct from whether it
// succeeded: only "unauthenticated" is grounds for clearing a session.
type ProfileFetchOutcome = "loaded" | "unauthenticated" | "unavailable";

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
  register: (username: string, email: string, password: string, fullName: string, otpCode: string, currency?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const fetchProfile = async (): Promise<ProfileFetchOutcome> => {
    try {
      const response = await apiClient.get("/api/auth/profile");
      const result = response.data;
      if (result.isSuccess && result.value) {
        setUser(result.value);
        setIsAuthenticated(true);
        localStorage.setItem("userProfile", JSON.stringify(result.value));
        return "loaded";
      }
      // A well-formed failure envelope from an authenticated endpoint means the account
      // itself is no longer usable (deleted or deactivated) — not a transport problem.
      logout();
      return "unauthenticated";
    } catch (err) {
      const status = (err as AxiosError).response?.status;
      if (status === 401 || status === 403) {
        logout();
        return "unauthenticated";
      }
      // A 429, a 5xx, an API Gateway timeout or a dropped connection says nothing about
      // the token. Tearing the session down here turned any backend blip into a silent
      // logout immediately after a successful sign-in.
      return "unavailable";
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
    role?: string;
    permissions?: string[];
  }): Promise<boolean> => {
    localStorage.setItem("accessToken", value.accessToken);
    localStorage.setItem("refreshToken", value.refreshToken);

    const initialUser: UserProfile = {
      userId: value.userId,
      username: value.username,
      email: value.email,
      fullName: value.fullName,
      role: value.role,
      permissions: value.permissions,
    };
    setUser(initialUser);
    setIsAuthenticated(true);
    localStorage.setItem("userProfile", JSON.stringify(initialUser));

    // The auth response already carries everything needed to enter the app; the profile
    // fetch only enriches it. So the sign-in stands unless the session is actively rejected.
    return (await fetchProfile()) !== "unauthenticated";
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

        const { accessToken, refreshToken, userId, username, fullName, role, permissions } = result.value;
        const profileLoaded = await storeAuthTokens({ accessToken, refreshToken, userId, username, email, fullName, role, permissions });
        if (!profileLoaded) {
          return { success: false, error: "Signed in, but the session was rejected. Please try again." };
        }
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
        const { accessToken, refreshToken, username, email, fullName, role, permissions } = result.value;
        const profileLoaded = await storeAuthTokens({ accessToken, refreshToken, userId, username, email, fullName, role, permissions });
        if (!profileLoaded) {
          return { success: false, error: "Signed in, but the session was rejected. Please try again." };
        }
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

  const register = async (username: string, email: string, password: string, fullName: string, otpCode: string, currency?: string) => {
    try {
      const response = await apiClient.post("/api/auth/register", {
        username,
        email,
        password,
        fullName,
        otpCode,
        currency,
      });
      const result = response.data;

      if (result.isSuccess && result.value) {
        const { accessToken, refreshToken, userId, role, permissions } = result.value;
        const profileLoaded = await storeAuthTokens({ accessToken, refreshToken, userId, username, email, fullName, role, permissions });
        if (!profileLoaded) {
          return { success: false, error: "Account created, but the session was rejected. Please try logging in." };
        }
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
        enableQuotaPacing: profileData.enableQuotaPacing,
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

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === "Admin") return true; // Super admins bypass check
    return user.permissions?.includes(permission) || false;
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
        hasPermission,
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
