//topbarLayout.tsx
import React, { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useTheme } from "./themeContext";

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

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Need Better Notifications Design", read: false },
    { id: 2, text: "Make the Website Responsive", read: false },
    { id: 3, text: "Fix Bug of Able to go Back to a Page", read: false },
  ]);

  useEffect(() => {
    // Listener for updates
    const handleUserUpdate = () => {
      setUserData((prev) => {
        if (!prev) return prev; // if userData is null, do nothing
  
        return {
          ...prev, // keep existing required fields
          name: localStorage.getItem("user_name") || prev.name,
          profile_picture: localStorage.getItem("user_profile_picture") || prev.profile_picture,
        };
      });
    };
  
    window.addEventListener("userDataUpdated", handleUserUpdate);
    return () => window.removeEventListener("userDataUpdated", handleUserUpdate);
  }, []);
  

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // If no token, redirect to login
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:8000/api/user/me/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          // Token invalid or expired
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
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

  const { theme } = useTheme();

  // Get user initials from name
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full shadow-sm border-b px-4 lg:px-6 py-4
      ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
    `}
    >
      <div className="flex items-center justify-between h-10">
        {/* Left Side: Menu + Logo */}
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
          {/* Search Bar */}
          <div className="block relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search for anything..."
              className={`pl-10 pr-4 py-2 w-[500px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}
              `}
            />
          </div>

          {/* Chat Icon */}
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

            {/* Notifications Dropdown */}
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
            {userData ? (
              <>
                <div className="sm:block">
                  <p
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {userData.name}
                  </p>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {userData.role || 'User'}
                  </p>
                </div>

               {/* Profile Picture */}
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {localStorage.getItem('user_profile_picture') ? (
                    <img
                      src={localStorage.getItem('user_profile_picture')!}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : userData?.profile_picture ? (
                    <img
                      src={userData.profile_picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {userData ? getUserInitials(userData.name) : '??'}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="sm:block">
                  <p
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Loading...
                  </p>
                  <p
                    className={`text-xs ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    ...
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  ...
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default TopNavbar;