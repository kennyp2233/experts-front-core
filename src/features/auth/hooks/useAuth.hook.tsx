"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/auth.service';
import { AuthResponse, User, LoginRequest, RegisterRequest } from '../types/auth.types';
import { logger, retryProfileFetch } from '../../../shared/utils';

const authLogger = logger.createChild('AUTH');

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
    }
  };

  const value: AuthContextType = {
    user,
    isLoading: !isInitialized,
    isAuthenticated,
    login,
    register,
    logout,
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