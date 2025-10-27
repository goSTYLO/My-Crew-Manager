//topbarLayouot.tsx
import React, { useState, useRef, useEffect } from "react";
import {Menu,Search,Bell,MessageSquare,ChevronDown,ChevronUp,User,LogOut,Sun, Moon} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo2.png";
import { useTheme } from "./themeContext";
import { API_BASE_URL } from "../config/api";
import { useNotificationPolling } from "../hooks/useNotificationPolling";
import { useToast } from "./ToastContext";

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

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  actor?: number;
  actor_name?: string;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Helper function to transform notification URLs based on user role
  const transformNotificationUrl = (actionUrl: string, userRole: string | null) => {
    if (!actionUrl) return actionUrl;
    
    // If user is a developer and URL is for manager page, transform it
    if (userRole !== 'manager' && actionUrl.startsWith('/project-details/')) {
      const projectId = actionUrl.split('/project-details/')[1];
      return `/user-project/${projectId}`;
    }
    
    // If user is a manager and URL is for developer page, transform it
    if (userRole === 'manager' && actionUrl.startsWith('/user-project/')) {
      const projectId = actionUrl.split('/user-project/')[1];
      return `/project-details/${projectId}`;
    }
    
    // Return original URL if no transformation needed
    return actionUrl;
  };
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showAllNotificationsModal, setShowAllNotificationsModal] = useState(false);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [notifPage, setNotifPage] = useState(1);
  const [loadingAllNotifications, setLoadingAllNotifications] = useState(false);
  const notificationsPerPage = 20;
  const { showRealtimeUpdate } = useToast();

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/ai/notifications/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔔 TopNavbar: Initial fetch response:', data);
        const notifications = data.results || data;
        console.log('🔔 TopNavbar: Initial notifications:', notifications);
        setNotifications(notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch all notifications for modal
  const fetchAllNotifications = async () => {
    try {
      setLoadingAllNotifications(true);
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/ai/notifications/?page=${notifPage}&limit=${notificationsPerPage}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllNotifications(data.results || data);
      } else {
        console.error('Failed to fetch all notifications');
      }
    } catch (error) {
      console.error('Error fetching all notifications:', error);
    } finally {
      setLoadingAllNotifications(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/ai/notifications/${notificationId}/mark_read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('token') || sessionStorage.getItem('access');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/ai/notifications/mark_all_read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Smart polling for notifications - DISABLED for WebSocket testing
  useNotificationPolling({
    enabled: false, // Disabled to test WebSocket broadcasting
    onNewNotifications: (newNotifications) => {
      console.log('🔔 TopNavbar: Received new notifications:', newNotifications);
      // Add new notifications to the list
      setNotifications(prev => {
        const updated = [...newNotifications, ...prev];
        console.log('🔔 TopNavbar: Updated notifications list:', updated);
        return updated;
      });
      
      // Show toast for important notifications
      const importantTypes = [
        'task_assigned', 
        'task_completed',
        'project_invitation', 
        'member_joined'
      ];
      
      newNotifications.forEach(notification => {
        if (importantTypes.includes(notification.notification_type)) {
          showRealtimeUpdate(
            notification.title,
            notification.message,
            notification.actor
          );
        }
      });
    },
    onError: (error) => {
      console.error('🔔 TopNavbar: Notification polling error:', error);
    }
  });

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

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fetch all notifications when modal opens
  useEffect(() => {
    if (showAllNotificationsModal) {
      fetchAllNotifications();
    }
  }, [showAllNotificationsModal, notifPage]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowLogoutConfirm(false);

    try {
      const token = sessionStorage.getItem("token");

      await fetch(`${API_BASE_URL}/user/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      sessionStorage.removeItem("token");
      sessionStorage.clear();

      setTimeout(() => {
        window.location.replace("/sign-in");
      }, 1200);
    } catch (error) {
      console.error("Logout error:", error);
      sessionStorage.removeItem("token");
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
      const token = sessionStorage.getItem("token");
      console.log('🔍 TopNavbar - Token check:', token ? 'Found' : 'Not found');
      if (!token) {
        console.log('❌ TopNavbar - No token, redirecting to sign-in');
        navigate("/sign-in");
        return;
      }
  
      try {
        const response = await fetch(`${API_BASE_URL}/user/me/`, {
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
          sessionStorage.removeItem("token");
          navigate("/sign-in");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
  
    fetchUserData();
  }, [navigate]);  


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
      className={`fixed top-0 left-0 w-full shadow-sm border-b px-4 lg:px-6 py-4 ${
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
              {notifications.some((note) => !note.is_read) && (
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
                  {loadingNotifications ? (
                    <li className="px-4 py-6 text-center text-gray-400 text-sm">
                      Loading notifications...
                    </li>
                  ) : notifications.length === 0 ? (
                    <li className="px-4 py-6 text-center text-gray-400 text-sm">
                      No new notifications
                    </li>
                  ) : (
                    notifications.map((note) => (
                      <li
                        key={note.id}
                        className={`flex items-start px-4 py-4 text-sm transition ${
                          note.is_read
                            ? "text-gray-400"
                            : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!note.is_read) {
                            markNotificationAsRead(note.id);
                          }
                          if (note.action_url) {
                            const transformedUrl = transformNotificationUrl(note.action_url, userData?.role);
                            navigate(transformedUrl);
                          }
                        }}
                      >
                        {!note.is_read && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{note.title}</div>
                          <div className="text-gray-600 mt-1">{note.message}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
                <div className="p-3 border-t border-gray-200 text-center">
                  <button 
                    className="text-blue-600 text-sm font-medium hover:underline"
                    onClick={() => setShowAllNotificationsModal(true)}
                  >
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

      {/* View All Notifications Modal */}
      {showAllNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">All Notifications</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Mark All as Read
                </button>
                <button
                  onClick={() => setShowAllNotificationsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingAllNotifications ? (
                <div className="text-center py-8 text-gray-500">
                  Loading notifications...
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notifications found
                </div>
              ) : (
                <div className="space-y-4">
                  {allNotifications.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        note.is_read
                          ? "bg-gray-50 border-gray-200 text-gray-600"
                          : "bg-blue-50 border-blue-200 text-gray-800 hover:bg-blue-100"
                      }`}
                      onClick={() => {
                        if (!note.is_read) {
                          markNotificationAsRead(note.id);
                        }
                        if (note.action_url) {
                          const transformedUrl = transformNotificationUrl(note.action_url, userData?.role);
                          navigate(transformedUrl);
                          setShowAllNotificationsModal(false);
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        {!note.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{note.title}</div>
                          <div className="text-gray-600 mt-1">{note.message}</div>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(note.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {allNotifications.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <button
                  onClick={() => setNotifPage(prev => Math.max(1, prev - 1))}
                  disabled={notifPage === 1}
                  className="px-4 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {notifPage}
                </span>
                <button
                  onClick={() => setNotifPage(prev => prev + 1)}
                  disabled={allNotifications.length < notificationsPerPage}
                  className="px-4 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 hover:bg-gray-200"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
