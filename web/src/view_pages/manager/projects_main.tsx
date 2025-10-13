import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout"; // <-- import Sidebar
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Plus, 
} from 'lucide-react';
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
  ResponsiveContainer 
} from 'recharts';
import TopNavbar from "../../components/topbarLayouot";

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
    
    // FIXED: Replaced useNavigate with simple console.log for demo purposes
    const handleNavigation = (route: string) => {
        console.log(`Navigating to: ${route}`);
    };


    return (
        <div className="flex h-screen bg-gray-50">
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
              <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Projects</h2>
                  <button onClick={() => navigate("/projects")} className="p-1 rounded hover:bg-gray-200">
                    <Plus className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  {/* FIXED: Added col-span-4 to Tasks Card to properly display in grid */}
                  <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-7">
                      <h2 className="text-lg font-semibold text-gray-800">Project Status</h2>
                      <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>This Week</option>
                        <option>Last Week</option>
                        <option>This Month</option>
                      </select>
                    </div>
        
                    {/* FIXED: Made pie chart centered and responsive */}
                    <div className="flex flex-col lg:flex-row items-center justify-center h-auto lg:h-64 space-y-4 lg:space-y-0">
                      {/* Pie Chart - Made responsive and centered */}
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
          
                      {/* Legend - Made responsive and centered */}
                      <div className="flex flex-col space-y-2 lg:ml-4">
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

                  {/* FIXED: Added col-span-4 to Performance Card to properly display in grid */}
                  <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-800">Performance</h2>
                      <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
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

                  {/* Projects Grid Section - Takes 4 columns */}
                  <div className="col-span-12 lg:col-span-4 bg-white p-5 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-semibold text-gray-900">Projects</h3>
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800">View all</a>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {projects.map((project) => (
                        <div key={project.id} className="text-center group cursor-pointer">
                          <div className={`w-14 h-14 ${project.image} rounded-lg mb-2 mx-auto group-hover:scale-105 transition-transform flex items-center justify-center`}>
                            <span className="text-white text-xs font-medium">
                              {project.name === 'Halloween' ? '🎃' : 
                               project.name === 'Tim Burton' ? '🎭' :
                               project.name === 'Spooky Art' ? '👻' : ''}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate px-1">{project.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* UI Developers Section - Full width below */}
                <div className="mt-6 bg-white p-5 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-gray-900">UI Developers (39)</h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search for anything..."
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64 text-sm"
                        />
                      </div>
                      <a href="#" className="text-sm text-blue-600 hover:text-blue-800">View all</a>
                    </div>
                  </div>

                  {/* Developers Grid - 3 rows of 7 */}
                  <div className="grid grid-cols-7 gap-6 mb-6">
                    {developers.slice(0, 21).map((developer) => (
                      <div key={developer.id} className="text-center group cursor-pointer">
                        <div className={`w-12 h-12 ${developer.avatar} rounded-full mb-2 mx-auto group-hover:scale-105 transition-transform flex items-center justify-center shadow-sm`}>
                          <span className="text-white font-medium text-sm">
                            {developer.name.split(' ').map(n => n.charAt(0)).join('')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{developer.name}</p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-center space-x-1">
                    <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Previous</button>
                    <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">1</button>
                    <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">2</button>
                    <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">3</button>
                    <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Next</button>
                  </div>
                </div>
                  
                </main>
            </div>
        </div>
    );
};

export default ProjectTask;