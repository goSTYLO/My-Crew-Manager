// pages/signIn.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Chrome, Github, Apple } from 'lucide-react';

// MODEL
interface User {
  email: string;
  password: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

class UserModel {
  static validateUser(user: User): ValidationResult {
    const errors: string[] = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(user.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!user.password) {
      errors.push('Password is required');
    } else if (user.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return { isValid: errors.length === 0, errors };
  }
}

// CONTROLLER
class LoginController {
  static async login(user: User): Promise<{ success: boolean; message: string }> {
    const validation = UserModel.validateUser(user);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (user.email === 'demo@example.com' && user.password === 'password123') {
          resolve({ success: true, message: 'Login successful! Welcome back.' });
        } else {
          reject(new Error('Invalid email or password. Try demo@example.com with password123'));
        }
      }, 1500);
    });
  }
}

// VIEW
export default function LoginPage() {
  const navigate = useNavigate(); // ✅ Navigation hook

  const [formData, setFormData] = useState<User>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setMessage({ text: 'Please accept the Terms & Conditions', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const result = await LoginController.login(formData);
      setMessage({ text: result.message, type: 'success' });

      // ✅ Redirect after short delay
      setTimeout(() => {
        navigate('/main',{replace: true});
      }, 1000);
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-25"></div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full h-full text-white space-y-6 p-12">
            <div className="w-64 h-64 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg">
            <User size={120} className="text-white opacity-80" />
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
                />
              </div>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                  Terms & Conditions
                </label>
              </div>
              <button type="button" className="text-sm text-blue-600 font-medium">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
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
                  disabled={socialLoading === provider.name}
                  className="p-3 bg-white border border-gray-300 rounded-lg hover:scale-105 disabled:opacity-50"
                >
                  {socialLoading === provider.name ? (
                    <div className="animate-spin h-5 w-5 border-b-2 border-gray-400 mx-auto rounded-full"></div>
                  ) : (
                    <provider.icon className="w-5 h-5 text-gray-600 mx-auto" />
                  )}
                </button>
              ))}
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button onClick={() => navigate("/signup")}
                  className="text-blue-600 font-medium hover:underline">Sign up for free</button>
              </p>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
            <p className="text-sm text-blue-700">Email: demo@example.com</p>
            <p className="text-sm text-blue-700">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
