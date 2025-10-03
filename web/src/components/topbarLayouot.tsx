import React, { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useTheme } from "./themeContext";

interface TopNavbarProps {
  onMenuClick: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Need Better Notifications Design", read: false },
    { id: 2, text: "Make the Website Responsive", read: false },
    { id: 3, text: "Fix Bug of Able to go Back to a Page", read: false },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((note) => ({ ...note, read: true }))
    );
  };

  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const { theme } = useTheme();

  return (
    <header className={`shadow-sm border-b px-4 lg:px-6 py-4 relative
      ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
    `}>
      <div className="flex items-center justify-between h-10">
        {/* Left Side: Menu + Title */}
        <div className="flex items-center">
          <button
            className={`p-2 ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div
            onClick={() => navigate("/main")}
            className="cursor-pointer flex items-center ml-5"
          >
            <img
              src={logo}
              alt="Logo"
              className="h-[3.8rem] w-auto select-none pointer-events-none"
            />
            <h1 className={`ml-2 text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
              MyCrewManager
            </h1>
          </div>
        </div>
        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="block relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Search for anything..."
              className={`pl-10 pr-4 py-2 w-[500px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}
              `}
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 relative -ml-2"
              title="Notifications"
              aria-label="Notifications"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <Bell className="w-6 h-6" />
              {notifications.some((note) => !note.read) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Notifications
                  </h3>
                  <button
                    className="text-xs text-blue-600 hover:underline"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                </div>
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-200">
                  {notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-gray-400 text-sm">
                      No new notifications
                    </li>
                  ) : (
                    notifications.map((note) => (
                      <li
                        key={note.id}
                        className={`flex items-center px-4 py-4 text-sm transition ${
                          note.read
                            ? "text-gray-400"
                            : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                        }`}
                      >
                        {!note.read && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        )}
                        <span>{note.text}</span>
                      </li>
                    ))
                  )}
                </ul>
                <div className="p-3 border-t border-gray-200 text-center">
                  <button className="text-blue-600 text-sm font-medium hover:underline">
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="sm:block">
              <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>John Wayne</p>
              <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Philippines</p>
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
