import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/main" },
    { name: "Project", icon: FolderOpen, path: "/main-projects" },
    { name: "Task", icon: CheckSquare, path: "/create" },
    { name: "Work Logs", icon: Clock, path: "/work-logs" },
    { name: "Performance", icon: TrendingUp, path: "/performance" },
    { name: "Settings", icon: Settings, path: "/settings" },
    { name: "Logout", icon: LogOut, action: () => setShowLogoutConfirm(true) },
  ];

  const handleClick = (item: typeof navigationItems[number]) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
      setSidebarOpen(false); // close sidebar after navigation
    }
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Are you sure you want to logout?
            </h2>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  navigate("/signIn", { replace: true }); // ⬅️ replace true here
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar panel */}
        <div
          className={`relative flex flex-col w-64 bg-white shadow-lg transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close button */}
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <span className="text-xl font-semibold text-gray-800">
              MyCrewManager
            </span>
          </div>

          {/* Navigation */}
          <nav className="mt-6">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleClick(item)}
                className="flex items-center px-6 py-3 text-left w-full transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;