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
  Enable2FAResponse,
  Verify2FARequest,
} from '../types/auth.types';

/**
 * Simplified Auth Context
 * Now delegates all operations to specialized hooks
 */
interface AuthContextType {
  // User state (from SWR)
  user: ReturnType<typeof useUser>['user'];
  isLoading: boolean;
  isAuthenticated: boolean;

  // Login flow
  login: (credentials: LoginRequest) => Promise<void>;
  requires2FA: boolean;
  tempToken: string | null;

  // Register flow
  register: (userData: RegisterRequest) => Promise<void>;

  // Logout
  logout: () => Promise<void>;

  // 2FA operations
  verify2FA: (token: string, trustDevice?: boolean) => Promise<void>;
  enable2FA: () => Promise<Enable2FAResponse>;
  confirm2FA: (token: string) => Promise<void>;
  disable2FA: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Simplified AuthProvider
 * No internal state - just composition of specialized hooks
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // User query (SWR)
  const { user, isLoading: userLoading, isAuthenticated } = useUser();

  // Auth mutations
  const { login, requires2FA, tempToken, isLoading: loginLoading } = useLogin();
  const { register, isLoading: registerLoading } = useRegister();
  const { logout } = useLogout();

  // 2FA operations
  const {
    enable2FA: enable2FAMutate,
    confirm2FA: confirm2FAMutate,
    verify2FA: verify2FAMutate,
    disable2FA: disable2FAMutate,
  } = use2FA();

  // Wrapper functions to match original API
  const loginWrapper = async (credentials: LoginRequest): Promise<void> => {
    await login(credentials);
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

  const value: AuthContextType = {
    user,
    isLoading: userLoading || loginLoading || registerLoading,
    isAuthenticated,
    login: loginWrapper,
    requires2FA,
    tempToken,
    register: registerWrapper,
    logout,
    verify2FA,
    enable2FA,
    confirm2FA,
    disable2FA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * @throws {Error} if used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
