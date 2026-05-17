import useSWR from 'swr';
import { authApi } from '../api/auth.api';
import type { User } from '../types/auth.types';

const USER_QUERY_KEY = '/auth/profile';

/**
 * Hook to fetch and cache the current user profile.
 *
 * `isLoading` is SWR's standard "no data yet". A 401 surfaces as `error`
 * (after the api interceptor finished its single retry), at which point
 * `isAuthenticated` becomes `false`. Consumers should NOT use this hook's
 * `isLoading` to gate auth-protected UI — use `useAuth().isAuthLoading`
 * which also waits for the very first profile attempt to settle.
 */
export function useUser() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<User>(
    USER_QUERY_KEY,
    authApi.getProfile,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      dedupingInterval: 5000,
    },
  );

  // "Settled" = SWR has finished its initial attempt (either data arrived or
  // an error was raised). This is what protected routes should wait for.
  const hasSettled = data !== undefined || error !== undefined;

  return {
    user: data ?? null,
    isLoading,
    isValidating,
    error,
    isAuthenticated: !!data && !error,
    hasSettled,
    mutate,
    refresh: () => mutate(),
  };
}

export { USER_QUERY_KEY };
