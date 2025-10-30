// pages/SignIn.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Chrome, Github, Apple, CheckCircle, Users, BarChart3, ArrowLeft, ChevronDown, Trash2, User } from 'lucide-react';
import logo from "../../assets/logo2.png";

// Import separated logic
import type { User as UserType } from '../../services/UserModel';
import { LoginController } from '../../services/LoginController';
import { SavedAccountsManager, type SavedAccount } from '../../utils/SavedAccountsManager';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserType>({ email: '', password: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Load saved accounts on component mount
  useEffect(() => {
    const accounts = SavedAccountsManager.getAllAccounts();
    setSavedAccounts(accounts);
    
    if (accounts.length > 0) {
      const mostRecent = accounts[0];
      setFormData({
        email: mostRecent.email,
        password: mostRecent.rememberMe && mostRecent.encryptedPassword 
          ? SavedAccountsManager.decryptPassword(mostRecent.encryptedPassword) 
          : ''
      });
      setRememberMe(mostRecent.rememberMe);
      
      if (mostRecent.rememberMe && mostRecent.encryptedPassword) {
        console.log("✅ Auto-filled with saved credentials (Remember Me was enabled)");
      } else {
        console.log("📧 Auto-filled email only (Remember Me was not enabled)");
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors({});
    if (message) setMessage(null);
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  const handleSelectAccount = (account: SavedAccount) => {
    setFormData({
      email: account.email,
      password: account.rememberMe && account.encryptedPassword 
        ? SavedAccountsManager.decryptPassword(account.encryptedPassword) 
        : ''
    });
    setRememberMe(account.rememberMe);
    setShowAccountDropdown(false);
    SavedAccountsManager.updateLastUsed(account.email);
    setSavedAccounts(SavedAccountsManager.getAllAccounts());
    
    if (account.rememberMe && account.encryptedPassword) {
      console.log("✅ Loaded account with saved password (Remember Me enabled)");
    } else {
      console.log("📧 Loaded account email only (Remember Me not enabled)");
    }
  };

  const handleRemoveAccount = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    SavedAccountsManager.removeAccount(email);
    setSavedAccounts(SavedAccountsManager.getAllAccounts());
    
    if (formData.email.toLowerCase() === email.toLowerCase()) {
      setFormData({ email: '', password: '' });
      setRememberMe(false);
    }
    
    setMessage({ text: 'Account removed successfully', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearAllAccounts = () => {
    SavedAccountsManager.clearAll();
    setSavedAccounts([]);
    setFormData({ email: '', password: '' });
    setRememberMe(false);
    setShowAccountDropdown(false);
    setMessage({ text: 'All saved accounts cleared', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage(null);

    try {
      console.log("🚀 Starting login process...");
      const result = await LoginController.login(formData);
      console.log("✅ Login successful - redirect path:", result.redirect);
      
      SavedAccountsManager.saveAccount(formData.email, formData.password, rememberMe);
      
      if (rememberMe) {
        console.log("✅ Account saved with encrypted password (Remember Me enabled)");
      } else {
        console.log("📧 Account saved with email only (Remember Me disabled - no password stored)");
      }
      
      setMessage({ text: result.message, type: 'success' });

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

  const isFormValid = formData.email && formData.password;

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
                Secure Access to<br />Your Enterprise Tools
              </h2>
              <p className="text-[#c9e4f0] text-lg leading-relaxed">
                Connect with your team, manage projects efficiently, and drive business success with our comprehensive enterprise platform.
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

      {/* Right Section - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600">Access your enterprise account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Saved Accounts Dropdown */}
            {savedAccounts.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between hover:from-blue-100 hover:to-indigo-100 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {savedAccounts.length} Saved Account{savedAccounts.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-600">Click to view and select</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showAccountDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showAccountDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      {savedAccounts.map((account, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectAccount(account)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              account.rememberMe 
                                ? 'bg-gradient-to-br from-green-100 to-emerald-200' 
                                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                            }`}>
                              {account.rememberMe ? (
                                <Lock className="w-5 h-5 text-green-600" />
                              ) : (
                                <Mail className="w-5 h-5 text-gray-600" />
                              )}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {account.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {account.rememberMe ? '🔒 Password saved' : '📧 Email only'} • {new Date(account.lastUsed).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleRemoveAccount(e, account.email)}
                            className="ml-2 p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </button>
                      ))}
                    </div>
                    
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={handleClearAllAccounts}
                        className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700 py-2"
                      >
                        Clear All Saved Accounts
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="h-4 w-4 text-[#1a5f7a] focus:ring-[#2c7a9e] border-gray-300 rounded cursor-pointer"
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
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