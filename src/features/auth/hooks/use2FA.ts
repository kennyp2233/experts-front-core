import { useMutation } from '../../../shared/hooks';
import { authApi } from '../api/auth.api';
import { retryProfileFetch } from '../../../shared/utils';
import { USER_QUERY_KEY } from './useUser';
import type {
  Enable2FAResponse,
  Confirm2FARequest,
  Confirm2FAResponse,
  Verify2FARequest,
  Verify2FAResponse,
  Disable2FAResponse,
} from '../types/auth.types';

/**
 * Hook for 2FA enable operation
 * Generates QR code and secret for setting up 2FA
 *
 * @example
 * ```tsx
 * const { enable2FA, isLoading, data } = useEnable2FA();
 *
 * const handleEnable = async () => {
 *   const { qrCode, secret } = await enable2FA();
 *   // Show QR code to user
 * };
 * ```
 */
export function useEnable2FA() {
  const { mutate, isLoading, error, data, reset } = useMutation<Enable2FAResponse, []>(
    authApi.enable2FA,
    {
      logContext: '2FA Enable',
    }
  );

  return {
    enable2FA: mutate,
    isLoading,
    error,
    data,
    reset,
  };
}

/**
 * Hook for 2FA confirmation operation
 * Confirms 2FA setup with TOTP code from authenticator app
 *
 * @example
 * ```tsx
 * const { confirm2FA, isLoading } = useConfirm2FA();
 *
 * const handleConfirm = async () => {
 *   await confirm2FA({ token: '123456' });
 *   // 2FA is now enabled
 * };
 * ```
 */
export function useConfirm2FA() {
  const { mutate, isLoading, error, reset } = useMutation<Confirm2FAResponse, [Confirm2FARequest]>(
    authApi.confirm2FA,
    {
      invalidateKeys: [USER_QUERY_KEY],
      logContext: '2FA Confirm',
      onSuccess: async () => {
        // Refresh profile to get updated twoFactorEnabled status
        await retryProfileFetch(() => authApi.getProfile(), 3);
      },
    }
  );

  return {
    confirm2FA: mutate,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook for 2FA verification during login
 * Verifies TOTP code and completes login if valid
 *
 * @example
 * ```tsx
 * const { verify2FA, isLoading } = useVerify2FA();
 *
 * const handleVerify = async () => {
 *   await verify2FA({
 *     tempToken: token,
 *     token: '123456',
 *     trustDevice: true
 *   });
 *   // User is now logged in
 * };
 * ```
 */
export function useVerify2FA() {
  const { mutate, isLoading, error, reset } = useMutation<Verify2FAResponse, [Verify2FARequest]>(
    authApi.verify2FA,
    {
      invalidateKeys: [USER_QUERY_KEY],
      logContext: '2FA Verify',
      onSuccess: async () => {
        // Wait for profile to be available after 2FA verification
        await retryProfileFetch(() => authApi.getProfile(), 3);
      },
    }
  );

  return {
    verify2FA: mutate,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook for 2FA disable operation
 * Disables 2FA for the current user
 *
 * @example
 * ```tsx
 * const { disable2FA, isLoading } = useDisable2FA();
 *
 * const handleDisable = async () => {
 *   await disable2FA();
 *   // 2FA is now disabled
 * };
 * ```
 */
export function useDisable2FA() {
  const { mutate, isLoading, error, reset } = useMutation<Disable2FAResponse, []>(
    authApi.disable2FA,
    {
      invalidateKeys: [USER_QUERY_KEY],
      logContext: '2FA Disable',
      onSuccess: async () => {
        // Refresh profile to get updated twoFactorEnabled status
        await retryProfileFetch(() => authApi.getProfile(), 3);
      },
    }
  );

  return {
    disable2FA: mutate,
    isLoading,
    error,
    reset,
  };
}

/**
 * Combined hook that provides all 2FA operations
 * Use this for convenience when you need multiple 2FA operations in one component
 *
 * @example
 * ```tsx
 * const {
 *   enable2FA,
 *   confirm2FA,
 *   verify2FA,
 *   disable2FA,
 *   isLoading
 * } = use2FA();
 * ```
 */
export function use2FA() {
  const enable = useEnable2FA();
  const confirm = useConfirm2FA();
  const verify = useVerify2FA();
  const disable = useDisable2FA();

  return {
    // Enable 2FA
    enable2FA: enable.enable2FA,
    enableLoading: enable.isLoading,
    enableError: enable.error,
    enableData: enable.data,
    resetEnable: enable.reset,

    // Confirm 2FA
    confirm2FA: confirm.confirm2FA,
    confirmLoading: confirm.isLoading,
    confirmError: confirm.error,
    resetConfirm: confirm.reset,

    // Verify 2FA
    verify2FA: verify.verify2FA,
    verifyLoading: verify.isLoading,
    verifyError: verify.error,
    resetVerify: verify.reset,

    // Disable 2FA
    disable2FA: disable.disable2FA,
    disableLoading: disable.isLoading,
    disableError: disable.error,
    resetDisable: disable.reset,

    // Combined loading state
    isLoading: enable.isLoading || confirm.isLoading || verify.isLoading || disable.isLoading,
  };
}
