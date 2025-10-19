import { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";

const SecuritySettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className={`flex min-h-screen w-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar (reusable, same as mainFrame/settings) */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Settings Sidebar */}
            <div className="col-span-2">
              <SettingsNavigation />
            </div>

            {/* Page Content */}
            <div className="col-span-10">
              <div className={`max-w-8xl mx-auto p-6 rounded-xl shadow ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                <h1 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Security Settings
                </h1>
                <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Manage your privacy and security preferences.
                </p>

                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div>
                    <h2 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Two-Factor Authentication
                    </h2>
                    <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Add an extra layer of security to your account.
                    </p>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Enable 2FA
                    </button>
                  </div>

                  {/* Session Timeout */}
                  <div>
                    <h2 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Session Timeout
                    </h2>
                    <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Automatically log out after inactivity.
                    </p>
                    <select className={`mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                      <option value="15">15 minutes</option>
                      <option value="30" selected>
                        30 minutes
                      </option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>

                  {/* Public Profile */}
                  <div>
                    <h2 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Public Profile
                    </h2>
                    <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Control whether your profile is visible to others.
                    </p>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 text-blue-600" />
                      <span className={`${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Allow public profile</span>
                    </label>
                  </div>

                  <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Save Security Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SecuritySettings;
