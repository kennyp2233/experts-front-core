"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/auth.service';
import { AuthResponse, User, LoginRequest, RegisterRequest } from '../types/auth.types';

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
        console.log('[AUTH] Initializing auth...');
        // Try to fetch profile - if cookie exists, it will be sent automatically
        const profile = await authService.getProfile();
        console.log('[AUTH] Init: Profile found:', profile);
        setUser(profile);
        setIsAuthenticated(true);
        console.log('[AUTH] Init: User already authenticated');
      } catch (error: any) {
        // If 401 or any error, user is not authenticated
        console.log('[AUTH] Init: Not authenticated', {
          status: error?.response?.status,
          message: error?.message,
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
      console.log('[AUTH] Starting login...');
      const response: AuthResponse = await authService.login(credentials);
      console.log('[AUTH] Login response received:', response);
      
      // Token is set in httpOnly cookie by backend
      // Wait a bit for cookie to be set, then fetch profile
      console.log('[AUTH] Waiting 100ms for cookie to be set...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch profile to verify cookie is working
      console.log('[AUTH] Fetching profile...');
      const profile = await authService.getProfile();
      console.log('[AUTH] Profile received:', profile);
      
      setUser(profile);
      setIsAuthenticated(true);
      console.log('[AUTH] Login successful - authenticated!');
    } catch (error: any) {
      console.error('[AUTH] Login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      console.log('[AUTH] Starting register...');
      const response: AuthResponse = await authService.register(userData);
      console.log('[AUTH] Register response received:', response);
      
      // Token is set in httpOnly cookie by backend
      // Wait a bit for cookie to be set, then fetch profile
      console.log('[AUTH] Waiting 100ms for cookie to be set...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch profile to verify cookie is working
      console.log('[AUTH] Fetching profile...');
      const profile = await authService.getProfile();
      console.log('[AUTH] Profile received:', profile);
      
      setUser(profile);
      setIsAuthenticated(true);
      console.log('[AUTH] Register successful - authenticated!');
    } catch (error: any) {
      console.error('[AUTH] Register error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Even if logout fails, clear state and cookie
      console.warn('Logout failed:', error);
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