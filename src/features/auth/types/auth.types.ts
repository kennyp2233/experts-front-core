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
export interface Enable2FARequest {
  token: string; // 6-digit TOTP code
}

export interface Enable2FAResponse {
  secret: string; // Base32 encoded secret for QR code
  qrCodeUrl: string; // Data URL for QR code image
  backupCodes?: string[]; // Optional backup codes
}

export interface Verify2FARequest {
  tempToken: string; // Temporary token from login
  token: string; // 6-digit TOTP code
  trustDevice?: boolean; // Whether to trust this device for 30 days
}

export interface Verify2FAResponse {
  user: User;
}

export interface TrustedDevice {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  deviceType: string;
  lastUsedAt: string;
  lastIpAddress?: string;
  expiresAt: string;
  createdAt: string;
}