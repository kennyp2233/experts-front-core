import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from '../utils/logger';

const apiLogger = logger.createChild('API');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
const API_VERSION = 'v1';

const TOKEN_REFRESHED_HEADER = 'x-token-refreshed';
const LEGACY_REFRESH_BODY = 'Token refresh succeeded, retry request';

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

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

// === Single-flight token refresh ===
// When the back responds 401 with X-Token-Refreshed: true (or the legacy body
// message), the access cookie was already rewritten by the back's filter.
// Multiple parallel requests can hit 401 at the same moment; we share a single
// "refresh in progress" Promise so all parallel requests wait on the same
// signal and retry once, instead of racing each other.
let pendingRefresh: Promise<void> | null = null;

const isRefreshedResponse = (error: AxiosError): boolean => {
  if (error.response?.status !== 401) return false;
  const headerFlag = error.response.headers?.[TOKEN_REFRESHED_HEADER];
  if (headerFlag === 'true') return true;
  // Back-compat with older back builds that only return the body message
  const body = error.response.data as { message?: string; refreshed?: boolean } | undefined;
  if (body?.refreshed === true) return true;
  return body?.message === LEGACY_REFRESH_BODY;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const is401 = error.response?.status === 401;
    const url = config?.url ?? '';
    const isLogoutEndpoint = url.includes('/auth/logout');
    const isProfileEndpoint = url.includes('/auth/profile');
    const is2FAEndpoint = url.includes('/auth/2fa/');
    const isOnAuthPage =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');

    // ---- Case 1: back signals "token refreshed, retry" -----------------
    if (is401 && isRefreshedResponse(error) && config && !config._retried) {
      // First request to detect the refresh "owns" the signal; others wait.
      if (!pendingRefresh) {
        pendingRefresh = Promise.resolve().finally(() => {
          // The cookie was already set by the back when the 401-with-refresh
          // arrived. We resolve immediately so all waiters retry their request
          // with the now-fresh cookie. There is no async work to do here.
        });
      }
      try {
        await pendingRefresh;
      } finally {
        pendingRefresh = null;
      }
      config._retried = true;
      apiLogger.debug('Retrying request after token refresh', { url });
      return api.request(config);
    }

    // ---- Case 2: 401 with no refresh path -> logout flow ---------------
    if (
      is401 &&
      !isLogoutEndpoint &&
      !isProfileEndpoint &&
      !is2FAEndpoint &&
      !isOnAuthPage &&
      !isLoggingOut()
    ) {
      apiLogger.warn('401 Unauthorized - initiating logout', { url });
      setLoggingOut(true);

      try {
        // Use a raw axios so this interceptor doesn't fire recursively
        await axios.post(`${API_BASE_URL}/api/${API_VERSION}/auth/logout`, {}, {
          withCredentials: true,
        });
      } catch {
        // Cookie may already be invalid - ignore
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }

      // Safety: reset flag in case redirect was blocked
      setTimeout(() => setLoggingOut(false), 1000);
    }

    return Promise.reject(error);
  },
);

export default api;
