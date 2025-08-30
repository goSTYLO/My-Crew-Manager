import React from "react";
import { Menu, Search, Bell } from "lucide-react";

interface TopNavbarProps {
  onMenuClick: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        
        {/* Left Side: Menu + Title */}
        <div className="flex items-center space-x-4">
          <button
            className="p-2 text-gray-500 hover:text-gray-700"
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">
            MyCrewManager
          </h1>
        </div>

        {/* Right Side: Search + Notifications + Profile */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="block relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search for anything..."
              className="pl-10 pr-4 py-2 w-[500px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notifications */}
          <button
            className="p-2 text-gray-500 hover:text-gray-700 relative -ml-2"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="sm:block">
              <p className="text-sm font-medium text-gray-800">John Wayne</p>
              <p className="text-xs text-gray-500">Philippines</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
              JW
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
