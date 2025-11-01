import { API_BASE_URL } from "../config/api";

export class EmailChangeService {
  /**
   * Step 1: Verify password before allowing email change
   */
  static async verifyPassword(password: string): Promise<{ success: boolean; message?: string }> {
    const token = sessionStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/email/change/verify-password/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        return { success: true };
      } else {
        // Handle non-JSON responses (like 404 HTML pages)
        let errorMessage = "Password verification failed";
        try {
          const data = await response.json();
          errorMessage = data.error || data.detail || errorMessage;
        } catch (jsonError) {
          // If response is not JSON (like HTML 404 page), use status text
          if (response.status === 404) {
            errorMessage = "Endpoint not found. Please ensure the server is running and the URL is correct.";
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error("Password verification error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  }

  /**
   * Step 2: Request email change - sends OTP to new email
   */
  static async requestEmailChange(newEmail: string): Promise<{ success: boolean; message?: string }> {
    const token = sessionStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/email/change/request/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_email: newEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: data.message || "Verification code sent" };
      } else {
        // Handle non-JSON responses
        let errorMessage = "Failed to send verification code";
        try {
          const data = await response.json();
          errorMessage = data.error || data.detail || errorMessage;
        } catch (jsonError) {
          if (response.status === 404) {
            errorMessage = "Endpoint not found. Please ensure the server is running and the URL is correct.";
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error("Email change request error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  }

  /**
   * Step 3: Verify OTP and complete email change
   */
  static async verifyEmailChange(newEmail: string, code: string): Promise<{ success: boolean; message?: string; new_email?: string }> {
    const token = sessionStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/email/change/verify/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_email: newEmail, code }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: data.message || "Email updated successfully", new_email: data.new_email };
      } else {
        // Handle non-JSON responses
        let errorMessage = "Verification failed";
        try {
          const data = await response.json();
          errorMessage = data.error || data.detail || errorMessage;
        } catch (jsonError) {
          if (response.status === 404) {
            errorMessage = "Endpoint not found. Please ensure the server is running and the URL is correct.";
          } else {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error("Email change verify error:", error);
      return { success: false, message: "Network error. Please try again." };
    }
  }
}

