import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, User, Bell, Shield, Palette, Users } from "lucide-react";

export const tabs = [
  { id: "general", label: "General", icon: Settings, path: "/general" },
  { id: "account", label: "Account", icon: User, path: "/account-settings" },
  { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
  { id: "security", label: "Security", icon: Shield, path: "/security" },
  { id: "appearance", label: "Appearance", icon: Palette, path: "/appearance" },
  { id: "team", label: "Team", icon: Users, path: "/team" },
];

const SettingsNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <nav className="space-y-1 p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path; // sync active with URL
          return (
            <button
              key={tab.id}
              onClick={() => tab.path && navigate(tab.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SettingsNavigation;
