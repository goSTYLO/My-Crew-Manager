# Two-Factor Authentication (2FA) Implementation Guide

This document outlines all the changes made to implement Two-Factor Authentication (2FA) using TOTP (Time-based One-Time Password) compatible with Microsoft Authenticator and other standard authenticator apps.

## Overview

The 2FA implementation adds an extra layer of security to user accounts. Users can enable 2FA in their security settings, and must provide a 6-digit verification code from their authenticator app during login when 2FA is enabled.

---

## Database Changes

### New Fields in User Model

The following fields were added to the `User` model in `backend/apps/users/models.py`:

- **`two_factor_enabled`** (BooleanField): Indicates if 2FA is enabled for the user (default: False)
- **`two_factor_secret`** (CharField, max_length=500): Stores the encrypted TOTP secret (nullable, blank)

### New Model: TwoFactorTempToken

A new model was created to manage temporary tokens during 2FA login verification:

- **`TwoFactorTempToken`**: Stores temporary tokens for pending 2FA verification
  - `user` (ForeignKey to User)
  - `token` (CharField, max_length=64, unique)
  - `created_at` (DateTimeField)
  - `expires_at` (DateTimeField)

---

## Required Commands

### 1. Install Backend Dependencies

```bash
cd backend
pip install pyotp qrcode[pil] cryptography
```

Or if using requirements.txt:

```bash
cd backend
pip install -r requirements.txt
```

**New dependencies added:**
- `pyotp>=2.9.0` - TOTP generation and verification
- `qrcode[pil]>=7.4.2` - QR code generation for setup
- `cryptography>=41.0.0` - Fernet encryption for secret storage

### 2. Create and Run Database Migrations

```bash
cd backend
python manage.py makemigrations users
python manage.py migrate
```

**Important:** The migration will:
- Add `two_factor_enabled` and `two_factor_secret` fields to the `user` table
- Create the `two_factor_temp_token` table for temporary login tokens

### 3. Frontend Dependencies (Already Added)

The frontend dependencies are already in `web/package.json`. If needed, install with:

```bash
cd web
npm install
```

---

## Backend API Endpoints

All 2FA endpoints are under `/api/user/2fa/`:

### 1. Get 2FA Status
- **Endpoint:** `GET /api/user/2fa/status/`
- **Auth:** Required (Token)
- **Description:** Returns current 2FA status. If disabled, includes QR code data for setup.
- **Response:**
  ```json
  {
    "enabled": false,
    "qr_code": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "provisioning_uri": "otpauth://totp/..."
  }
  ```

### 2. Enable 2FA
- **Endpoint:** `POST /api/user/2fa/enable/`
- **Auth:** Required (Token)
- **Description:** Generates a new 2FA secret and QR code for setup.
- **Response:**
  ```json
  {
    "qr_code": "data:image/png;base64,...",
    "secret": "JBSWY3DPEHPK3PXP",
    "provisioning_uri": "otpauth://totp/...",
    "message": "Scan the QR code with your authenticator app and verify with a code"
  }
  ```

### 3. Verify 2FA Setup
- **Endpoint:** `POST /api/user/2fa/verify-setup/`
- **Auth:** Required (Token)
- **Description:** Verifies the initial code from authenticator app to complete setup.
- **Request Body:**
  ```json
  {
    "code": "123456"
  }
  ```
- **Response:**
  ```json
  {
    "message": "2FA has been enabled successfully",
    "enabled": true
  }
  ```

### 4. Disable 2FA
- **Endpoint:** `POST /api/user/2fa/disable/`
- **Auth:** Required (Token)
- **Description:** Disables 2FA for the user (requires password confirmation).
- **Request Body:**
  ```json
  {
    "password": "user_password"
  }
  ```
- **Response:**
  ```json
  {
    "message": "2FA has been disabled successfully",
    "enabled": false
  }
  ```

### 5. Verify 2FA During Login
- **Endpoint:** `POST /api/user/2fa/verify-login/`
- **Auth:** Not required (uses temporary token)
- **Description:** Verifies 2FA code during login process.
- **Request Body:**
  ```json
  {
    "temp_token": "temporary_token_from_login",
    "code": "123456"
  }
  ```
- **Response:** (Same as normal login)
  ```json
  {
    "id": "1",
    "email": "user@example.com",
    "name": "User Name",
    "role": "Developer",
    "token": "auth_token_here"
  }
  ```

---

## Modified Login Flow

### Updated Login Endpoint

**Endpoint:** `POST /api/user/login/`

When a user with 2FA enabled logs in, the response changes:

**Normal Login (2FA disabled):**
```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "User Name",
  "role": "Developer",
  "token": "auth_token_here"
}
```

**2FA Required (2FA enabled):**
```json
{
  "requires_2fa": true,
  "temp_token": "temporary_token_for_verification",
  "message": "Please enter your 2FA code"
}
```

---

## Frontend Changes

### New Service: TwoFactorService

**File:** `web/src/services/TwoFactorService.ts`

