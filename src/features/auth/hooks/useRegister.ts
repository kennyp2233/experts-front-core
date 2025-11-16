import { useMutation } from '../../../shared/hooks';
import { authApi } from '../api/auth.api';
import { retryProfileFetch } from '../../../shared/utils';
import { USER_QUERY_KEY } from './useUser';
import type { RegisterRequest, AuthResponse } from '../types/auth.types';

/**
 * Hook for handling user registration
 *
 * @example
 * ```tsx
 * const { register, isLoading, error } = useRegister();
 *
 * const handleRegister = async () => {
 *   try {
 *     await register({ username, email, password, firstName, lastName });
 *     // User is registered and authenticated
 *   } catch (err) {
 *     // Handle error
 *   }
 * };
 * ```
 */
export function useRegister() {
  const { mutate: registerMutate, isLoading, error, reset } = useMutation<AuthResponse, [RegisterRequest]>(
    authApi.register,
    {
      invalidateKeys: [USER_QUERY_KEY],
      logContext: 'Register',
      onSuccess: async () => {
        // Wait for profile to be available after registration
        await retryProfileFetch(() => authApi.getProfile(), 3);
      },
    }
  );

  const register = async (userData: RegisterRequest) => {
    return registerMutate(userData);
  };

  return {
    register,
    isLoading,
    error,
    reset,
  };
}
