import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout"; 
import SettingsNavigation from "../../components/sidebarNavLayout"; 
import TopNavbar from "../../components/topbarLayouot";
import { Search, Bell, Menu, X } from "lucide-react";

// ✅ Notification Settings Component
interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskReminders: boolean;
  projectUpdates: boolean;
  weeklyReports: boolean;
}

const NotificationSettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    projectUpdates: true,
    weeklyReports: true,
  });

  const handleToggle = (setting: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleSaveChanges = () => {
    console.log("Settings saved:", settings);
    // Here you would typically send the settings to your backend
  };

  const ToggleSwitch: React.FC<{ isOn: boolean; onToggle: () => void }> = ({
    isOn,
    onToggle,
  }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isOn ? "bg-blue-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  const SettingRow: React.FC<{
    title: React.ReactNode; 
    description: string;
    isOn: boolean;
    onToggle: () => void;
  }> = ({ title, description, isOn, onToggle }) => (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <ToggleSwitch isOn={isOn} onToggle={onToggle} />
    </div>
  );

  return (
    <div className="max-w-8xl mx-auto p-6 bg-white rounded-xl shadow">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Notifications Settings
        </h1>
        <p className="text-gray-600">
          Manage your notifications preferences and configuration.
        </p>
      </div>

      <div className="space-y-0 divide-y divide-gray-100">
        <SettingRow
            title={<h3 className="text-xl font-semibold text-gray-900">Email Notifications</h3>}
            description="Receive notifications via email"
            isOn={settings.emailNotifications}
            onToggle={() => handleToggle("emailNotifications")}
        />
        <SettingRow
            title={<h3 className="text-xl font-semibold text-gray-900">Push Notifications</h3>}
            description="Receive browser push notifications"
            isOn={settings.pushNotifications}
            onToggle={() => handleToggle("pushNotifications")}
        />
        <SettingRow
            title={<h3 className="text-xl font-semibold text-gray-900">Task Reminders</h3>}
            description="Get reminded about upcoming deadlines"
            isOn={settings.taskReminders}
            onToggle={() => handleToggle("taskReminders")}
        />
        <SettingRow
            title={<h3 className="text-xl semibold-bold text-gray-900">Project Updates</h3>}
            description="Notifications when projects are updated"
            isOn={settings.projectUpdates}
            onToggle={() => handleToggle("projectUpdates")}
        />
        <SettingRow
            title={<h3 className="text-xl font-semibold text-gray-900">Weekly Reports</h3>}
            description="Receive a summary of weekly activities"
            isOn={settings.weeklyReports}
            onToggle={() => handleToggle("weeklyReports")}
        />
      </div>

      <div className="flex justify-center col-span-2">
        <button
          onClick={handleSaveChanges}
          className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

// ✅ Main Notifications Page
const Notifications = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
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
                onClick={() => console.log("Logging out...")}
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
          className={`relative flex flex-col w-64 bg-white transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-500"
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <Sidebar onLogout={() => setShowLogoutConfirm(true)} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Settings Sidebar Navigation */}
            <div className="col-span-2">
              <SettingsNavigation/>
            </div>

            {/* ✅ Notifications Settings Component */}
            <div className="col-span-10">
              <NotificationSettingsComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notifications;