Methods:
- `get2FAStatus()` - Get current 2FA status
- `enable2FA()` - Request QR code for setup
- `verify2FASetup(code)` - Verify initial setup code
- `disable2FA(password)` - Disable 2FA
- `verify2FALogin(tempToken, code)` - Verify code during login

### Updated Files

1. **`web/src/services/LoginController.ts`**
   - Added 2FA detection in `login()` method
   - New `verify2FA()` method for login verification

2. **`web/src/view_pages/manager/signIn.tsx`**
   - Added 2FA verification step UI
   - Conditional rendering based on `show2FAVerification` state
   - 6-digit code input with auto-formatting

3. **`web/src/view_pages/manager/settings_security.tsx`**
   - Full 2FA management UI
   - QR code display
   - Enable/disable functionality with password confirmation

---

## Security Implementation Details

### Secret Encryption

- 2FA secrets are encrypted using **Fernet** (symmetric encryption)
- Encryption key is derived from Django's `SECRET_KEY`
- Secrets are stored encrypted in the database
- Encryption/decryption handled by helper functions:
  - `_encrypt_secret(secret)` - Encrypts before storage
  - `_decrypt_secret(encrypted_secret)` - Decrypts for verification

### Temporary Token Management

- Temporary tokens expire after **5 minutes**
- Tokens are single-use (deleted after successful verification)
- Tokens are unique and indexed for fast lookup

### TOTP Configuration

- **Algorithm:** TOTP (RFC 6238)
- **Code length:** 6 digits
- **Time window:** 30 seconds
- **Compatible with:** Microsoft Authenticator, Google Authenticator, Authy, and other standard authenticator apps

---

## Testing the Implementation

### 1. Enable 2FA

1. Log in to your account
2. Navigate to Security Settings
3. Click "Enable 2FA"
4. Scan the QR code with Microsoft Authenticator (or any compatible app)
5. Enter the 6-digit code from your authenticator app
6. Click "Verify & Enable"

### 2. Login with 2FA

1. Log out
2. Log in with email and password
3. You should see the 2FA verification step
4. Enter the 6-digit code from your authenticator app
5. You should be logged in successfully

### 3. Disable 2FA

1. Navigate to Security Settings
2. Click "Disable 2FA"
3. Enter your password to confirm
4. 2FA should be disabled

### 4. Test Error Cases

- Try invalid verification codes
- Let temporary token expire (wait 5+ minutes)
- Try enabling 2FA when already enabled
- Try disabling 2FA with wrong password

---

## Troubleshooting

### Common Issues

1. **"2FA fields not found in database"**
   - Solution: Run migrations (`python manage.py makemigrations users && python manage.py migrate`)

2. **"value too long for type character varying(128)"**
   - Solution: Ensure the migration with max_length=500 has been applied

3. **QR code not displaying**
   - Check browser console for errors
   - Verify the backend is returning base64 QR code data
   - Ensure image tag is correctly rendering the data URI

4. **"Invalid verification code"**
   - Ensure time on server and device are synchronized
   - Check if the secret was properly saved in the database
   - Verify the authenticator app is using the correct account

5. **Temporary token errors**
   - Tokens expire after 5 minutes
   - Each token can only be used once
   - Start a new login if token expires

---

## Files Modified

### Backend

- `backend/apps/users/models.py` - Added 2FA fields and TwoFactorTempToken model
- `backend/apps/users/serializers.py` - Added 2FA serializers
- `backend/apps/users/views.py` - Added 2FA views and updated LoginView
- `backend/apps/users/urls.py` - Added 2FA routes
- `backend/apps/users/admin.py` - Registered TwoFactorTempToken in admin
- `backend/requirements.txt` - Added pyotp, qrcode, cryptography

### Frontend

- `web/src/services/TwoFactorService.ts` - New service file
- `web/src/services/LoginController.ts` - Updated for 2FA flow
- `web/src/view_pages/manager/signIn.tsx` - Added 2FA verification UI
- `web/src/view_pages/manager/settings_security.tsx` - Full 2FA management UI
- `web/package.json` - Dependencies already in place

---

## Migration Files

After running `makemigrations`, you should have:

- `backend/apps/users/migrations/XXXX_add_two_factor_fields.py` (or similar name)

This migration will:
1. Add `two_factor_enabled` boolean field
2. Add `two_factor_secret` char field (max_length=500)
3. Create `two_factor_temp_token` table

---

## Next Steps

1. **Run migrations** (if not done already)
2. **Test the implementation** following the testing guide above
3. **Monitor logs** for any errors during testing
4. **Update documentation** as needed for your team

---

## Additional Notes

- 2FA is optional - users can choose to enable or disable it
- The implementation follows TOTP standards (RFC 6238)
- Secrets are encrypted at rest using Fernet
- Temporary tokens provide secure intermediate step during login
- All endpoints include proper error handling and validation

---

**Last Updated:** Implementation completed with TOTP-based 2FA compatible with Microsoft Authenticator.

