// Re-export all auth hooks
export { useUser, USER_QUERY_KEY } from './useUser';
export { useLogin } from './useLogin';
export { useRegister } from './useRegister';
export { useLogout } from './useLogout';
export {
  use2FA,
  useEnable2FA,
  useConfirm2FA,
  useVerify2FA,
  useDisable2FA,
} from './use2FA';

// Re-export useAuth from the refactored hook file
export { useAuth, AuthProvider } from './useAuth.hook';
