import React from "react";

import { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import TopNavbar from "../../components/topbarLayouot";

const WorkLogsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content */}
        <main className="flex-1 flex gap-6 p-6">
          {/* Left side: Work logs */}
          <div className="flex-1 bg-white rounded-xl shadow p-6">
            {workLogs.map((log, idx) => (
              <div key={idx} className="flex items-start py-4 border-b border-gray-200 last:border-0">
                <span className="w-32 text-sm text-gray-500">{log.date}</span>
                <p className="text-gray-800 font-medium">{log.text}</p>
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="w-80 flex flex-col gap-6">
            {/* WorkLog Stats */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Total WorkLog</h3>
              <div className="flex items-center justify-center">
                {/* Placeholder circle */}
                <div className="w-32 h-32 rounded-full border-8 border-blue-500 border-r-gray-200 flex items-center justify-center">
                  <span className="text-center text-gray-700 font-semibold">
                    5w: 2d
                  </span>
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">Statistics</p>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow p-6 flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-600">Notifications</h3>
                <button className="text-blue-600 text-xs hover:underline">View All</button>
              </div>
              <ul className="space-y-4">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                      {n.name[0]}
                    </div>
                    <div>
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{n.name}</span> {n.action}
                      </p>
                      <p className="text-xs text-gray-500">{n.time}</p>
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
