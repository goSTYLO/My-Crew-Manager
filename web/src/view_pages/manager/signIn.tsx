// pages/signIn.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Chrome, Github, Apple } from 'lucide-react';
import logo from "../../assets/logo2.png";

// MODEL
interface User {
  email: string;
  password: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

class UserModel {
  static validateUser(user: User): ValidationResult {
    const errors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!user.email) errors.email = 'Email is required';
    else if (!emailRegex.test(user.email)) errors.email = 'Enter a valid email address';

    if (!user.password) errors.password = 'Password is required';
    else if (user.password.length < 6) errors.password = 'Password must be at least 6 characters long';

    return { isValid: Object.keys(errors).length === 0, errors };
  }
}

// CONTROLLER
class LoginController {
  static async login(user: User): Promise<{ success: boolean; message: string; redirect: string }> {
    const validation = UserModel.validateUser(user);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(", "));
    }

    console.log("🔄 Sending login request with:", { email: user.email });

    const response = await fetch("http://127.0.0.1:8000/api/user/login/", {
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

    // ✅ Save authentication tokens to localStorage
    console.log("🔍 Checking for tokens in response...");
    
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("access", data.token);
      console.log("✅ Token stored successfully (DRF Token Auth)");
    } else if (data.access) {
      localStorage.setItem("access", data.access);
      localStorage.setItem("token", data.access);
      console.log("✅ Access token stored successfully (JWT)");
    } else {
      console.warn("⚠️ No authentication token in response!");
    }

    if (data.refresh) {
      localStorage.setItem("refresh", data.refresh);
      console.log("✅ Refresh token stored successfully");
    }

    if (data.name) {
      localStorage.setItem("username", data.name);
      console.log("✅ Username stored:", data.name);
    }

    if (data.email) {
      localStorage.setItem("email", data.email);
      console.log("✅ Email stored:", data.email);
    }

    // 🎯 CRITICAL: Enhanced Role-based redirect logic
    console.log("\n🔍 ========== ROLE DETECTION DEBUG ==========");
    console.log("   📦 Raw role from backend:", JSON.stringify(data.role));
    console.log("   📏 Role type:", typeof data.role);
    console.log("   📐 Role length:", data.role ? data.role.length : 'N/A');
    console.log("   🔤 Role charCodes:", data.role ? Array.from(data.role).map((c: any) => c.charCodeAt(0)).join(',') : 'N/A');
    
    let redirectPath = "/user"; // Default redirect for Developer

    if (data.role) {
      // Enhanced normalization: trim, remove special chars, standardize
      const rawRole = String(data.role);
      const normalizedRole = rawRole.trim().replace(/\s+/g, ' '); // Normalize spaces
      const lowerRole = normalizedRole.toLowerCase();
      
      console.log("   ✨ Normalized role:", JSON.stringify(normalizedRole));
      console.log("   🔽 Lowercase role:", JSON.stringify(lowerRole));
      
      // Store the normalized role
      localStorage.setItem("userRole", normalizedRole);
      console.log("   💾 Stored role in localStorage:", normalizedRole);

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
        redirectPath = "/main";
        console.log("   ✅✅✅ MATCHED: Project Manager → /main");
      } else if (isDeveloper) {
        redirectPath = "/user";
        console.log("   ✅ MATCHED: Developer → /user");
      } else {
        // Default to user for unknown roles
        redirectPath = "/user";
        console.warn("   ⚠️ UNKNOWN ROLE - defaulting to /user");
        console.warn("   ❓ Role was:", normalizedRole);
      }
    } else {
      console.warn("   ⚠️ No 'role' in backend response!");
      localStorage.setItem("userRole", "Developer");
      redirectPath = "/user";
    }

    console.log("   🎯 FINAL REDIRECT PATH:", redirectPath);
    console.log("========================================\n");

    // Final verification log
    console.log("🔐 Final localStorage state:");
    console.log("   - access:", localStorage.getItem("access") ? "✓" : "✗");
    console.log("   - token:", localStorage.getItem("token") ? "✓" : "✗");
    console.log("   - refresh:", localStorage.getItem("refresh") ? "✓" : "✗");
    console.log("   - username:", localStorage.getItem("username") || "✗");
    console.log("   - email:", localStorage.getItem("email") || "✗");
    console.log("   - userRole:", localStorage.getItem("userRole") || "✗");

    return { 
      success: true, 
      message: `Welcome back, ${data.name || 'User'}!`, 
      redirect: redirectPath 
    };
  }
}

// VIEW
export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<User>({ email: '', password: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    const validation = UserModel.validateUser({ ...formData, [name]: value });
    setErrors(validation.errors);
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = UserModel.validateUser(formData);
    setErrors(validation.errors);

    if (!termsAccepted) {
      setMessage({ text: 'Please accept the Terms & Conditions', type: 'error' });
      return;
    }

    if (!validation.isValid) return;

    setIsLoading(true);
    setMessage(null);

    try {
      console.log("🚀 Starting login process...");
      const result = await LoginController.login(formData);
      console.log("✅ Login successful - redirect path:", result.redirect);
      setMessage({ text: result.message, type: 'success' });

      // Redirect after 1 second to show success message
      setTimeout(() => {
        console.log("🔀 Executing navigation to:", result.redirect);
        navigate(result.redirect, { replace: true });
      }, 1000);
    } catch (error) {
      console.error("❌ Login error:", error);
      setMessage({
        text: error instanceof Error ? error.message : 'An unexpected error occurred',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setSocialLoading(provider);
    setMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage({ text: `${provider} login successful! (Demo)`, type: 'success' });
    } catch {
      setMessage({ text: `${provider} login failed. Please try again.`, type: 'error' });
    } finally {
      setSocialLoading(null);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.email && formData.password && termsAccepted;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-25"></div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full h-full text-white space-y-6 p-12">
          <div className="w-64 h-64 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg overflow-hidden">
            <img src={logo} alt="Logo" className="w-70 h-70 object-contain mt-2 mr-1" />
          </div>
          <h2 className="text-4xl font-extrabold text-center">Welcome Back!</h2>
          <p className="text-lg text-center max-w-xs opacity-90">
            Access your account and continue your journey with us.
          </p>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600">Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {formData.password && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              )}
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                  Terms & Conditions
                </label>
              </div>
              <button type="button" className="text-sm text-blue-600 font-medium hover:underline">
                Forgot Password?
              </button>
            </div>

            {/* Error/Success Message */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>

            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">Or continue with</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Google', icon: Chrome },
                { name: 'GitHub', icon: Github },
                { name: 'Apple', icon: Apple }
              ].map((provider) => (
                <button
                  key={provider.name}
                  type="button"
                  onClick={() => handleSocialLogin(provider.name)}
                  disabled={socialLoading === provider.name || isLoading}
                  className="p-3 bg-white border border-gray-300 rounded-lg hover:scale-105 disabled:opacity-50 transition-transform"
                >
                  {socialLoading === provider.name ? (
                    <div className="animate-spin h-5 w-5 border-b-2 border-gray-400 mx-auto rounded-full"></div>
                  ) : (
                    <provider.icon className="w-5 h-5 text-gray-600 mx-auto" />
                  )}
                </button>
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-blue-600 font-medium hover:underline"
                  disabled={isLoading}
                >
                  Sign up for free
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}