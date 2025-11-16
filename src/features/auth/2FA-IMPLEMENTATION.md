# 2FA (Two-Factor Authentication) Implementation Guide

## Status: Frontend Ready ✅ | Backend Pending ⏳

The frontend is fully prepared to support 2FA authentication. The backend has the database schema and DTOs ready but the endpoints are not yet implemented.

---

## Frontend Implementation (COMPLETED)

### Types & Interfaces

All 2FA-related TypeScript interfaces are defined in `types/auth.types.ts`:

- **`Enable2FARequest`**: Request to enable 2FA with TOTP code
- **`Enable2FAResponse`**: Contains secret and QR code for authenticator setup
- **`Verify2FARequest`**: Verify TOTP code during login
- **`Verify2FAResponse`**: Authentication result after 2FA verification
- **`TrustedDevice`**: Device information for trusted device management
- **`User.twoFactorEnabled`**: Flag indicating if user has 2FA enabled
- **`AuthResponse.requires2FA`**: Flag from login indicating 2FA is required
- **`AuthResponse.tempToken`**: Temporary token for 2FA verification

### Service Methods

All 2FA service methods are implemented in `services/auth.service.ts`:

```typescript
// Enable 2FA for current user
enable2FA(): Promise<Enable2FAResponse>

// Confirm 2FA setup with TOTP code
confirm2FA(token: string): Promise<{ success: boolean }>

// Disable 2FA
disable2FA(token: string): Promise<{ success: boolean }>

// Verify 2FA during login
verify2FA(data: Verify2FARequest): Promise<Verify2FAResponse>

// Manage trusted devices
getTrustedDevices(): Promise<TrustedDevice[]>
revokeTrustedDevice(deviceId: string): Promise<{ success: boolean }>
```

### Auth Hook

The `useAuth` hook provides:

- **State**: `requires2FA`, `tempToken`
- **Methods**: `verify2FA`, `enable2FA`, `confirm2FA`, `disable2FA`, `getTrustedDevices`, `revokeTrustedDevice`

### Login Flow with 2FA

```typescript
// 1. User logs in
await login({ username, password });

// 2. Check if 2FA is required
if (requires2FA && tempToken) {
  // Show 2FA verification form
  // User enters TOTP code
  await verify2FA(totpCode, trustDevice);
}

// 3. User is authenticated
```

---

## Backend Implementation Required

### Database Schema (✅ Already in Prisma)

The Prisma schema at `/apps/core/prisma/usuarios/schema.prisma` already includes:

```prisma
model User {
  // ... existing fields
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  trustedDevices   TrustedDevice[]
}

model TrustedDevice {
  id             String   @id @default(cuid())
  userId         String
  fingerprint    String
  trustToken     String   @unique
  deviceName     String
  browser        String
  os             String
  deviceType     String
  lastUsedAt     DateTime @default(now())
  lastIpAddress  String?
  expiresAt      DateTime
  createdAt      DateTime @default(now())
}
```

### DTOs (✅ Already defined)

The DTOs are already created in `/apps/core/src/modules/auth/v1/dto/`:

- `enable-2fa.dto.ts` - Enable 2FA request
- `verify-2fa.dto.ts` - Verify 2FA during login

### Required Backend Endpoints

The following endpoints need to be implemented in the auth controller:

#### 1. Enable 2FA Setup
```typescript
POST /api/v1/auth/2fa/enable

Response:
{
  secret: string,        // Base32 encoded secret
  qrCodeUrl: string,     // Data URL for QR code
  backupCodes?: string[] // Optional backup codes
}
```

#### 2. Confirm 2FA Setup
```typescript
POST /api/v1/auth/2fa/confirm
Body: { token: string } // 6-digit TOTP code

Response:
{
  success: boolean
}
```

#### 3. Disable 2FA
```typescript
POST /api/v1/auth/2fa/disable
Body: { token: string } // 6-digit TOTP code for verification

Response:
{
  success: boolean
}
```

#### 4. Verify 2FA During Login
```typescript
POST /api/v1/auth/2fa/verify
Body: {
  tempToken: string,      // From login response
  token: string,          // 6-digit TOTP code
  trustDevice?: boolean   // Optional - trust for 30 days
}

Response:
{
  user: User
}

// Sets access_token and refresh_token cookies
```

#### 5. Update Login Endpoint Response

The existing `POST /api/v1/auth/login` should be updated to return:

```typescript
// When user has 2FA enabled:
{
  requires2FA: true,
  tempToken: "temporary_session_token"
}

// When user doesn't have 2FA:
{
  user: User
}
// + Sets cookies
```

#### 6. Trusted Devices Management
```typescript
GET /api/v1/auth/2fa/trusted-devices
Response: TrustedDevice[]

DELETE /api/v1/auth/2fa/trusted-devices/:id
Response: { success: boolean }
```

### Required NPM Packages

Install these packages in the backend:

```bash
npm install speakeasy qrcode
npm install --save-dev @types/speakeasy @types/qrcode
```

### Service Implementation Example

```typescript
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

// Generate secret for new 2FA setup
const secret = speakeasy.generateSecret({
  name: `ExpertsApp (${user.email})`,
  length: 32,
});

// Generate QR code
const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

// Verify TOTP token
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: userProvidedToken,
  window: 2, // Allow 2 time steps before/after
});
```

### Trusted Device Implementation

When `trustDevice: true` is sent during 2FA verification:

1. Generate device fingerprint from User-Agent, IP, etc.
2. Create a unique trust token
3. Store in `TrustedDevice` table with 30-day expiration
4. Set `trust_device_token` cookie (30 days, httpOnly)
5. On subsequent logins, check if device is trusted → skip 2FA

---

## Security Considerations

### Backend Must Implement:

1. **Rate Limiting**: Limit 2FA verification attempts (5 per minute per user)
2. **Temporary Tokens**:
   - Should expire after 5 minutes
   - Should be stored in Redis
   - Should be single-use (delete after verification)
3. **Backup Codes**: Generate 10 single-use backup codes on 2FA enable
4. **Device Fingerprinting**: Use User-Agent + IP for basic fingerprinting
5. **Audit Logging**: Log all 2FA events (enable, disable, failed verifications)

### Frontend Already Handles:

- Secure cookie storage (withCredentials: true)
- No token exposure to JavaScript
- Proper error handling and logging
- Clear separation of 2FA verification flow

---

## Testing Checklist

Once backend is implemented, test:

- [ ] Enable 2FA flow
  - [ ] Generate QR code
  - [ ] Verify with authenticator app
  - [ ] Store secret correctly
- [ ] Login with 2FA
  - [ ] Receive tempToken
  - [ ] Verify TOTP code
  - [ ] Receive auth cookies
- [ ] Trust device functionality
  - [ ] Trust device during verification
  - [ ] Skip 2FA on next login from same device
  - [ ] Untrust device manually
- [ ] Disable 2FA flow
  - [ ] Verify TOTP before disabling
  - [ ] Clear secret from database
- [ ] Security scenarios
  - [ ] Rate limiting on verification attempts
  - [ ] TempToken expiration
  - [ ] Invalid TOTP codes
  - [ ] Device trust expiration

---

## Migration Path

1. **Phase 1** (Current): Database schema is ready, frontend is ready
2. **Phase 2**: Implement backend endpoints
3. **Phase 3**: Create UI components for 2FA management in user settings
4. **Phase 4**: Add 2FA verification screen during login
5. **Phase 5**: Testing and security audit

---

## References

- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)
- [TOTP RFC 6238](https://tools.ietf.org/html/rfc6238)
- [OWASP 2FA Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
