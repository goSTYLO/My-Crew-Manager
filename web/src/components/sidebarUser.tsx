import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
  MessageSquare
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarUser: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ API logout handler
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false); // hide confirmation immediately
  
    try {
      const token = localStorage.getItem("token");
  
      // Call the logout API endpoint
      await fetch("http://localhost:8000/api/user/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
      });
  
      // Clear local storage and session
      localStorage.removeItem("token");
      sessionStorage.clear();
  
      // Add a small delay so the spinner is visible
      setTimeout(() => {
        window.location.replace("/sign-in");
      }, 1200); // 1.2 second delay
  
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("token");
      sessionStorage.clear();
  
      setTimeout(() => {
        window.location.replace("/sign-in");
      }, 1200);
    }
  };

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/user" },
    { name: "Team Chat", icon: MessageSquare, path: "/chat-user" },
    { name: "Project", icon: FolderOpen, path: "/projects-user" },
    { name: "Project Invitation", icon: FolderOpen, path: "/project-invitation" },
    { name: "Task", icon: CheckSquare, path: "/kanban-user" },
    { name: "Work Logs", icon: Clock, path: "/worklogs-user" },
    { name: "Performance", icon: TrendingUp, path: "/performance-user" },
    { name: "Settings", icon: Settings, path: "/settings" },
    { name: "Logout", icon: LogOut, action: () => setShowLogoutConfirm(true) },
  ];

  // ✅ Define aliases for Project (user routes)
  const projectPaths = ["/projects-user", "/project-details"];

  // ✅ Improved active check
  const checkIsActive = (itemPath: string | undefined) => {
    if (!itemPath) return false;

    // Highlight "Project" if on any project-related page (user sidebar)
    if (itemPath === "/projects-user") {
      return projectPaths.some((p) => location.pathname.startsWith(p));
    }

    // Exact match for other items
    return location.pathname === itemPath;
  };

  return (
    <>
      {/* Sidebar overlay (click outside to close) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <span className="text-xl font-semibold text-gray-800">
            MyCrewManager
          </span>
          {/* Close button */}
          <button
            className="text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {navigationItems.map((item) => {
            const active = checkIsActive(item.path);

            return (
              <button
                key={item.name}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    navigate(item.path!);
                  }
                  setSidebarOpen(false);
                }}
                className={`flex items-center px-6 py-3 text-left w-full transition-colors ${
                  active
                    ? "bg-blue-50 border-r-4 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && !isLoggingOut && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logging Out Animation Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-xl font-semibold">Logging out...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarUser;