import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import TopNavbar from "../../components/topbarLayouot";
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
    <div className={`flex min-h-screen w-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content */}
        <main className="flex-1 flex gap-6 p-6 mt-20">
          {/* Left side: Work logs */}
          <div className={`flex-1 rounded-xl shadow-lg p-6 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
            {workLogs.map((log, idx) => (
              <div key={idx} className={`flex items-start py-4 border-b last:border-0 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <span className={`w-32 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{log.date}</span>
                <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>{log.text}</p>
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="w-80 flex flex-col gap-6">
            {/* WorkLog Stats */}
            <div className={`rounded-xl shadow-lg p-6 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
              <h3 className={`text-sm font-semibold mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Total WorkLog</h3>
              <div className="flex items-center justify-center">
                {/* Placeholder circle */}
                <div className={`w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center ${theme === "dark" ? "border-r-gray-700" : "border-r-gray-200"}`}>
                  <span className={`text-center font-semibold ${theme === "dark" ? "text-white" : "text-gray-700"}`}>
                    5w: 2d
                  </span>
                </div>
              </div>
              <p className={`text-center text-sm mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Statistics</p>
            </div>

            {/* Notifications */}
            <div className={`rounded-xl shadow-lg p-6 flex-1 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Notifications</h3>
                <button className="text-blue-600 text-xs hover:underline">View All</button>
              </div>
              <ul className="space-y-4">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${theme === "dark" ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                      {n.name[0]}
                    </div>
                    <div>
                      <p className={`text-sm ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                        <span className="font-medium">{n.name}</span> {n.action}
                      </p>
                      <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{n.time}</p>
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
