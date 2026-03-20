// controllers/LoginController.ts
import { API_BASE_URL } from "./../config/api";
import { type User, UserModel } from "../services/UserModel";
import { TwoFactorService } from "./TwoFactorService";
import { TokenManager } from "./TokenManager";

export class LoginController {
  static async login(user: User, rememberMe: boolean = false): Promise<{ 
    success: boolean; 
    message: string; 
    redirect: string;
    requires2FA?: boolean;
    tempToken?: string;
    concurrentSession?: boolean;
  }> {
    const validation = UserModel.validateUser(user);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(", "));
    }

    const normalizedEmail = user.email.toLowerCase().trim();

    const response = await fetch(`${API_BASE_URL}/user/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // Include cookies in request
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        remember_me: rememberMe
      }),
    });

    const contentType = response.headers.get("content-type");
    let data: any = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      console.error("❌ Non-JSON response:", textResponse);
      throw new Error(textResponse || "Login failed");
    }

    if (!response.ok) {
      console.error("❌ Login failed:", data);
      throw new Error(data.error || data.detail || data.message || "Invalid credentials");
    }

    // Check if 2FA is required
    if (data.requires_2fa && data.temp_token) {
      // Store rememberMe temporarily in sessionStorage for 2FA verification
      if (rememberMe) {
        sessionStorage.setItem('pending_remember_me', 'true');
      }
      return {
        success: true,
        requires2FA: true,
        tempToken: data.temp_token,
        message: data.message || "Please enter your 2FA code",
        redirect: "", // Will be set after 2FA verification
      };
    }

    const userEmail = data.email || normalizedEmail;

    if (data.token) {
      TokenManager.setToken(data.token, userEmail, true); // Force register on login
    } else if (data.access) {
      TokenManager.setToken(data.access, userEmail, true); // Force register on login
    }

    if (data.refresh) {
      sessionStorage.setItem("refresh", data.refresh);
    }

    // Store user data via TokenManager
    TokenManager.setUserData({
      name: data.name,
      email: data.email,
      role: data.role,
    });

    let redirectPath = "/projects-user";

    if (data.role) {
      const rawRole = String(data.role);
      const normalizedRole = rawRole.trim().replace(/\s+/g, ' ');
      const lowerRole = normalizedRole.toLowerCase();

      const isProjectManager =
        normalizedRole === "Project Manager" ||
        lowerRole === "project manager" ||
        (lowerRole.includes("project") && lowerRole.includes("manager")) ||
        lowerRole === "projectmanager" ||
        lowerRole === "pm";

      const isDeveloper =
        normalizedRole === "Developer" ||
        lowerRole === "developer" ||
        lowerRole === "user";

      if (isProjectManager) {
        redirectPath = "/main-projects";
      } else if (isDeveloper) {
        redirectPath = "/projects-user";
      } else {
        redirectPath = "/projects-user";
      }
    } else {
      TokenManager.setUserData({ role: "Developer" });
      redirectPath = "/projects-user";
    }

    return { 
      success: true, 
      message: `Welcome back, ${data.name || 'User'}!`, 
      redirect: redirectPath,
      requires2FA: false,
    };
  }

  /**
   * Verify 2FA code after initial login
   */
  static async verify2FA(tempToken: string, code: string, rememberMe: boolean = false): Promise<{ 
    success: boolean; 
    message: string; 
    redirect: string;
  }> {
    // Check if rememberMe was stored during login
    const pendingRememberMe = sessionStorage.getItem('pending_remember_me') === 'true';
    const shouldRememberMe = rememberMe || pendingRememberMe;
    if (pendingRememberMe) {
      sessionStorage.removeItem('pending_remember_me');
    }

    const data = await TwoFactorService.verify2FALogin(tempToken, code, shouldRememberMe);

    // Save authentication tokens via TokenManager
    const userEmail = data.email || TokenManager.getEmail() || '';
    if (data.token) {
      TokenManager.setToken(data.token, userEmail, true); // Force register on 2FA login
    }

    // Store user data via TokenManager
    TokenManager.setUserData({
      name: data.name,
      email: data.email,
      role: data.role,
    });

    // Determine redirect path based on role
    let redirectPath = "/projects-user";
    if (data.role) {
      const normalizedRole = String(data.role).trim().replace(/\s+/g, ' ');
      const lowerRole = normalizedRole.toLowerCase();
      
      // Role already stored by TokenManager.setUserData above

      const isProjectManager = 
        normalizedRole === "Project Manager" ||
        lowerRole === "project manager" ||
        (lowerRole.includes("project") && lowerRole.includes("manager")) ||
        lowerRole === "projectmanager" ||
        lowerRole === "pm";

      if (isProjectManager) {
        redirectPath = "/main-projects";
      } else {
        redirectPath = "/projects-user";
      }
    } else {
      TokenManager.setUserData({ role: "Developer" });
    }

    return {
      success: true,
      message: `Welcome back, ${data.name || 'User'}!`,
      redirect: redirectPath,
    };
  }

  /**
   * Refresh access token using refresh token from cookie
   */
  static async refreshAccessToken(): Promise<{ 
    success: boolean; 
    token?: string;
    user?: any;
    message?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/user/refresh-token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Include cookies (refresh token is in HTTP-only cookie)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.error || "Token refresh failed"
        };
      }

      const data = await response.json();

      // Store new access token via TokenManager
      if (data.token) {
        TokenManager.setToken(data.token);
      }

      // Store user data via TokenManager
      TokenManager.setUserData({
        name: data.name,
        email: data.email,
        role: data.role,
      });

      return {
        success: true,
        token: data.token,
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Token refresh failed"
      };
    }
  }

  /**
   * Check for existing Remember Me session on app initialization
   */
  static async checkRememberMeSession(): Promise<{ 
    success: boolean; 
    authenticated: boolean;
    user?: any;
    message?: string;
  }> {
    try {
      if (TokenManager.hasToken()) {
        return {
          success: true,
          authenticated: true,
          user: {
            email: TokenManager.getEmail(),
            name: TokenManager.getUsername(),
            role: TokenManager.getUserRole(),
          },
        };
      }

      const refreshResult = await this.refreshAccessToken();

      if (refreshResult.success && refreshResult.token) {
        return {
          success: true,
          authenticated: true,
          user: refreshResult.user,
        };
      }
      return {
        success: true,
        authenticated: false,
        message: refreshResult.message || "No valid session found"
      };
    } catch (error) {
      return {
        success: false,
        authenticated: false,
        message: error instanceof Error ? error.message : "Session check failed"
      };
    }
  }
}