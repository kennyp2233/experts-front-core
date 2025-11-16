export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
  // 2FA fields (optional - only present when 2FA is required)
  requires2FA?: boolean;
  tempToken?: string; // Temporary token for 2FA verification
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  twoFactorEnabled?: boolean;
}

// 2FA specific types
export interface Enable2FAResponse {
  secret: string; // Base32 encoded secret
  qrCode: string; // Data URL for QR code image
  message: string;
}

export interface Confirm2FARequest {
  token: string; // 6-digit TOTP code to confirm setup
}

export interface Confirm2FAResponse {
  success: boolean;
  message: string;
}

export interface Verify2FARequest {
  tempToken: string; // Temporary token from login
  token: string; // 6-digit TOTP code
  trustDevice?: boolean; // Whether to trust this device for 30 days
}

export interface Verify2FAResponse {
  user: User;
}

export interface Disable2FAResponse {
  success: boolean;
  message: string;
}