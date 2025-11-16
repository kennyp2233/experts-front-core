import useSWR from 'swr';
import { authApi } from '../api/auth.api';
import type { User } from '../types/auth.types';

const USER_QUERY_KEY = '/auth/profile';

/**
 * Hook to fetch and cache the current user profile
 * Uses SWR for automatic caching, revalidation, and deduplication
 *
 * @example
 * ```tsx
 * const { user, isLoading, error, mutate } = useUser();
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * return <div>Hello, {user?.username}</div>;
 * ```
 */
export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<User>(
    USER_QUERY_KEY,
    authApi.getProfile,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: false,
      onError: (err) => {
        // Silently fail - 401 errors are expected when not authenticated
        // The API interceptor handles redirect to login
      },
    }
  );

  return {
    user: data ?? null,
    isLoading,
    error,
    isAuthenticated: !!data && !error,
    mutate, // For manual revalidation
    refresh: () => mutate(), // Alias for better semantics
  };
}

export { USER_QUERY_KEY };
