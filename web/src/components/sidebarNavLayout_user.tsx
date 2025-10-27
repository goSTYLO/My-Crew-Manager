import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, Bell, Shield, Palette} from "lucide-react";
import { useTheme } from "./themeContext"; // Add this import

export const tabs = [
	{ id: "account", label: "Account", icon: User, path: "/user-settings" },
	{ id: "notifications", label: "Notifications", icon: Bell, path: "/user-notifications" },
	{ id: "security", label: "Security", icon: Shield, path: "/user-security" },
	{ id: "appearance", label: "Appearance", icon: Palette, path: "/user-appearance" },
];

const SettingsNavigation: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { theme } = useTheme(); // Use theme

	// Check if current path matches any tab
	const activeTab = tabs.find((tab) => tab.path === location.pathname);
	// If no tab matches, default to "general"
	const activeTabId = activeTab ? activeTab.id : "account";

	return (
		<div className={`rounded-lg shadow-sm border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
			<nav className="space-y-1 p-2">
				{tabs.map((tab) => {
					const Icon = tab.icon;
					const isActive = activeTabId === tab.id;
					return (
						<button
							key={tab.id}
							onClick={() => tab.path && navigate(tab.path)}
							className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
								isActive
									? theme === "dark"
										? "bg-blue-900 text-blue-300"
										: "bg-blue-100 text-blue-700"
									: theme === "dark"
										? "text-gray-300 hover:bg-gray-700"
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
// filepath: c:\Users\AMD\Desktop\MyCrewManager\My-Crew-Manager\web\src\components\sidebarNavLayout.tsx
