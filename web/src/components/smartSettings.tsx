import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SmartSettings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get user role from localStorage
    const userRole = localStorage.getItem("userRole");
    
    // Normalize the role for comparison
    const normalizedRole = userRole ? userRole.trim().toLowerCase() : "";
    
    // Determine redirect based on role
    if (normalizedRole === "project manager" || 
        normalizedRole.includes("project") && normalizedRole.includes("manager") ||
        normalizedRole === "projectmanager" ||
        normalizedRole === "pm") {
      // Redirect to manager settings
      navigate("/manager-settings", { replace: true });
    } else {
      // Default to user settings for developers and other roles
      navigate("/settings-user", { replace: true });
    }
  }, [navigate]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading settings...</p>
      </div>
    </div>
  );
};

export default SmartSettings;