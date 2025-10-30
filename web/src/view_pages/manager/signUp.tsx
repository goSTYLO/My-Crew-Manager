// pages/signUp.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { Mail, Lock, Eye, EyeOff, User, CheckCircle, Users, BarChart3, Check, X, ArrowLeft} from "lucide-react";
import logo from "../../assets/logo2.png";
import TermsAndConditionsModal from "../../components/terms&condition";
import TermsAcceptedModal from "../../components/termacceptedmodal";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Email verification states
  const [verificationStep, setVerificationStep] = useState<'signup' | 'verify'>('signup');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleTermsClose = () => {
    setIsModalOpen(false);
  };

  const handleTermsAccept = () => {
    setTermsAccepted(true);
    setIsModalOpen(false);
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const [formData, setFormData] = useState({
    role: "Project Manager",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [emailError, setEmailError] = useState("");

  const [passwordValidation, setPasswordValidation] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

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

  const validatePassword = (password: string) => {
    setPasswordValidation({
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      hasMinLength: password.length >= 6,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  
    if (name === "email") {
      if (value && !validateEmailDomain(value)) {
        setEmailError("Please use a valid email provider (e.g., Gmail, Yahoo, Outlook)");
        setErrors((prev) => ({
          ...prev,
          email: "Invalid email domain",
        }));
      } else {
        setEmailError("");
        setErrors((prev) => ({
          ...prev,
          email: "",
        }));
      }
    }
  
    if (name === "password") {
      validatePassword(value);
      if (!value) {
        setErrors((prev) => ({
          ...prev,
          password: "Password is required",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          password: "",
        }));
      }
    }
  
    if (message) setMessage(null);
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
    if (message) setMessage(null);
  };

  // Request verification code
  const requestVerificationCode = async () => {
    if (!validateEmailDomain(formData.email)) {
      setMessage({ text: "Please use a valid email provider", type: 'error' });
      return;
    }

    setLoading(true);
    setVerificationError('');

    try {
      const response = await fetch(`${API_BASE_URL}/user/email/request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.status === 204 || response.ok) {
        setVerificationStep('verify');
        setMessage({ text: "Verification code sent to your email!", type: 'success' });
        
        // Start cooldown timer
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setMessage({ text: "Failed to send verification code", type: 'error' });
      }
    } catch (error) {
      console.error("Verification request error:", error);
      setMessage({ text: "Could not send verification code", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Verify the code
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setVerificationError('');

    try {
      const response = await fetch(`${API_BASE_URL}/user/email/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: formData.email,
          code: verificationCode 
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setIsVerified(true);
        setMessage({ text: "Email verified successfully!", type: 'success' });
        
        // Proceed to create account after verification
        setTimeout(() => {
          handleSignup();
        }, 1000);
      } else {
        if (response.status === 429) {
          setVerificationError('Too many attempts. Please request a new code.');
        } else {
          setVerificationError(data.detail || 'Invalid or expired code');
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Actual signup after verification
  const handleSignup = async () => {
    const requestBody = {
      name: `${formData.firstname} ${formData.lastname}`,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    console.log("🚀 Starting signup process...");
    console.log("📤 Request body:", { ...requestBody, password: "***" });

    try {
      const response = await fetch(`${API_BASE_URL}/user/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
        throw new Error(textResponse || "Signup failed");
      }

      if (response.ok) {
        console.log("✅ Signup successful!");
        
        setMessage({ 
          text: `Account created successfully as ${formData.role}! Please sign in to continue.`, 
          type: 'success' 
        });
        
        console.log("📍 Redirecting to /signin page...");
        
        setTimeout(() => {
          navigate("/signin", { replace: true });
        }, 1500);
      } else {
        console.error("❌ Signup failed:", data);
        const errorMessage = data.error || data.detail || data.message || "Signup failed. Please try again.";
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error: any) {
      console.error("❌ Network or fetch error:", error);
      setMessage({ 
        text: error.message || "Could not reach backend. Check server.", 
        type: 'error' 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setMessage({ text: 'Please accept the Terms & Conditions', type: 'error' });
      return;
    }

    if (!validateEmailDomain(formData.email)) {
      setMessage({ text: "Please use a valid email provider", type: 'error' });
      return;
    }

    if (!passwordValidation.hasUppercase || !passwordValidation.hasLowercase || 
        !passwordValidation.hasNumber || !passwordValidation.hasSpecialChar || 
        !passwordValidation.hasMinLength) {
      setMessage({ text: "Password must meet all requirements", type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match!", type: 'error' });
      return;
    }

    // Request verification code
    await requestVerificationCode();
  };

  const ValidationItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-red-600'}`}>
      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  );

  const isPasswordValid = 
    passwordValidation.hasUppercase &&
    passwordValidation.hasLowercase &&
    passwordValidation.hasNumber &&
    passwordValidation.hasSpecialChar &&
    passwordValidation.hasMinLength;

  const doPasswordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  const isFormValid = 
    formData.firstname.trim() !== "" &&
    formData.lastname.trim() !== "" &&
    formData.email.trim() !== "" &&
    !emailError &&
    formData.password.trim() !== "" &&
    isPasswordValid &&
    formData.confirmPassword.trim() !== "" &&
    doPasswordsMatch &&
    termsAccepted;

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
                Join Our<br />Enterprise Platform
              </h2>
              <p className="text-[#c9e4f0] text-lg leading-relaxed">
                Get started with powerful project management tools and seamless team collaboration features designed for modern enterprises.
              </p>
            </div>

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

      {/* Right Section - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {verificationStep === 'signup' ? 'Create Account' : 'Verify Email'}
            </h2>
            <p className="text-gray-600">
              {verificationStep === 'signup' 
                ? 'Register for enterprise access' 
                : `Enter the code sent to ${formData.email}`}
            </p>
          </div>

          {verificationStep === 'signup' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Account Type</label>
                <div className="relative flex items-center bg-gray-200 rounded-lg p-1">
                  <div 
                    className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out ${
                      formData.role === "Developer" ? "left-1/2 ml-[-2px]" : "left-1"
                    }`}
                  />
                  
                  <button
                    type="button"
                    onClick={() => handleRoleToggle("Project Manager")}
                    disabled={loading}
                    className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors duration-300 ${
                      formData.role === "Project Manager"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Project Manager
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRoleToggle("Developer")}
                    disabled={loading}
                    className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-colors duration-300 ${
                      formData.role === "Developer"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Developer
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.role === "Project Manager" 
                    ? "Full access to dashboard and project management" 
                    : "Access to assigned tasks and team collaboration"}
                </p>
              </div>

              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstname" className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstname"
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                      placeholder="Enter your firstname"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastname" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastname"
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                      placeholder="Enter your lastname"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
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
                    value={formData.email}
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
                {formData.email && !emailError && (
                  <p className="mt-2 text-sm text-green-600">✓ Valid email provider</p>
                )}
              </div>

              {/* Password */}
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                    placeholder="Create a password"
                    required
                    disabled={loading}
                  />
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  )}
                </div>
                
                {formData.password && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg space-y-1">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                    <ValidationItem met={passwordValidation.hasMinLength} text="At least 6 characters" />
                    <ValidationItem met={passwordValidation.hasUppercase} text="One uppercase letter" />
                    <ValidationItem met={passwordValidation.hasLowercase} text="One lowercase letter" />
                    <ValidationItem met={passwordValidation.hasNumber} text="One number" />
                    <ValidationItem met={passwordValidation.hasSpecialChar} text="One special character (!@#$%^&*)" />
                  </div>
                )}
              </div>

              {/* Confirm Password */}
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
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="block w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                  {formData.confirmPassword && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  )}
                </div>
                {formData.confirmPassword && (
                  <p className={`mt-2 text-sm ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                    }}
                    className="h-4 w-4 text-[#2c7a9e] focus:ring-[#2c7a9e] border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                    I accept the{' '}
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-[#1a5f7a] hover:text-[#2c7a9e] font-medium underline"
                      disabled={loading}
                    >
                      Terms & Conditions
                    </button>
                  </label>
                </div>
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
                disabled={!isFormValid || loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending Code...</span>
                  </div>
                ) : (
                  'Continue to Verification'
                )}
              </button>

              {/* Sign In Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
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
          ) : (
            /* Verification Step */
            <div className="space-y-5">
              {/* Verification Code Input */}
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-semibold text-gray-700 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setVerificationError('');
                    }}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a9e] focus:border-transparent transition-all"
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading || isVerified}
                  />
                </div>
                {verificationError && (
                  <p className="mt-2 text-sm text-red-600">{verificationError}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Enter the 6-digit code sent to your email
                </p>
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

              {/* Verify Button */}
              <button
                onClick={verifyCode}
                disabled={verificationCode.length !== 6 || loading || isVerified}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#1a5f7a] hover:bg-[#2c7a9e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2c7a9e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isVerified ? 'Creating Account...' : 'Verifying...'}</span>
                  </div>
                ) : isVerified ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Verified</span>
                  </div>
                ) : (
                  'Verify Code'
                )}
              </button>

              {/* Resend Code */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={requestVerificationCode}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-[#1a5f7a] hover:text-[#2c7a9e] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 
                    ? `Resend code in ${resendCooldown}s` 
                    : 'Resend verification code'}
                </button>
              </div>

              {/* Back Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationStep('signup');
                    setVerificationCode('');
                    setVerificationError('');
                    setMessage(null);
                  }}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back to sign up
                </button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-[#1a5f7a] hover:text-[#2c7a9e] font-medium">
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="#" className="text-[#1a5f7a] hover:text-[#2c7a9e] font-medium">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={isModalOpen}
        onClose={handleTermsClose}
        onAccept={handleTermsAccept}
      />

      {/* Success Modal */}
      <TermsAcceptedModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
      />
    </div>
  );
}