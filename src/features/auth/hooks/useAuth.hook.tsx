"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useUser } from './useUser';
import { useLogin } from './useLogin';
import { useRegister } from './useRegister';
import { useLogout } from './useLogout';
import { use2FA } from './use2FA';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Enable2FAResponse,
} from '../types/auth.types';

interface AuthContextType {
  user: ReturnType<typeof useUser>['user'];
  /** True while the very first profile attempt has not settled (no data, no error). */
  isAuthLoading: boolean;
  /** True while a login/register mutation is in-flight. NOT for gating protected UI. */
  isMutating: boolean;
  /**
   * Back-compat alias: isAuthLoading || isMutating.
   * Prefer the specific flags above. New code should not gate auth on this.
   */
  isLoading: boolean;
  isAuthenticated: boolean;

  /** Returns the AuthResponse so callers can inspect `requires2FA` without waiting for re-render. */
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  requires2FA: boolean;
  tempToken: string | null;
  resetLogin: () => void;

  register: (userData: RegisterRequest) => Promise<void>;

  logout: () => Promise<void>;

  verify2FA: (token: string, trustDevice?: boolean) => Promise<void>;
  enable2FA: () => Promise<Enable2FAResponse>;
  confirm2FA: (token: string) => Promise<void>;
  disable2FA: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, hasSettled, isAuthenticated } = useUser();

  const {
    login,
    requires2FA,
    tempToken,
    isLoading: loginLoading,
    reset: resetLogin,
  } = useLogin();
  const { register, isLoading: registerLoading } = useRegister();
  const { logout } = useLogout();

  const {
    enable2FA: enable2FAMutate,
    confirm2FA: confirm2FAMutate,
    verify2FA: verify2FAMutate,
    disable2FA: disable2FAMutate,
  } = use2FA();

  const loginWrapper = async (credentials: LoginRequest): Promise<AuthResponse> => {
    return login(credentials);
  };

  const registerWrapper = async (userData: RegisterRequest): Promise<void> => {
    await register(userData);
  };

  const enable2FA = async (): Promise<Enable2FAResponse> => {
    return enable2FAMutate();
  };

  const confirm2FA = async (token: string) => {
    await confirm2FAMutate({ token });
  };

  const verify2FA = async (token: string, trustDevice?: boolean) => {
    if (!tempToken) {
      throw new Error('No temporary token available. Please login again.');
    }
    await verify2FAMutate({ tempToken, token, trustDevice });
  };

  const disable2FA = async () => {
    await disable2FAMutate();
  };

  const logoutWrapper = async (): Promise<void> => {
    await logout();
    resetLogin();
  };

  const isAuthLoading = !hasSettled;
  const isMutating = loginLoading || registerLoading;

  const value: AuthContextType = {
    user,
    isAuthLoading,
    isMutating,
    isLoading: isAuthLoading || isMutating,
    isAuthenticated,
    login: loginWrapper,
    requires2FA,
    tempToken,
    resetLogin,
    register: registerWrapper,
    logout: logoutWrapper,
    verify2FA,
    enable2FA,
    confirm2FA,
    disable2FA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
