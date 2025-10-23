// userFrame.tsx
import React, { useState } from "react";
import Sidebar from "../../components/sidebarUser"; // user-side sidebar
import TopNavbarUser from "../../components/topbarLayout_user"; // user-side navbar
import { FolderOpen, Folder } from "lucide-react";
import { useTheme } from "../../components/themeContext";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Sample chart data (same as manager side)
const taskData = [
  { name: 'Completed', value: 32, color: '#10B981' },
  { name: 'On Hold', value: 25, color: '#F59E0B' },
  { name: 'On Progress', value: 25, color: '#3B82F6' },
  { name: 'Pending', value: 18, color: '#EF4444' }
];

const workLogData = [
  { name: 'Product 1', value: 30, color: '#EF4444' },
  { name: 'Product 2', value: 25, color: '#3B82F6' },
  { name: 'Product 3', value: 20, color: '#F59E0B' },
  { name: 'Product 4', value: 15, color: '#10B981' },
  { name: 'Product 5', value: 10, color: '#8B5CF6' }
];

const performanceData = [
  { month: 'Oct 2021', achieved: 3, target: 3 },
  { month: 'Nov 2021', achieved: 4, target: 4 },
  { month: 'Dec 2021', achieved: 3, target: 4 },
  { month: 'Jan 2022', achieved: 7, target: 5 },
  { month: 'Feb 2022', achieved: 5, target: 6 },
  { month: 'Mar 2022', achieved: 6, target: 4 }
];

const UserDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbarUser onMenuClick={() => setSidebarOpen(true)} />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          {/* Dashboard Heading */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Dashboard</h2>
          </div>

          {/* Row 1: Projects + Tasks */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Projects Card */}
            <div className={`rounded-xl shadow-lg border p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Projects</h2>
                <div className={`flex items-center space-x-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  <Folder className="w-4 h-4" />
                  <span>52 files</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((project) => (
                  <div key={project} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
                    <div className={`w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center`}>
                      <div className="text-center">
                        <div className={`w-8 h-8 bg-white rounded-lg mx-auto mb-2 flex items-center justify-center ${theme === "dark" ? "bg-gray-800" : ""}`}>
                          <FolderOpen className={`w-4 h-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                        </div>
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Project {project}</p>
                      </div>
                    </div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"} text-sm`}>Mobile App Design</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks Card */}
            <div className={`rounded-xl shadow-lg border p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-7">
                <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Tasks</h2>
                <select className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="flex items-center justify-center h-64">
                <div className="w-2/3 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={taskData} cx="25%" cy="50%" outerRadius={120} dataKey="value" labelLine={false} 
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                          const radius = innerRadius + (outerRadius - innerRadius) / 2;
                          const x = cx + radius * Math.cos(-(midAngle ?? 0) * (Math.PI / 180));
                          const y = cy + radius * Math.sin(-(midAngle ?? 0) * (Math.PI / 180));
                          return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">{`${((percent ?? 0) * 100).toFixed(0)}%`}</text>;
                        }}
                      >
                        {taskData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col space-y-2 ml-1">
                  {taskData.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Work Log + Performance */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
            {/* Work Log Card */}
            <div className={`rounded-xl shadow-lg border p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Work Log</h2>
                <label htmlFor="performance-timeframe" className="sr-only">Select Timeframe</label>
                <select id="performance-timeframe" className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>
              {/* Flex container for Pie + Legend */}
              <div className="flex items-center justify-center">
                {/* Pie Chart */}
                <div className="h-64 w-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workLogData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {workLogData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Product List */}
                <div className="ml-6 space-y-3">
                  {workLogData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between w-32">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{item.name}</span>
                      </div>
                      <span className={`text-xs font-medium ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Card */}
            <div className={`rounded-xl shadow-lg border p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Performance</h2>
                <label htmlFor="performance-select" className="sr-only">Performance Timeframe</label>
                <select id="performance-select" className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#f0f0f0"} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: theme === "dark" ? "#fff" : "#6B7280" }}
                      stroke={theme === "dark" ? "#fff" : "#6B7280"}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: theme === "dark" ? "#fff" : "#6B7280" }}
                      stroke={theme === "dark" ? "#fff" : "#6B7280"}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="achieved" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      name="Achieved"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#3B82F6" 
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>7 Projects Achieved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>5 Projects Target</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;