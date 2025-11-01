// TwoFactorService.ts
import { API_BASE_URL } from "./../config/api";

export interface TwoFAStatus {
  enabled: boolean;
  qr_code?: string;
  secret?: string;
  provisioning_uri?: string;
}

export interface Enable2FAResponse {
  qr_code: string;
  secret: string;
  provisioning_uri: string;
  message: string;
}

export class TwoFactorService {
  /**
   * Get current 2FA status
   */
  static async get2FAStatus(): Promise<TwoFAStatus> {
    const token = sessionStorage.getItem("token") || sessionStorage.getItem("access");
    
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/user/2fa/status/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to get 2FA status" }));
      throw new Error(errorData.error || errorData.detail || "Failed to get 2FA status");
    }

    return await response.json();
  }

  /**
   * Enable 2FA and get QR code
   */
  static async enable2FA(): Promise<Enable2FAResponse> {
    const token = sessionStorage.getItem("token") || sessionStorage.getItem("access");
    
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/user/2fa/enable/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to enable 2FA" }));
      throw new Error(errorData.error || errorData.detail || "Failed to enable 2FA");
    }

    return await response.json();
  }

  /**
   * Verify 2FA setup code
   */
  static async verify2FASetup(code: string): Promise<{ message: string; enabled: boolean }> {
    const token = sessionStorage.getItem("token") || sessionStorage.getItem("access");
    
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/user/2fa/verify-setup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Invalid verification code" }));
      throw new Error(errorData.error || errorData.detail || "Invalid verification code");
    }

    return await response.json();
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(password: string): Promise<{ message: string; enabled: boolean }> {
    const token = sessionStorage.getItem("token") || sessionStorage.getItem("access");
    
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/user/2fa/disable/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Failed to disable 2FA" }));
      throw new Error(errorData.error || errorData.detail || "Failed to disable 2FA");
    }

    return await response.json();
  }

  /**
   * Verify 2FA code during login
   */
  static async verify2FALogin(tempToken: string, code: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    token: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/user/2fa/verify-login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        temp_token: tempToken,
        code: code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Invalid verification code" }));
      throw new Error(errorData.error || errorData.detail || "Invalid verification code");
    }

    return await response.json();
  }
}

