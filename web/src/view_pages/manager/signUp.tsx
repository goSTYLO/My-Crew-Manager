// pages/signUp.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo from "../../assets/logo2.png";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "Project Manager", // Default role
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (message) setMessage(null);
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({ ...prev, role }));
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match!", type: 'error' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters long", type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const requestBody = {
      name: `${formData.firstname} ${formData.lastname}`,
      email: formData.email,
      password: formData.password,
      role: formData.role, // Include role in request
    };

    console.log("🚀 Starting signup process...");
    console.log("📤 Request body:", { ...requestBody, password: "***" });
    console.log("👤 Selected role:", formData.role);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/user/signup/", {
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
        console.log("👤 User role saved:", formData.role);

        // ✅ Show success message and redirect to /signin
        setMessage({ 
          text: `Account created successfully as ${formData.role}! Please sign in to continue.`, 
          type: 'success' 
        });
        
        console.log("📍 Redirecting to /signin page...");
        
        // Redirect to signin page after 1.5 seconds
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-25"></div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full h-full text-white space-y-6 p-12">
          <div className="w-64 h-64 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg overflow-hidden">
            <img src={logo} alt="Logo" className="w-70 h-70 object-contain mt-2 mr-1" />
          </div>
          <h2 className="text-4xl font-extrabold text-center">Join Us!</h2>
          <p className="text-lg text-center max-w-xs opacity-90">
            Create an account and start your journey.
          </p>
        </div>
      </div>

      {/* Right Section - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
            <p className="text-gray-600">Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Role</label>
              <div className="relative flex items-center bg-gray-100 rounded-lg p-1">
                {/* Background slider */}
                <div 
                  className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-md shadow-md transition-all duration-300 ease-in-out ${
                    formData.role === "Developer" ? "left-1/2 ml-[-2px]" : "left-1"
                  }`}
                />
                
                {/* Project Manager Button */}
                <button
                  type="button"
                  onClick={() => handleRoleToggle("Project Manager")}
                  disabled={loading}
                  className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-300 ${
                    formData.role === "Project Manager"
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Project Manager
                </button>
                
                {/* Developer Button */}
                <button
                  type="button"
                  onClick={() => handleRoleToggle("Developer")}
                  disabled={loading}
                  className={`relative z-10 flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-300 ${
                    formData.role === "Developer"
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Developer
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {formData.role === "Project Manager" 
                  ? "Access main dashboard and project management features" 
                  : "Access user dashboard and assigned tasks"}
              </p>
            </div>

            {/* Firstname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Firstname</label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your firstname"
                required
                disabled={loading}
              />
            </div>

            {/* Lastname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lastname</label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your lastname"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

             {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm your password"
                    required
                    disabled={loading}
                  />
                  {formData.confirmPassword && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  )}
                </div>
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
              disabled={loading}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="text-blue-600 font-medium hover:underline"
                  disabled={loading}
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}