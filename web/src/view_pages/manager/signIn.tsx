// pages/signIn.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../config/api";
import { Eye, EyeOff, Lock, Mail, Chrome, Github, Apple, CheckCircle, Users, BarChart3, ArrowLeft } from 'lucide-react';
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

    const response = await fetch(`${API_BASE_URL}/api/user/login/`, {
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
    <div className="min-h-screen bg-white flex">
      {/* Left Section - Company Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a5f7a] via-[#2c7a9e] to-[#57a8c9] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#57a8c9] rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12">
          
          {/* Back Button & Logo & Brand */}
          <div>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors border border-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center overflow-hidden">
                <img src={logo} alt="Company Logo" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Crew Manager</h1>
                <p className="text-[#a5d5e8] text-sm">Project Management Platform</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
                Secure Access to<br />Your Enterprise Tools
              </h2>
              <p className="text-[#c9e4f0] text-lg leading-relaxed">
                Connect with your team, manage projects efficiently, and drive business success with our comprehensive enterprise platform.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Project Reliability</h3>
                    <p className="text-[#c9e4f0] text-sm">Ensure smooth and consistent project performance with robust uptime and real-time monitoring.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Team Collaboration</h3>
                    <p className="text-[#c9e4f0] text-sm">Real-time collaboration tools for seamless team coordination</p>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Advanced Analytics</h3>
                    <p className="text-[#c9e4f0] text-sm">Comprehensive insights and reporting for data-driven decisions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[#a5d5e8] text-sm">
            <p>© 2025 My Crew Manager. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Terms</button>
              <button className="hover:text-white transition-colors">Support</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">Access your enterprise account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                {formData.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                )}
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 text-[#2c7a9e] focus:ring-[#2c7a9e] border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  Accept Terms & Conditions
                </label>
              </div>
              <button
                onClick={() => navigate("/forgot-password")}
                type="button"
                className="text-sm font-semibold text-[#1a5f7a] hover:text-[#2c7a9e]"
              >
                Forgot password?
              </button>
            </div>

            {/* Error/Success Message */}
            {message && (
              <div className={`rounded-lg p-4 ${
                message.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-green-50 border border-green-200 text-green-800'
              }`}>
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-50 text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
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
                  className="flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] disabled:opacity-50 transition-colors"
                >
                  {socialLoading === provider.name ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#2c7a9e] rounded-full animate-spin"></div>
                  ) : (
                    <provider.icon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="font-semibold text-[#1a5f7a] hover:text-[#2c7a9e]"
                  disabled={isLoading}
                >
                  Sign up.
                </button>
              </p>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact{' '}
              <a href="mailto:support@company.com" className="text-[#1a5f7a] hover:text-[#2c7a9e] font-medium">
                mycrewmanager@company.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}