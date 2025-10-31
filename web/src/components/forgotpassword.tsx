// pages/forgotPassword.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Shield, Users, BarChart3, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import logo from "./../assets/logo2.png";
import { API_BASE_URL } from "../config/api";

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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

  // Validate password
  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validatePasswordMatch = (): boolean => {
    return newPassword === confirmPassword && newPassword.length > 0;
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !validateEmailDomain(value)) {
      setEmailError("Please use a valid email provider (e.g., Gmail, Yahoo, Outlook)");
    } else {
      setEmailError("");
    }
    
    if (message) setMessage(null);
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMessage({ text: 'Please enter your email address', type: 'error' });
      return;
    }

    if (!validateEmailDomain(email)) {
      setMessage({ text: 'Please use a valid email provider', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log("🔄 Requesting OTP for:", email);

      const response = await fetch(`${API_BASE_URL}/user/email/request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("📡 Response status:", response.status);

      if (response.status === 204 || response.ok) {
        console.log("✅ OTP sent successfully");
        setStep('otp');
        setResendCooldown(60); // 60 second cooldown
        setMessage({ 
          text: 'Verification code sent! Check your email.', 
          type: 'success' 
        });
      } else {
        const data = await response.json();
        console.error("❌ OTP request failed:", data);
        const errorMessage = data?.detail || data?.error || "Failed to send verification code. Please try again.";
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error: any) {
      console.error("❌ Network error:", error);
      setMessage({ 
        text: "Could not reach server. Please check your connection.", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/user/email/request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.status === 204 || response.ok) {
        setResendCooldown(60);
        setMessage({ 
          text: 'New verification code sent!', 
          type: 'success' 
        });
      } else {
        const data = await response.json();
        setMessage({ text: data?.detail || "Failed to resend code.", type: 'error' });
      }
    } catch (error) {
      setMessage({ text: "Could not resend code.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setMessage({ text: 'Please enter the 6-digit verification code', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log("🔄 Verifying OTP for:", email);

      const response = await fetch(`${API_BASE_URL}/user/email/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email, 
          code: otp 
        }),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ OTP verified successfully");
        setStep('password');
        setMessage({ 
          text: 'Code verified! Now set your new password.', 
          type: 'success' 
        });
      } else {
        const data = await response.json();
        console.error("❌ OTP verification failed:", data);
        const errorMessage = data?.detail || "Invalid or expired code. Please try again.";
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error: any) {
      console.error("❌ Network error:", error);
      setMessage({ 
        text: "Could not verify code. Please try again.", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setMessage({ text: 'Please enter a new password', type: 'error' });
      return;
    }

    if (!validatePassword(newPassword)) {
      setMessage({ text: 'Password must be at least 8 characters long', type: 'error' });
      return;
    }

    if (!validatePasswordMatch()) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log("🔄 Resetting password for:", email);
      const response = await fetch(`${API_BASE_URL}/user/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          code: otp,
          password: newPassword 
        }),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        console.log("✅ Password reset successfully");
        setStep('success');
        setMessage({ 
          text: 'Password reset successfully!', 
          type: 'success' 
        });
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 5000);
      } else {
        const data = await response.json();
        console.error("❌ Password reset failed:", data);
        const errorMessage = data?.detail || data?.error || "Failed to reset password. Please try again.";
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error: any) {
      console.error("❌ Network error:", error);
      setMessage({ 
        text: "Could not reset password. Please try again.", 
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

          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
                Account<br />Recovery
              </h2>
              <p className="text-[#c9e4f0] text-lg leading-relaxed">
                Don't worry! We'll send you a verification code to reset your password securely.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Secure Process</h3>
                    <p className="text-[#c9e4f0] text-sm">Your verification code expires in 10 minutes and is single-use only</p>
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

      {/* Right Section - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={() => step === 'email' ? navigate("/signin") : setStep('email')}
            className="flex items-center gap-2 text-[#1a5f7a] hover:text-[#2c7a9e] font-semibold mb-8 transition-colors"
            disabled={loading}
          >
            <ArrowLeft className="w-5 h-5" />
            {step === 'email' ? 'Back to Sign In' : 'Back'}
          </button>

          {/* Step 1: Email Input */}
          {step === 'email' && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                <p className="text-gray-600">Enter your email to receive a verification code</p>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-5">
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
                      value={email}
                      onChange={handleEmailInputChange}
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

                {message && (
                  <div className={`rounded-lg p-4 ${
                    message.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-green-50 border border-green-200 text-green-800'
                  }`}>
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}

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
                    'Send Verification Code'
                  )}
                </button>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => navigate("/signin")}
                      className="font-semibold text-[#1a5f7a] hover:text-[#2c7a9e]"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter Verification Code</h2>
                <p className="text-gray-600">
                  We sent a 6-digit code to <span className="font-semibold text-gray-900">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtp(value);
                      if (message) setMessage(null);
                    }}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    Code expires in 10 minutes
                  </p>
                </div>

                {message && (
                  <div className={`rounded-lg p-4 ${
                    message.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-green-50 border border-green-200 text-green-800'
                  }`}>
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={resendCooldown > 0 || loading}
                      className="font-semibold text-[#1a5f7a] hover:text-[#2c7a9e] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 'password' && (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
                <p className="text-gray-600">Choose a strong password for your account</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (message) setMessage(null);
                      }}
                      className={`block w-full pl-11 pr-11 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all ${
                        newPassword && !validatePassword(newPassword) ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter new password (min 8 characters)"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {newPassword && !validatePassword(newPassword) && (
                    <p className="mt-2 text-sm text-red-600">Password must be at least 8 characters long</p>
                  )}
                  {newPassword && validatePassword(newPassword) && (
                    <p className="mt-2 text-sm text-green-600">✓ Password meets requirements</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (message) setMessage(null);
                      }}
                      className={`block w-full pl-11 pr-11 py-3 border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all ${
                        confirmPassword && !validatePasswordMatch() ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your new password"
                      required
                      disabled={loading}
                    />
                  </div>
                  {confirmPassword && !validatePasswordMatch() && (
                    <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                  )}
                  {confirmPassword && validatePasswordMatch() && (
                    <p className="mt-2 text-sm text-green-600">✓ Passwords match</p>
                  )}
                </div>

                {message && (
                  <div className={`rounded-lg p-4 ${
                    message.type === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-green-50 border border-green-200 text-green-800'
                  }`}>
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !newPassword || !validatePassword(newPassword) || !validatePasswordMatch()}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resetting...</span>
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-4">
                Your password has been successfully reset for
              </p>
              <p className="text-[#1a5f7a] font-semibold mb-8">{email}</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>Success!</strong> You can now sign in with your new password. Redirecting automatically...
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/signin")}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] transition-colors"
                >
                  Go to Sign In
                </button>

                <button
                  onClick={() => {
                    setStep('email');
                    setMessage(null);
                    setEmail('');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] transition-colors"
                >
                  Reset Another Password
                </button>
              </div>
            </div>
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