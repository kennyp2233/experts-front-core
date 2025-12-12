import axios from 'axios';
import { logger } from '../utils/logger';

const apiLogger = logger.createChild('API');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
const API_VERSION = 'v1';

// Use sessionStorage to prevent multiple logout calls (SSR-safe)
const LOGOUT_FLAG_KEY = '__is_logging_out__';

const isLoggingOut = () => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
};

const setLoggingOut = (value: boolean) => {
  if (typeof window === 'undefined') return;
  if (value) {
    sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true');
  } else {
    sessionStorage.removeItem(LOGOUT_FLAG_KEY);
  }
};

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Note: Authorization header will be sent automatically via httpOnly cookie
    // No need to add it manually
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const is401 = error.response?.status === 401;
    const isLogoutEndpoint = error.config?.url?.includes('/auth/logout');
    const isProfileEndpoint = error.config?.url?.includes('/auth/profile');
    const is2FAEndpoint = error.config?.url?.includes('/auth/2fa/');

    // Check for token refresh success message from backend
    const isRefreshSuccess = error.response?.data?.message === 'Token refresh succeeded, retry request' ||
      error.response?.data?.message?.includes('Token refresh succeeded');

    if (is401 && isRefreshSuccess) {
      apiLogger.debug('Token refresh succeeded, retrying original request', { url: error.config?.url });
      return api.request(error.config);
    }

    // Check if we're already on the auth page
    const isOnAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');

    // Only handle 401 errors that are NOT from logout/profile/2fa endpoints,
    // NOT already on auth page, and if not already logging out
    if (is401 && !isLogoutEndpoint && !isProfileEndpoint && !is2FAEndpoint && !isOnAuthPage && !isLoggingOut()) {
      apiLogger.warn('401 Unauthorized - initiating logout', { url: error.config?.url });
      setLoggingOut(true);

      try {
        // Call logout API to clear server-side session
        // Use a direct axios instance to avoid triggering this interceptor
        await axios.post(`${API_BASE_URL}/api/${API_VERSION}/auth/logout`, {}, {
          withCredentials: true,
        });
        apiLogger.debug('Logout API called successfully');
      } catch (logoutError) {
        // Ignore logout errors - cookie might already be invalid
        apiLogger.debug('Logout API call failed (expected if cookie invalid)', logoutError);
      }

      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }

      // Reset flag after a delay in case redirect doesn't happen immediately
      setTimeout(() => {
        setLoggingOut(false);
      }, 1000);
    }

    return Promise.reject(error);
  }
);

export default api;