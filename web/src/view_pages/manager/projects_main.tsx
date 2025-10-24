import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebarLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { Search, Plus, Folder, FolderOpen } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";
import { useToast } from "../../components/ToastContext";

// Sample data for charts - TODO: Replace with real task statistics from backend
const taskData = [
    { name: 'Completed', value: 32, color: '#10B981' },
    { name: 'On Hold', value: 25, color: '#F59E0B' },
    { name: 'On Progress', value: 25, color: '#3B82F6' },
    { name: 'Pending', value: 18, color: '#EF4444' }
  ];

  // TODO: Replace with real performance data from backend
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
  // Old mock projects data removed - now fetched from backend



// Project Performance Component
const ProjectTask = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [projectsPerPage] = useState(9);
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { showError } = useToast();

    // API Configuration
    const AI_API_BASE_URL = `${API_BASE_URL}/api/ai`;

    // Fetch projects from backend
    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            console.log('🔍 Token from localStorage:', token ? 'Found' : 'Not found');
            if (!token) {
                showError('Authentication Required', 'You are not authenticated. Please log in.');
                navigate('/sign-in');
                return;
            }

            const response = await fetch(`${AI_API_BASE_URL}/projects/`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showError('Authentication Failed', 'Authentication failed. Please log in again.');
                    localStorage.removeItem('token');
                    navigate('/sign-in');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Sort projects by updated_at (most recent first)
            const sortedProjects = data.sort((a: any, b: any) => {
                const dateA = new Date(a.updated_at || a.created_at);
                const dateB = new Date(b.updated_at || b.created_at);
                return dateB.getTime() - dateA.getTime();
            });
            setProjects(sortedProjects);
            console.log('Fetched projects:', sortedProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Load projects on component mount
    useEffect(() => {
        fetchProjects();
    }, []);

    // Pagination logic
    const totalPages = Math.ceil(projects.length / projectsPerPage);
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const currentProjects = projects.slice(startIndex, endIndex);

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

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
                              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) / 2;
                                const x = (cx as number) + radius * Math.cos(-(midAngle as number) * (Math.PI / 180));
                                const y = (cy as number) + radius * Math.sin(-(midAngle as number) * (Math.PI / 180));
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
                                    {`${((percent as number) * 100).toFixed(0)}%`}
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
                          <span>{projects.length} projects</span>
                          {projects.length > projectsPerPage && (
                            <span className="text-xs">
                              (Page {currentPage} of {totalPages})
                            </span>
                          )}
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
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            Loading projects...
                          </div>
                        </div>
                      ) : error ? (
                        <div className="flex items-center justify-center h-full">
                          <div className={`text-sm ${theme === "dark" ? "text-red-400" : "text-red-500"}`}>
                            {error}
                          </div>
                        </div>
                      ) : projects.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            No projects found
                          </div>
                        </div>
                      ) : (
                        currentProjects.map((project: any) => (
                          <button
                            key={project.id}
                            onClick={() => navigate(`/project-details/${project.id}`)} 
                            className={`w-full flex items-center space-x-3 text-left p-2 rounded-md transition-shadow hover:shadow-md
                              ${theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-white border border-gray-100"}`}
                            style={{ minHeight: 56 }}
                            aria-label={`Open ${project.title}`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500`}>
                              <FolderOpen className={`w-5 h-5 text-white`} />
                            </div>

                            <div className="flex-1">
                              <div className={`text-sm font-medium truncate ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                                {project.title}
                              </div>
                              <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {projects.length > projectsPerPage && (
                      <div className="flex items-center justify-center space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentPage === 1
                              ? `text-gray-400 ${theme === "dark" ? "cursor-not-allowed" : "cursor-not-allowed"}`
                              : `text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${theme === "dark" ? "hover:bg-blue-900" : ""}`
                          }`}
                        >
                          Previous
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 text-sm rounded-md transition-colors ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : `text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${theme === "dark" ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : ""}`
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentPage === totalPages
                              ? `text-gray-400 ${theme === "dark" ? "cursor-not-allowed" : "cursor-not-allowed"}`
                              : `text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${theme === "dark" ? "hover:bg-blue-900" : ""}`
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
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