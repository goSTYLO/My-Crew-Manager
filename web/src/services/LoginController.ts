// controllers/LoginController.ts
import { API_BASE_URL } from "./../config/api";
import { type User, UserModel } from "../services/UserModel";
import { TwoFactorService } from "./TwoFactorService";

export class LoginController {
  static async login(user: User, rememberMe: boolean = false): Promise<{ 
    success: boolean; 
    message: string; 
    redirect: string;
    requires2FA?: boolean;
    tempToken?: string;
  }> {
    const validation = UserModel.validateUser(user);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(", "));
    }

    console.log("🔄 Sending login request with:", { email: user.email, rememberMe });

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

    console.log("📡 Response status:", response.status);

    const contentType = response.headers.get("content-type");
    let data: any = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
      console.log("📦 Full response data:", data);
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
      console.log("🔐 2FA required - returning temp token");
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

    // ✅ Save authentication tokens to sessionStorage
    console.log("🔍 Checking for tokens in response...");
    
    if (data.token) {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("access", data.token);
      console.log("✅ Token stored successfully (DRF Token Auth)");
    } else if (data.access) {
      sessionStorage.setItem("access", data.access);
      sessionStorage.setItem("token", data.access);
      console.log("✅ Access token stored successfully (JWT)");
    } else {
      console.warn("⚠️ No authentication token in response!");
    }

    if (data.refresh) {
      sessionStorage.setItem("refresh", data.refresh);
      console.log("✅ Refresh token stored successfully");
    }

    if (data.name) {
      sessionStorage.setItem("username", data.name);
      console.log("✅ Username stored:", data.name);
    }

    if (data.email) {
      sessionStorage.setItem("email", data.email);
      console.log("✅ Email stored:", data.email);
    }

    // 🎯 CRITICAL: Enhanced Role-based redirect logic
    console.log("\n🔍 ========== ROLE DETECTION DEBUG ==========");
    console.log("   📦 Raw role from backend:", JSON.stringify(data.role));
    console.log("   📏 Role type:", typeof data.role);
    console.log("   📐 Role length:", data.role ? data.role.length : 'N/A');
    console.log("   🔤 Role charCodes:", data.role ? Array.from(data.role).map((c: any) => c.charCodeAt(0)).join(',') : 'N/A');
    
    let redirectPath = "/projects-user"; // Default redirect for Developer

    if (data.role) {
      // Enhanced normalization: trim, remove special chars, standardize
      const rawRole = String(data.role);
      const normalizedRole = rawRole.trim().replace(/\s+/g, ' '); // Normalize spaces
      const lowerRole = normalizedRole.toLowerCase();
      
      console.log("   ✨ Normalized role:", JSON.stringify(normalizedRole));
      console.log("   🔽 Lowercase role:", JSON.stringify(lowerRole));
      
      // Store the normalized role
      sessionStorage.setItem("userRole", normalizedRole);
      console.log("   💾 Stored role in sessionStorage:", normalizedRole);

      // 🎯 Multiple matching strategies for maximum compatibility
      const isProjectManager = 
        normalizedRole === "Project Manager" ||
        lowerRole === "project manager" ||
        lowerRole.includes("project") && lowerRole.includes("manager") ||
        lowerRole === "projectmanager" ||
        lowerRole === "pm";

      const isDeveloper = 
        normalizedRole === "Developer" ||
        lowerRole === "developer" ||
        lowerRole === "user";

      console.log("   🔍 isProjectManager check:", isProjectManager);
      console.log("   🔍 isDeveloper check:", isDeveloper);

      // Determine redirect path
      if (isProjectManager) {
        redirectPath = "/main-projects";
        console.log("   ✅✅✅ MATCHED: Project Manager → /main-projects");
      } else if (isDeveloper) {
        redirectPath = "/projects-user";
        console.log("   ✅ MATCHED: Developer → /projects-user");
      } else {
        // Default to user for unknown roles
        redirectPath = "/projects-user";
        console.warn("   ⚠️ UNKNOWN ROLE - defaulting to /projects-user");
        console.warn("   ❓ Role was:", normalizedRole);
      }
    } else {
      console.warn("   ⚠️ No 'role' in backend response!");
      sessionStorage.setItem("userRole", "Developer");
      redirectPath = "/projects-user";
    }

    console.log("   🎯 FINAL REDIRECT PATH:", redirectPath);
    console.log("========================================\n");

    // Final verification log
    console.log("🔐 Final sessionStorage state:");
    console.log("   - access:", sessionStorage.getItem("access") ? "✓" : "✗");
    console.log("   - token:", sessionStorage.getItem("token") ? "✓" : "✗");
    console.log("   - refresh:", sessionStorage.getItem("refresh") ? "✓" : "✗");
    console.log("   - username:", sessionStorage.getItem("username") || "✗");
    console.log("   - email:", sessionStorage.getItem("email") || "✗");
    console.log("   - userRole:", sessionStorage.getItem("userRole") || "✗");

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
    console.log("🔐 Verifying 2FA code...");

    // Check if rememberMe was stored during login
    const pendingRememberMe = sessionStorage.getItem('pending_remember_me') === 'true';
    const shouldRememberMe = rememberMe || pendingRememberMe;
    if (pendingRememberMe) {
      sessionStorage.removeItem('pending_remember_me');
    }

    const data = await TwoFactorService.verify2FALogin(tempToken, code, shouldRememberMe);

    // Save authentication tokens to sessionStorage (same as normal login)
    if (data.token) {
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("access", data.token);
      console.log("✅ Token stored successfully");
    }

    if (data.name) {
      sessionStorage.setItem("username", data.name);
    }

    if (data.email) {
      sessionStorage.setItem("email", data.email);
    }

    // Determine redirect path based on role
    let redirectPath = "/projects-user";
    if (data.role) {
      const normalizedRole = String(data.role).trim().replace(/\s+/g, ' ');
      const lowerRole = normalizedRole.toLowerCase();
      
      sessionStorage.setItem("userRole", normalizedRole);

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
      sessionStorage.setItem("userRole", "Developer");
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
      console.log("🔄 Attempting to refresh access token...");
      
      const response = await fetch(`${API_BASE_URL}/user/refresh-token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // Include cookies (refresh token is in HTTP-only cookie)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn("⚠️ Token refresh failed:", errorData);
        return {
          success: false,
          message: errorData.error || "Token refresh failed"
        };
      }

      const data = await response.json();
      console.log("✅ Token refreshed successfully");

      // Store new access token
      if (data.token) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("access", data.token);
      }

      if (data.name) {
        sessionStorage.setItem("username", data.name);
      }

      if (data.email) {
        sessionStorage.setItem("email", data.email);
      }

      if (data.role) {
        const normalizedRole = String(data.role).trim().replace(/\s+/g, ' ');
        sessionStorage.setItem("userRole", normalizedRole);
      }

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
      console.error("❌ Token refresh error:", error);
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
      console.log("🔍 Checking for Remember Me session...");
      
      // Attempt to refresh token (cookie will be sent automatically)
      const refreshResult = await this.refreshAccessToken();
      
      if (refreshResult.success && refreshResult.token) {
        console.log("✅ Remember Me session found and restored");
        return {
          success: true,
          authenticated: true,
          user: refreshResult.user,
        };
      } else {
        console.log("ℹ️ No valid Remember Me session found");
        return {
          success: true,
          authenticated: false,
          message: refreshResult.message || "No valid session found"
        };
      }
    } catch (error) {
      console.error("❌ Error checking Remember Me session:", error);
      return {
        success: false,
        authenticated: false,
        message: error instanceof Error ? error.message : "Session check failed"
      };
    }
  }
}