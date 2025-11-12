import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_VERSION = 'v1';

// Flag to prevent multiple logout calls
let isLoggingOut = false;

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
    
    // Check if we're already on the auth page
    const isOnAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
    
    // Only handle 401 errors that are NOT from logout/profile endpoints, 
    // NOT already on auth page, and if not already logging out
    if (is401 && !isLogoutEndpoint && !isProfileEndpoint && !isOnAuthPage && !isLoggingOut) {
      console.warn('[API] 401 Unauthorized - initiating logout:', error.config?.url);
      isLoggingOut = true;
      
      try {
        // Call logout API to clear server-side session
        // Use a direct axios instance to avoid triggering this interceptor
        await axios.post(`${API_BASE_URL}/api/${API_VERSION}/auth/logout`, {}, {
          withCredentials: true,
        });
        console.log('[API] Logout API called successfully');
      } catch (logoutError) {
        // Ignore logout errors - cookie might already be invalid
        console.warn('[API] Logout API call failed (expected if cookie invalid):', logoutError);
      }
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
      
      // Reset flag after a delay in case redirect doesn't happen immediately
      setTimeout(() => {
        isLoggingOut = false;
      }, 1000);
    }
    
    return Promise.reject(error);
  }
);

export default api;