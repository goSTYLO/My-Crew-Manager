import { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";

const TeamSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const [defaultRole, setDefaultRole] = useState("member");
  const [autoAssignTasks, setAutoAssignTasks] = useState(true);
  const [allowGuestAccess, setAllowGuestAccess] = useState(false);

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

        <main className="flex-1 p-6">
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Settings Sidebar */}
            <div className="col-span-2">
              <SettingsNavigation />
            </div>

            {/* Page Content */}
            <div className="col-span-10">
              <div className={`max-w-8xl mx-auto p-6 rounded-xl shadow ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                <h1 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Team Settings
                </h1>
                <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Manage team defaults and collaboration settings.
                </p>

                <div className="space-y-6">
                  {/* Default Role */}
                  <div>
                    <h2 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Default Role for New Members
                    </h2>
                    <select
                      value={defaultRole}
                      onChange={(e) => setDefaultRole(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Auto Assign Tasks */}
                  <div className={`flex items-center justify-between p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div>
                      <div className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Auto-assign Tasks
                      </div>
                      <div className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        Automatically assign tasks based on workload
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoAssignTasks}
                        onChange={(e) => setAutoAssignTasks(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${autoAssignTasks ? "peer-checked:bg-blue-600" : theme === "dark" ? "bg-gray-600" : "bg-gray-200"}`}></div>
                    </label>
                  </div>

                  {/* Allow Guest Access */}
                  <div className={`flex items-center justify-between p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div>
                      <div className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        Allow Guest Access
                      </div>
                      <div className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        Let guests view public projects without signing up
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowGuestAccess}
                        onChange={(e) => setAllowGuestAccess(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${allowGuestAccess ? "peer-checked:bg-blue-600" : theme === "dark" ? "bg-gray-600" : "bg-gray-200"}`}></div>
                    </label>
                  </div>

                  <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Save Team Settings
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

export default TeamSettings;
