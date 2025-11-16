import api from '../../../shared/services/api';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Confirm2FARequest,
  Confirm2FAResponse,
  Enable2FAResponse,
  Verify2FARequest,
  Verify2FAResponse,
  Disable2FAResponse,
  User
} from '../types/auth.types';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    console.log('Login response:', response.data);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    console.log('Register response:', response.data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Note: Backend doesn't have refresh token endpoint yet
    throw new Error('Refresh token not implemented in backend');
  }

  async logout(): Promise<void> {
    const response = await api.post('/auth/logout');
    console.log('Logout response:', response.data);
    // Backend clears the httpOnly cookies
  }

  async getProfile(): Promise<User> {
    try {
      const response = await api.get('/auth/profile');
      console.log('Profile response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Profile error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message,
      });
      throw error;
    }
  }

  // ========== 2FA Methods (IMPLEMENTED ✓) ==========

  /**
   * Step 1: Enable 2FA - Generates QR code and secret
   * Backend endpoint: POST /auth/2fa/enable ✓
   * Requires: JWT token (authenticated user)
   * Returns: { secret, qrCode, message }
   */
  async enable2FA(): Promise<Enable2FAResponse> {
    const response = await api.post('/auth/2fa/enable');
    console.log('Enable 2FA response:', response.data);
    return response.data;
  }

  /**
   * Step 2: Confirm 2FA setup with TOTP code from authenticator app
   * Backend endpoint: POST /auth/2fa/confirm ✓
   * Requires: JWT token + 6-digit TOTP code
   * Returns: { success: boolean, message: string }
   */
  async confirm2FA(data: Confirm2FARequest): Promise<Confirm2FAResponse> {
    const response = await api.post('/auth/2fa/confirm', data);
    console.log('Confirm 2FA response:', response.data);
    return response.data;
  }

  /**
   * Verify 2FA code during login (when requires2FA = true)
   * Backend endpoint: POST /auth/2fa/verify ✓
   * Public endpoint (no JWT required)
   * Returns: { user } + sets auth cookies
   */
  async verify2FA(data: Verify2FARequest): Promise<Verify2FAResponse> {
    const response = await api.post('/auth/2fa/verify', data);
    console.log('Verify 2FA response:', response.data);
    return response.data;
  }

  /**
   * Disable 2FA for the current user
   * Backend endpoint: POST /auth/2fa/disable ✓
   * Requires: JWT token
   * Returns: { success: boolean, message: string }
   * Note: Also removes all trusted devices
   */
  async disable2FA(): Promise<Disable2FAResponse> {
    const response = await api.post('/auth/2fa/disable');
    console.log('Disable 2FA response:', response.data);
    return response.data;
  }
}

export const authService = new AuthService();