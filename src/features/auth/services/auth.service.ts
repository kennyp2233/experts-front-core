import api from '../../../shared/services/api';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Enable2FARequest,
  Enable2FAResponse,
  Verify2FARequest,
  Verify2FAResponse,
  TrustedDevice,
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

  // ========== 2FA Methods (Backend implementation pending) ==========

  /**
   * Enable 2FA for the current user
   * Backend endpoint: POST /auth/2fa/enable (NOT IMPLEMENTED YET)
   */
  async enable2FA(): Promise<Enable2FAResponse> {
    const response = await api.post('/auth/2fa/enable');
    console.log('Enable 2FA response:', response.data);
    return response.data;
  }

  /**
   * Confirm 2FA setup with TOTP code
   * Backend endpoint: POST /auth/2fa/confirm (NOT IMPLEMENTED YET)
   */
  async confirm2FA(data: Enable2FARequest): Promise<{ success: boolean }> {
    const response = await api.post('/auth/2fa/confirm', data);
    console.log('Confirm 2FA response:', response.data);
    return response.data;
  }

  /**
   * Disable 2FA for the current user
   * Backend endpoint: POST /auth/2fa/disable (NOT IMPLEMENTED YET)
   */
  async disable2FA(token: string): Promise<{ success: boolean }> {
    const response = await api.post('/auth/2fa/disable', { token });
    console.log('Disable 2FA response:', response.data);
    return response.data;
  }

  /**
   * Verify 2FA code during login
   * Backend endpoint: POST /auth/2fa/verify (NOT IMPLEMENTED YET)
   */
  async verify2FA(data: Verify2FARequest): Promise<Verify2FAResponse> {
    const response = await api.post('/auth/2fa/verify', data);
    console.log('Verify 2FA response:', response.data);
    return response.data;
  }

  /**
   * Get list of trusted devices
   * Backend endpoint: GET /auth/2fa/trusted-devices (NOT IMPLEMENTED YET)
   */
  async getTrustedDevices(): Promise<TrustedDevice[]> {
    const response = await api.get('/auth/2fa/trusted-devices');
    console.log('Trusted devices response:', response.data);
    return response.data;
  }

  /**
   * Revoke a trusted device
   * Backend endpoint: DELETE /auth/2fa/trusted-devices/:id (NOT IMPLEMENTED YET)
   */
  async revokeTrustedDevice(deviceId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/auth/2fa/trusted-devices/${deviceId}`);
    console.log('Revoke device response:', response.data);
    return response.data;
  }
}

export const authService = new AuthService();