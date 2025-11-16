"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/auth.service';
import {
  AuthResponse,
  User,
  LoginRequest,
  RegisterRequest,
  Enable2FAResponse,
  Verify2FARequest,
} from '../types/auth.types';
import { logger, retryProfileFetch } from '../../../shared/utils';

const authLogger = logger.createChild('AUTH');

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requires2FA: boolean;
  tempToken: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  // 2FA methods
  verify2FA: (token: string, trustDevice?: boolean) => Promise<void>;
  enable2FA: () => Promise<Enable2FAResponse>;
  confirm2FA: (token: string) => Promise<void>;
  disable2FA: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  // Initialize: check if there's an existing session via cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        authLogger.debug('Initializing auth...');
        // Try to fetch profile - if cookie exists, it will be sent automatically
        const profile = await authService.getProfile();
        authLogger.debug('Profile found', profile);
        setUser(profile);
        setIsAuthenticated(true);
        authLogger.info('User authenticated');
      } catch (error: unknown) {
        // If 401 or any error, user is not authenticated
        const err = error as { response?: { status?: number }; message?: string };
        authLogger.debug('Not authenticated', {
          status: err?.response?.status,
          message: err?.message,
        });
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      authLogger.debug('Starting login...');
      const response: AuthResponse = await authService.login(credentials);
      authLogger.debug('Login response received', response);

      // Check if 2FA is required
      if (response.requires2FA && response.tempToken) {
        authLogger.debug('2FA required for this user');
        setRequires2FA(true);
        setTempToken(response.tempToken);
        setIsAuthenticated(false);
        authLogger.info('2FA verification needed');
        return; // Exit early, wait for 2FA verification
      }

      // Token is set in httpOnly cookie by backend
      // Retry fetching profile to verify cookie is working
      authLogger.debug('Fetching profile with retry...');
      const profile = await retryProfileFetch(
        () => authService.getProfile(),
        3 // max 3 retries
      );
      authLogger.debug('Profile received', profile);

      setUser(profile);
      setIsAuthenticated(true);
      setRequires2FA(false);
      setTempToken(null);
      authLogger.info('Login successful - authenticated!');
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { status?: number; data?: unknown } };
      authLogger.error('Login error', error, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setIsAuthenticated(false);
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      authLogger.debug('Starting register...');
      const response: AuthResponse = await authService.register(userData);
      authLogger.debug('Register response received', response);

      // Token is set in httpOnly cookie by backend
      // Retry fetching profile to verify cookie is working
      authLogger.debug('Fetching profile with retry...');
      const profile = await retryProfileFetch(
        () => authService.getProfile(),
        3 // max 3 retries
      );
      authLogger.debug('Profile received', profile);

      setUser(profile);
      setIsAuthenticated(true);
      authLogger.info('Register successful - authenticated!');
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { status?: number; data?: unknown } };
      authLogger.error('Register error', error, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      authLogger.info('Logout successful');
    } catch (error) {
      // Even if logout fails, clear state and cookie
      authLogger.warn('Logout failed', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setRequires2FA(false);
      setTempToken(null);
    }
  };

  // ========== 2FA Methods ==========

  const verify2FA = async (token: string, trustDevice?: boolean) => {
    try {
      if (!tempToken) {
        throw new Error('No temporary token available. Please login again.');
      }

      authLogger.debug('Verifying 2FA code...');
      const response = await authService.verify2FA({
        tempToken,
        token,
        trustDevice,
      });

      authLogger.debug('2FA verification successful', response);

      // Fetch profile after successful 2FA
      const profile = await retryProfileFetch(
        () => authService.getProfile(),
        3
      );

      setUser(profile);
      setIsAuthenticated(true);
      setRequires2FA(false);
      setTempToken(null);
      authLogger.info('2FA verified - authenticated!');
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { status?: number; data?: unknown } };
      authLogger.error('2FA verification error', error, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      throw error;
    }
  };

  const enable2FA = async (): Promise<Enable2FAResponse> => {
    try {
      authLogger.debug('Enabling 2FA...');
      const response = await authService.enable2FA();
      authLogger.info('2FA setup initiated');
      return response;
    } catch (error: unknown) {
      authLogger.error('Enable 2FA error', error);
      throw error;
    }
  };

  const confirm2FA = async (token: string) => {
    try {
      authLogger.debug('Confirming 2FA setup...');
      await authService.confirm2FA({ token });

      // Refresh user profile to get updated twoFactorEnabled status
      const profile = await authService.getProfile();
      setUser(profile);

      authLogger.info('2FA enabled successfully');
    } catch (error: unknown) {
      authLogger.error('Confirm 2FA error', error);
      throw error;
    }
  };

  const disable2FA = async () => {
    try {
      authLogger.debug('Disabling 2FA...');
      await authService.disable2FA();

      // Refresh user profile to get updated twoFactorEnabled status
      const profile = await authService.getProfile();
      setUser(profile);

      authLogger.info('2FA disabled successfully');
    } catch (error: unknown) {
      authLogger.error('Disable 2FA error', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: !isInitialized,
    isAuthenticated,
    requires2FA,
    tempToken,
    login,
    register,
    logout,
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