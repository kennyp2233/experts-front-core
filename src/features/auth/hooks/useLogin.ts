import { useState } from 'react';
import { useMutation } from '../../../shared/hooks';
import { authApi } from '../api/auth.api';
import { retryProfileFetch } from '../../../shared/utils';
import { USER_QUERY_KEY } from './useUser';
import type { LoginRequest, AuthResponse } from '../types/auth.types';

/**
 * Hook for handling login with 2FA support
 *
 * @example
 * ```tsx
 * const { login, isLoading, error, requires2FA, tempToken } = useLogin();
 *
 * const handleLogin = async () => {
 *   try {
 *     await login({ username, password });
 *     // If requires2FA is true, show 2FA verification screen
 *   } catch (err) {
 *     // Handle error
 *   }
 * };
 * ```
 */
export function useLogin() {
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const { mutate: loginMutate, isLoading, error, reset } = useMutation<AuthResponse, [LoginRequest]>(
    authApi.login,
    {
      invalidateKeys: [USER_QUERY_KEY],
      logContext: 'Login',
      onSuccess: async (response) => {
        // Check if 2FA is required
        if (response.requires2FA && response.tempToken) {
          setRequires2FA(true);
          setTempToken(response.tempToken);
          return;
        }

        // Normal login - wait for profile to be available
        await retryProfileFetch(() => authApi.getProfile(), 3);
        setRequires2FA(false);
        setTempToken(null);
      },
      onError: () => {
        setRequires2FA(false);
        setTempToken(null);
      },
    }
  );

  const login = async (credentials: LoginRequest) => {
    return loginMutate(credentials);
  };

  const resetLogin = () => {
    setRequires2FA(false);
    setTempToken(null);
    reset();
  };

  return {
    login,
    isLoading,
    error,
    requires2FA,
    tempToken,
    reset: resetLogin,
  };
}
