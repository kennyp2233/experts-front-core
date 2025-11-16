/**
 * Auth API Layer
 * Pure functions for HTTP requests - no state, no logging, just API calls
 */

import api from '../../../shared/services/api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Enable2FAResponse,
  Confirm2FARequest,
  Confirm2FAResponse,
  Verify2FARequest,
  Verify2FAResponse,
  Disable2FAResponse,
} from '../types/auth.types';

// ==================== AUTH ENDPOINTS ====================

export const authApi = {
  /**
   * POST /auth/login
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * POST /auth/register
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * POST /auth/logout
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * GET /auth/profile
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // ==================== 2FA ENDPOINTS ====================

  /**
   * POST /auth/2fa/enable
   * Generate QR code and secret for 2FA setup
   */
  enable2FA: async (): Promise<Enable2FAResponse> => {
    const response = await api.post('/auth/2fa/enable');
    return response.data;
  },

  /**
   * POST /auth/2fa/confirm
   * Confirm 2FA setup with TOTP code
   */
  confirm2FA: async (data: Confirm2FARequest): Promise<Confirm2FAResponse> => {
    const response = await api.post('/auth/2fa/confirm', data);
    return response.data;
  },

  /**
   * POST /auth/2fa/verify
   * Verify 2FA code during login
   */
  verify2FA: async (data: Verify2FARequest): Promise<Verify2FAResponse> => {
    const response = await api.post('/auth/2fa/verify', data);
    return response.data;
  },

  /**
   * POST /auth/2fa/disable
   * Disable 2FA for current user
   */
  disable2FA: async (): Promise<Disable2FAResponse> => {
    const response = await api.post('/auth/2fa/disable');
    return response.data;
  },
};
