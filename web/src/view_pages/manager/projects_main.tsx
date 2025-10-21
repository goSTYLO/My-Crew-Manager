import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Folder, FolderOpen } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";

// Sample data for charts
const taskData = [
    { name: 'Completed', value: 32, color: '#10B981' },
    { name: 'On Hold', value: 25, color: '#F59E0B' },
    { name: 'On Progress', value: 25, color: '#3B82F6' },
    { name: 'Pending', value: 18, color: '#EF4444' }
  ];

  const performanceData = [
    { month: 'Oct 2021', achieved: 3, target: 3 },
    { month: 'Nov 2021', achieved: 4, target: 4 },
    { month: 'Dec 2021', achieved: 3, target: 4 },
    { month: 'Jan 2022', achieved: 7, target: 5 },
    { month: 'Feb 2022', achieved: 5, target: 6 },
    { month: 'Mar 2022', achieved: 6, target: 4 }
  ];


const developers = [
    { id: 1, name: 'Alex Chen', avatar: 'bg-yellow-400' },
    { id: 2, name: 'Maria Garcia', avatar: 'bg-red-400' },
    { id: 3, name: 'David Kim', avatar: 'bg-green-400' },
    { id: 4, name: 'Sarah Johnson', avatar: 'bg-blue-400' },
    { id: 5, name: 'Mike Wilson', avatar: 'bg-teal-400' },
    { id: 6, name: 'Lisa Brown', avatar: 'bg-purple-400' },
    { id: 7, name: 'James Davis', avatar: 'bg-pink-400' },
    { id: 8, name: 'Emma Taylor', avatar: 'bg-gray-600' },
    { id: 9, name: 'Ryan Miller', avatar: 'bg-yellow-600' },
    { id: 10, name: 'Sophie Clark', avatar: 'bg-red-600' },
    { id: 11, name: 'Tom Anderson', avatar: 'bg-green-600' },
    { id: 12, name: 'Kate Lewis', avatar: 'bg-blue-600' },
    { id: 13, name: 'Chris Martinez', avatar: 'bg-teal-600' },
    { id: 14, name: 'Amy Rodriguez', avatar: 'bg-purple-600' },
    { id: 15, name: 'John Thompson', avatar: 'bg-pink-600' },
    { id: 16, name: 'Lisa Anderson', avatar: 'bg-gray-500' },
    { id: 17, name: 'Mark Wilson', avatar: 'bg-yellow-500' },
    { id: 18, name: 'Sarah Davis', avatar: 'bg-red-500' },
    { id: 19, name: 'Tom Brown', avatar: 'bg-green-500' },
    { id: 20, name: 'Emily Johnson', avatar: 'bg-blue-500' },
    { id: 21, name: 'Mike Garcia', avatar: 'bg-teal-500' },
  ];

  // Sample project data matching the image
  const projects = [
    { id: 1, name: 'Emo stuff', image: 'bg-gray-800' },
    { id: 2, name: 'Tim Burton', image: 'bg-gray-700' },
    { id: 3, name: 'Halloween', image: 'bg-orange-600' },
    { id: 4, name: 'Spooky Art', image: 'bg-blue-600' },
    { id: 5, name: 'Dark Art', image: 'bg-gray-500' },
    { id: 6, name: 'Gothic art', image: 'bg-gray-900' },
    { id: 7, name: '- happy :3', image: 'bg-orange-500' },
    { id: 8, name: '*VAMPYR*', image: 'bg-red-900' },
    { id: 9, name: 'I <3 Art', image: 'bg-gray-600' },
  ];



// Project Performance Component
const ProjectTask = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();
    const { theme } = useTheme();

    return (
      <div className={`flex min-h-screen w-full overflow-x-hidden ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>


            {/* ✅ Reusable Sidebar */}
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* ✅ Shared Navbar */}
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

              {/* Projects Content */}
              <main className="flex-1 p-4 lg:p-[100px] overflow-y-auto overflow-x-hidden space-y-[40px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                  <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Projects</h2>
                  <button 
                    onClick={() => navigate("/create-project")} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Create Project</span>
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* Tasks Card */}
                  <div className={`col-span-12 lg:col-span-4 rounded-xl shadow-sm border p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-7">
                      <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Project Status</h2>
                      <select className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                        <option>This Week</option>
                        <option>Last Week</option>
                        <option>This Month</option>
                      </select>
                    </div>
        
                    {/* Pie Chart */}
                    <div className="flex flex-col lg:flex-row items-center justify-center h-auto lg:h-64 space-y-4 lg:space-y-0">
                      <div className="w-full lg:w-2/3 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={taskData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              labelLine={false}
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                const radius = innerRadius + (outerRadius - innerRadius) / 2;
                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
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
                                    {`${(percent * 100).toFixed(0)}%`}
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
          
                      {/* Legend */}
                      <div className="flex flex-col space-y-2 lg:ml-4">
                        {taskData.map((item, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.color }}
                            ></div>
                            <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Card */}
                  <div className={`col-span-12 lg:col-span-4 rounded-xl shadow-sm border p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Performance</h2>
                      <select className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
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

                 {/* Projects Grid Section */}
                  <div
                    className={`col-span-12 lg:col-span-4 rounded-xl shadow-sm border p-6 ${
                      theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Projects</h2>
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center space-x-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                          <Folder className="w-4 h-4" />
                          <span>{projects.length} files</span>
                        </div>
                        <button 
                           onClick={() => navigate("#")} 
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          View all
                        </button>
                      </div>
                    </div>

                    {/* vertical list — fixed height, scrollable */}
                    <div className="flex flex-col gap-3 h-[310px] overflow-y-auto overflow-x-hidden pr-2">
                      {projects.slice(0, 9).map((project) => (
                        <button
                          key={project.id}
                          onClick={() => navigate("/projects")} 
                          className={`w-full flex items-center space-x-3 text-left p-2 rounded-md transition-shadow hover:shadow-md
                            ${theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-100"}`}
                          style={{ minHeight: 56 }}
                          aria-label={`Open ${project.name}`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${project.image}`}>
                            <FolderOpen className={`w-5 h-5 ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`} />
                          </div>

                          <div className="flex-1">
                            <div className={`text-sm font-medium truncate ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                              {project.name}
                            </div>
                            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Updated recently</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* UI Developers Section */}
                <div className={`mt-6 p-5 rounded-lg shadow-sm ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-5 gap-4">
                    <h3 className={`text-base font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>UI Developers (39)</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search for anything..."
                          className={`pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full text-sm ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                        />
                      </div>
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap">View all</a>
                    </div>
                  </div>

                  {/* Developers Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-6 mb-6">
                    {developers.slice(0, 21).map((developer) => (
                      <div key={developer.id} className="text-center group cursor-pointer">
                        <div className={`w-12 h-12 ${developer.avatar} rounded-full mb-2 mx-auto group-hover:scale-105 transition-transform flex items-center justify-center shadow-sm`}>
                          <span className="text-white font-medium text-sm">
                            {developer.name.split(' ').map(n => n.charAt(0)).join('')}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{developer.name}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-center space-x-1 flex-wrap gap-2">
                    <button className={`px-3 py-1 text-sm ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}>Previous</button>
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
                    <button className={`px-3 py-1 text-sm ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}>2</button>
                    <button className={`px-3 py-1 text-sm ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}>3</button>
                    <button className={`px-3 py-1 text-sm ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}>Next</button>
                  </div>
                </div>
                  
                </main>
            </div>
        </div>
    );
};

export default ProjectTask;