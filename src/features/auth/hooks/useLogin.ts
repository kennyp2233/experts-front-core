import { useState } from 'react';
import { mutate as swrMutate } from 'swr';
import { useMutation } from '../../../shared/hooks';
import { authApi } from '../api/auth.api';
import { USER_QUERY_KEY } from './useUser';
import type { LoginRequest, AuthResponse } from '../types/auth.types';

/**
 * Login hook. After a successful login the back has already set the
 * access/refresh cookies on the response, so we can immediately seed the
 * SWR cache for `/auth/profile`:
 *   - If the back returned the user inline (`response.user`), use it.
 *   - Otherwise, just trigger a revalidation — the cookie is in place,
 *     so a single fetch is enough; no exponential-backoff retry loop.
 *
 * The previous implementation looped up to 3 times with delays, which on
 * fast connections made login feel artificially slow (~400ms) and on slow
 * connections could time out into "half-authenticated" states.
 */
export function useLogin() {
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const { mutate: loginMutate, isLoading, error, reset } = useMutation<AuthResponse, [LoginRequest]>(
    authApi.login,
    {
      logContext: 'Login',
      onSuccess: async (response) => {
        if (response.requires2FA && response.tempToken) {
          setRequires2FA(true);
          setTempToken(response.tempToken);
          return;
        }

        if (response.user) {
          // Seed cache with the value the back already gave us — no extra request.
          await swrMutate(USER_QUERY_KEY, response.user, { revalidate: false });
        } else {
          // Defensive: cookies are set, fetch profile once.
          await swrMutate(USER_QUERY_KEY);
        }

        setRequires2FA(false);
        setTempToken(null);
      },
      onError: () => {
        setRequires2FA(false);
        setTempToken(null);
      },
    },
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
