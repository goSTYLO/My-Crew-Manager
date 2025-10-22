import { useState } from "react";
import SidebarUser from "../../components/sidebarUser";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";

const UserSettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const [projectName, setProjectName] = useState("MyCrewManager");
  const [description, setDescription] = useState("Project management and team collaboration platform");
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [workingHours, setWorkingHours] = useState({
    start: "09:00",
    end: "17:00",
  });

  const handleSave = () => {
    console.log({
      projectName,
      description,
      timezone,
      dateFormat,
      workingHours,
    });
    alert("General settings saved!");
  };

  return (
    <div className={`flex min-h-screen w-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* User Sidebar (Developer sidebar) */}
      <SidebarUser
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Settings Sidebar */}
            <div className="col-span-2">
              <SettingsNavigation />
            </div>
            
            {/* Page Content */}
            <div className="col-span-10">
              <div className={`max-w-8xl mx-auto p-6 rounded-xl shadow ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                <h1 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  General Settings
                </h1>
                <p className={`mb-8 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Manage your project details, timezone, and working hours.
                </p>

                <div className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter project name"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="Enter project description"
                    />
                  </div>

                  {/* Timezone and Date Format Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timezone */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">Eastern Time (GMT-5)</option>
                        <option value="America/Los_Angeles">Pacific Time (GMT-8)</option>
                        <option value="Europe/London">London (GMT+0)</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Date Format
                      </label>
                      <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div>
                    <label className={`block text-sm font-medium mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Working Hours
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Start Time */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={workingHours.start}
                          onChange={(e) =>
                            setWorkingHours({ ...workingHours, start: e.target.value })
                          }
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          End Time
                        </label>
                        <input
                          type="time"
                          value={workingHours.end}
                          onChange={(e) =>
                            setWorkingHours({ ...workingHours, end: e.target.value })
                          }
                          className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-white"
                              : "bg-white border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition duration-200 font-medium"
                    >
                      Save General Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserSettings;