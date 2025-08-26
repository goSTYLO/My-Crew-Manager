import React from "react";
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
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 get current path

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/main" },
    { name: "Project", icon: FolderOpen, path: "/main-projects" },
    { name: "Task", icon: CheckSquare, path: "/create" },
    { name: "Work Logs", icon: Clock, path: "/work-logs" },
    { name: "Performance", icon: TrendingUp, path: "/performance" },
    { name: "Settings", icon: Settings, path: "/settings" },
    { name: "Logout", icon: LogOut, action: onLogout },
  ];

  // ✅ Define aliases for Project
  const projectPaths = ["/main-projects", "/projects", "/create-project"];

  // ✅ Active check
  const checkIsActive = (itemPath: string | undefined) => {
    if (!itemPath) return false;
    if (itemPath === "/main-projects") {
      return projectPaths.includes(location.pathname);
    }
    return location.pathname === itemPath;
  };

  return (
    <div className="bg-white shadow-lg h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-xl font-semibold text-gray-800">
            MyCrewManager
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {navigationItems.map((item) => {
          const active = checkIsActive(item.path); // 👈 use function instead of redefining isActive

          return (
            <button
              key={item.name}
              onClick={item.action ? item.action : () => navigate(item.path!)}
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
  );
};

export default Sidebar;
