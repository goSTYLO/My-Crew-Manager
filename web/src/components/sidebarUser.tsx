import React, { useState} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const SidebarUser: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 get current path
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ✅ logout handler is now inside Sidebar
  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    setShowLogoutConfirm(false);
    navigate("/sign-in");
  };

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/user" },
    { name: "Project", icon: FolderOpen, path: "/projects-user" },
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
      {showLogoutConfirm && (
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
    </>
  );
};

export default SidebarUser;