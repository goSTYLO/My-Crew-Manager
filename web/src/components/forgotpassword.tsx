// pages/forgotPassword.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Shield, Users, BarChart3, CheckCircle } from 'lucide-react';
import logo from "./../assets/logo2.png";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Validate email domain
  const validateEmailDomain = (email: string): boolean => {
    const validDomains = [
      '@gmail.com',
      '@yahoo.com',
      '@outlook.com',
      '@hotmail.com',
      '@icloud.com',
      '@aol.com',
      '@protonmail.com',
      '@zoho.com',
      '@mail.com',
      '@yandex.com',
      '@phinmaed.com'
    ];
    
    const emailLower = email.toLowerCase();
    return validDomains.some(domain => emailLower.endsWith(domain));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Validate email domain
    if (value && !validateEmailDomain(value)) {
      setEmailError("Please use a valid email provider (e.g., Gmail, Yahoo, Outlook)");
    } else {
      setEmailError("");
    }
    
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setMessage({ text: 'Please enter your email address', type: 'error' });
      return;
    }

    if (!validateEmailDomain(email)) {
      setMessage({ text: 'Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log("🔄 Sending password reset request for:", email);

      // TODO: Replace with your actual API endpoint
      const response = await fetch("http://127.0.0.1:8000/api/user/forgot-password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("📡 Response status:", response.status);

      const contentType = response.headers.get("content-type");
      let data: any = null;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("📦 Response data:", data);
      } else {
        const textResponse = await response.text();
        console.error("❌ Non-JSON response:", textResponse);
      }

      if (response.ok) {
        console.log("✅ Password reset email sent successfully");
        setEmailSent(true);
        setMessage({ 
          text: 'Password reset instructions have been sent to your email!', 
          type: 'success' 
        });
      } else {
        console.error("❌ Password reset failed:", data);
        const errorMessage = data?.error || data?.detail || data?.message || "Failed to send reset email. Please try again.";
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error: any) {
      console.error("❌ Network or fetch error:", error);
      setMessage({ 
        text: error.message || "Could not reach server. Please check your connection.", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

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
                Account<br />Recovery
              </h2>
              <p className="text-[#c9e4f0] text-lg leading-relaxed">
                Don't worry! It happens. Enter your email address and we'll send you instructions to reset your password securely.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Secure Process</h3>
                    <p className="text-[#c9e4f0] text-sm">Your password reset link is encrypted and expires after 24 hours for your security</p>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Quick Recovery</h3>
                    <p className="text-[#c9e4f0] text-sm">Get back to your team and projects in just a few simple steps</p>
                  </div>
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">24/7 Support</h3>
                    <p className="text-[#c9e4f0] text-sm">Our support team is always available to help you regain access</p>
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

      {/* Right Section - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => navigate("/signin")}
            className="flex items-center gap-2 text-[#1a5f7a] hover:text-[#2c7a9e] font-semibold mb-8 transition-colors"
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Sign In
          </button>

          {!emailSent ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                <p className="text-gray-600">No worries, we'll send you reset instructions</p>
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
                      type="email"
                      name="email"
                      value={email}
                      onChange={handleInputChange}
                      className={`block w-full pl-11 pr-4 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all ${
                        emailError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email"
                      required
                      disabled={loading}
                    />
                  </div>
                  {emailError && (
                    <p className="mt-2 text-sm text-red-600">{emailError}</p>
                  )}
                  {email && !emailError && (
                    <p className="mt-2 text-sm text-green-600">✓ Valid email provider</p>
                  )}
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
                  disabled={loading || !email || !!emailError}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </button>

                {/* Additional Help */}
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => navigate("/signin")}
                      className="font-semibold text-[#1a5f7a] hover:text-[#2c7a9e]"
                      disabled={loading}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                <p className="text-gray-600 mb-6">
                  We've sent password reset instructions to
                </p>
                <p className="text-[#1a5f7a] font-semibold mb-8">{email}</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setMessage(null);
                    }}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] transition-colors"
                  >
                    Resend Email
                  </button>

                  <button
                    onClick={() => navigate("/signin")}
                    className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact{' '}
              <a href="mailto:mycrewmanager@company.com" className="text-[#1a5f7a] hover:text-[#2c7a9e] font-medium">
                mycrewmanager@company.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}