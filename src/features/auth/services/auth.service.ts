import api from '../../../shared/services/api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types';

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
    // Note: Backend doesn't have refresh token endpoint
    throw new Error('Refresh token not implemented in backend');
  }

  async logout(): Promise<void> {
    const response = await api.post('/auth/logout');
    console.log('Logout response:', response.data);
    // Backend should clear the httpOnly cookie
  }

  async getProfile(): Promise<any> {
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
}

export const authService = new AuthService();