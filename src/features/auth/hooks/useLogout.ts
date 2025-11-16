import { useMutation } from '../../../shared/hooks';
import { authApi } from '../api/auth.api';
import { USER_QUERY_KEY } from './useUser';

/**
 * Hook for handling user logout
 *
 * @example
 * ```tsx
 * const { logout, isLoading } = useLogout();
 *
 * <Button onClick={logout} disabled={isLoading}>
 *   Logout
 * </Button>
 * ```
 */
export function useLogout() {
  const { mutate: logoutMutate, isLoading, error } = useMutation<void, []>(
    authApi.logout,
    {
      invalidateKeys: [
        USER_QUERY_KEY,
        // Clear all SWR cache on logout
        () => true,
      ],
      logContext: 'Logout',
      logErrors: false, // Don't log logout errors
    }
  );

  const logout = async () => {
    try {
      await logoutMutate();
    } catch (err) {
      // Ignore errors - clear state anyway
    }
  };

  return {
    logout,
    isLoading,
    error,
  };
}
