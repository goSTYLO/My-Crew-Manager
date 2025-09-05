import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Menu, X, FolderOpen, Folder  } from "lucide-react";
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar
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


// Sample data for charts
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

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  
  
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
                onClick={() => navigate('/signIn')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      

      {/* Sidebar Overlay (works for all screen sizes) */}
        <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
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
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <div className="absolute top-4 right-4">
            <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500"
            >
                <X className="w-6 h-6" />
            </button>
            </div>
            <Sidebar onLogout={() => setShowLogoutConfirm(true)} />
        </div>
        </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Menu button (always visible now) */}
            <button 
              className="p-2 text-gray-500 hover:text-gray-700 "
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">MyCrewManager</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for anything..."
                className="pl-10 pr-4 py-2 w-[500px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Notifications */}
            <button className="p-2 text-gray-500 hover:text-gray-700 relative -ml-2" title="Notifications" aria-label="Notifications">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="sm:block">
                <p className="text-sm font-medium text-gray-800">Kitkat</p>
                <p className="text-xs text-gray-500">Philippines</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                KK
              </div>
            </div>
          </div>
        </div>
      </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
              </div>
          {/* Row 1: Projects + Tasks */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
            
            {/* Projects Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Projects</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Folder className="w-4 h-4" />
                  <span>52 files</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((project) => (
                  <div key={project} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-white rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-gray-600" />
                        </div>
                        <p className="text-xs text-gray-600">Project {project}</p>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm">Mobile App Design</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Tasks Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
              <label htmlFor="timeframe-select" className="sr-only">Select Timeframe</label>
              <select id="timeframe-select" className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>This Week</option>
                <option>Last Week</option>
                <option>This Month</option>
              </select>
            </div>

            {/* Pie + Legend in one row */}
            <div className="flex items-center justify-center h-64">
              {/* Pie Chart */}
              <div className="w-2/3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskData}
                    cx="25%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="value"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) / 2;
                      const x = cx + radius * Math.cos(-(midAngle ?? 0) * (Math.PI / 180));
                      const y = cy + radius * Math.sin(-(midAngle ?? 0) * (Math.PI / 180));
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={13}
                          fontWeight="bold"
                        >
                          {`${((percent ?? 0) * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {taskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

              {/* Legend on the right (vertical) */}
              <div className="flex flex-col space-y-2 ml-1">
                {taskData.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>

          {/* Row 2: Work Log + Performance */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">

            {/* Work Log Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Work Log</h2>
                <label htmlFor="performance-timeframe" className="sr-only">Select Timeframe</label>
                <select id="performance-timeframe" className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-800">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Performance</h2>
                <label htmlFor="performance-select" className="sr-only">Performance Timeframe</label>
                <select id="performance-select" className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      stroke="#6B7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#6B7280"
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
                  <span className="text-sm text-gray-600">7 Projects Achieved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">5 Projects Target</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;