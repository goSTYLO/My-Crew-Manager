import React, { useState, useRef, useEffect } from "react";
import {Menu,Search,Bell,MessageSquare,ChevronDown,ChevronUp,User,LogOut,Sun, Moon} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useTheme } from "./themeContext";
import { API_BASE_URL } from "../config/api";

interface TopNavbarProps {
  onMenuClick: () => void;
}

interface UserData {
  user_id: string;
  name: string;
  email: string;
  role: string | null;
  profile_picture?: string | null;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Need Better Notifications Design", read: false },
    { id: 2, text: "Make the Website Responsive", read: false },
    { id: 3, text: "Fix Bug of Able to go Back to a Page", read: false },
  ]);

  // Listen for user updates dispatched from AccountSettings
  useEffect(() => {
    const handleUserUpdate = (event: CustomEvent) => {
      const updatedData = event.detail;
      setUserData((prev) => ({
        ...prev,
        ...updatedData,
      }));
    };

    window.addEventListener("userDataUpdated", handleUserUpdate as EventListener);

    return () => {
      window.removeEventListener("userDataUpdated", handleUserUpdate as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);

    try {
      const token = localStorage.getItem("token");

      await fetch(`${API_BASE_URL}/api/user/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      localStorage.removeItem("token");
      sessionStorage.clear();

      setTimeout(() => {
        window.location.replace("/sign-in");
      }, 1200);
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("token");
      sessionStorage.clear();

      setTimeout(() => {
        window.location.replace("/sign-in");
      }, 1200);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch user data and listen for updates from settings
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      console.log('🔍 TopNavbar - Token check:', token ? 'Found' : 'Not found');
      if (!token) {
        console.log('❌ TopNavbar - No token, redirecting to sign-in');
        navigate("/sign-in");
        return;
      }
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/me/`, {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log('✅ TopNavbar - User data fetched successfully');
  
          // ✅ Fix the profile picture path
          const fixedData = {
            ...data,
            profile_picture: data.profile_picture
              ? data.profile_picture.startsWith("http")
                ? data.profile_picture
                : `${API_BASE_URL}${data.profile_picture}`
              : null,
          };
  
          setUserData(fixedData);
        } else {
          console.log('❌ TopNavbar - API call failed, status:', response.status);
          localStorage.removeItem("token");
          navigate("/sign-in");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
  
    fetchUserData();
  }, [navigate]);  

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((note) => ({ ...note, read: true }))
    );
  };

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

  const { theme, toggleTheme } = useTheme();

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full shadow-sm border-b px-4 lg:px-6 py-4 z-50 ${
        theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between h-10">
        {/* Left Side */}
        <div className="flex items-center">
          <button
            className={`p-2 ${
              theme === "dark"
                ? "text-gray-300 hover:text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
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
            <h1
              className={`ml-2 text-2xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}
            >
              MyCrewManager
            </h1>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="block relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search for anything..."
              className={`pl-10 pr-4 py-2 w-[500px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === "dark"
                  ? "bg-gray-900 border-gray-700 text-white"
                  : "border-gray-300"
              }`}
            />
          </div>

          {/* Chat */}
          <button
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Team Chat"
            onClick={() => navigate("/chat")}
          >
            <MessageSquare className="w-6 h-6" />
          </button>

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

          {/* Profile */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              className="flex items-center space-x-2 px-3 py-1 border rounded-full hover:shadow-md focus:outline-none"
              onClick={() => setShowProfileDropdown((prev) => !prev)}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
                {userData?.profile_picture ? (
                  <img
                    src={userData.profile_picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {userData ? getUserInitials(userData.name) : "??"}
                  </div>
                )}
              </div>

              <div className="flex flex-col text-left">
                <span
                  className={`text-sm font-medium ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  {userData?.name || "Loading..."}
                </span>
                <span
                  className={`text-xs ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {userData?.role || "User"}
                </span>
              </div>

              {showProfileDropdown ? (
                <ChevronUp
                  className={`w-4 h-4 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                />
              ) : (
                <ChevronDown
                  className={`w-4 h-4 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                />
              )}
            </button>

            {/* Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-2">
                <button
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => navigate("/account-settings")}
                >
                  <User className="w-4 h-4 text-dark-500" />
                  Profile
                </button>
                <hr />
                <button
                  className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-500"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Logout
                </button>

                {/* Logout Confirmation */}
                {showLogoutConfirm && !isLoggingOut && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                    <div
                      className={`rounded-xl shadow-lg p-6 w-80 ${
                        theme === "dark"
                          ? "bg-gray-900 text-white"
                          : "bg-white"
                      }`}
                    >
                      <h2
                        className={`text-lg font-semibold mb-4 ${
                          theme === "dark"
                            ? "text-white"
                            : "text-gray-900"
                        }`}
                      >
                        Confirm Logout
                      </h2>
                      <p
                        className={`mb-6 ${
                          theme === "dark"
                            ? "text-gray-300"
                            : "text-gray-600"
                        }`}
                      >
                        Are you sure you want to log out?
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          className={`px-4 py-2 rounded-lg ${
                            theme === "dark"
                              ? "bg-gray-700 hover:bg-gray-600 text-white"
                              : "bg-gray-200 hover:bg-gray-300"
                          }`}
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

                {/* Logging Out Overlay */}
                {isLoggingOut && (
                  <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-white text-xl font-semibold">
                        Logging out...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* 🌞🌜 Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-200 ${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
