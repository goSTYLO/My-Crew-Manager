// controllers/LoginController.ts
import { API_BASE_URL } from "./../config/api";
import { type User, UserModel } from "../services/UserModel";

export class LoginController {
  static async login(user: User): Promise<{ success: boolean; message: string; redirect: string }> {
    const validation = UserModel.validateUser(user);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(", "));
    }

    console.log("🔄 Sending login request with:", { email: user.email });

    const response = await fetch(`${API_BASE_URL}/user/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        password: user.password
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
      redirect: redirectPath 
    };
  }
}