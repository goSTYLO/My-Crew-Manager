import { useState } from "react";
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user"; // Corrected the import path
import { useTheme } from "../../components/themeContext";

const WorkLogsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  // Example work logs
  const workLogs = [
    { date: "05 Nov 2022", text: "Make an Automatic Payment System that enable the design" },
    { date: "04 Nov 2022", text: "Make an Automatic Payment System that enable the design" },
    { date: "03 Nov 2022", text: "Make an Automatic Payment System that enable the design" },
    { date: "02 Nov 2022", text: "Make an Automatic Payment System that enable the design" },
  ];

  // Example notifications
  const notifications = [
    { id: 1, name: "Ellie", action: "joined team developers", time: "04 Apr, 2021 04:00 PM" },
    { id: 2, name: "Jenny", action: "joined team HR", time: "04 Apr, 2021 05:00 PM" },
    { id: 3, name: "Adam", action: "got employee of the month", time: "03 Apr, 2021 02:00 PM" },
    { id: 4, name: "Robert", action: "joined team design", time: "02 Apr, 2021 06:00 PM" },
  ];

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content */}
        <main className="flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto mt-[5rem]">
          {/* Left side: Work logs */}
          <div className={`flex-1 rounded-xl shadow-lg p-6 ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            {workLogs.map((log, idx) => (
              <div key={idx} className={`flex items-start py-4 border-b last:border-0 ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}>
                <span className={`w-32 text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>{log.date}</span>
                <p className={`font-medium ${
                  theme === "dark" ? "text-gray-200" : "text-gray-800"
                }`}>{log.text}</p>
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="w-80 flex flex-col gap-6">
            {/* WorkLog Stats */}
            <div className={`rounded-xl shadow-lg p-6 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}>
              <div className="flex items-center justify-between">
                                <div className={`text-sm font-semibold ${
                                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                                }`}>Adoddle</div>

                                {/* Right side: status */}
                                <button className={`px-1 py-.5 bg-transparent text-sm font-medium rounded-lg transition-colors ${
                                  theme === "dark" 
                                    ? "text-gray-300 hover:text-white hover:bg-gray-700" 
                                    : "text-black hover:text-black hover:bg-gray-300"
                                }`}>
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-ellipsis-icon lucide-ellipsis"
                                >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                                </svg>
                                </button>
                            </div>
              <div className="flex items-center justify-center">
                {/* Placeholder circle */}
                <div className={`w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center ${
                  theme === "dark" ? "border-r-gray-600" : "border-r-gray-200"
                }`}>
                  <span className={`text-center font-semibold ${
                    theme === "dark" ? "text-gray-200" : "text-gray-700"
                  }`}>
                    5w: 2d
                  </span>
                </div>
              </div>
              <p className={`text-center text-sm mt-2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>Statistics</p>
            </div>

            {/* Notifications */}
            <div className={`rounded-xl shadow-lg p-6 flex-1 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-sm font-semibold ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>Notifications</h3>
                <button className={`text-xs hover:underline ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`}>View All</button>
              </div>
              <ul className="space-y-4">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      theme === "dark" 
                        ? "bg-gray-700 text-gray-300" 
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {n.name[0]}
                    </div>
                    <div>
                      <p className={`text-sm ${
                        theme === "dark" ? "text-gray-200" : "text-gray-800"
                      }`}>
                        <span className="font-medium">{n.name}</span> {n.action}
                      </p>
                      <p className={`text-xs ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkLogsPage;