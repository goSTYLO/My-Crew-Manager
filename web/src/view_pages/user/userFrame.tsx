// userFrame.tsx
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/sidebarUser"; // user-side sidebar
import TopNavbarUser from "../../components/topbarLayout_user"; // user-side navbar
import { FolderOpen, Folder, Users, Calendar, Download } from "lucide-react";
import { useTheme } from "../../components/themeContext";
import { useNavigate } from "react-router-dom";
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

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/ai';

// Project interface
interface Project {
  id: number;
  title: string;
  summary?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  project_file?: string;
  project_file_url?: string;
  project_file_download_url?: string;
}

const UserDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/projects/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication failed');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProjects(data.slice(0, 4)); // Show only first 4 projects in dashboard
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Load projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle project click
  const handleProjectClick = (projectId: number) => {
    navigate(`/project-details/${projectId}`);
  };

  // Handle project file download
  const handleProjectFileDownload = async (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    if (!project.project_file_download_url) {
      console.error('No download URL available');
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(project.project_file_download_url, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get filename from content-disposition header or use a default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'project-file';
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

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
                  <span>{projects.length} projects</span>
                </div>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`border rounded-lg p-4 animate-pulse h-48 w-full overflow-hidden ${theme === "dark" ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"}`}>
                      <div className={`w-full h-24 bg-gradient-to-br ${theme === "dark" ? "from-gray-700 to-gray-800" : "from-gray-200 to-gray-300"} rounded-lg mb-2`}></div>
                      <div className="h-20 flex flex-col justify-between overflow-hidden">
                        <div>
                          <div className={`h-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} rounded mb-2`}></div>
                          <div className={`h-3 ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded w-2/3 mb-1`}></div>
                          <div className={`h-3 ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded w-1/2`}></div>
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                          <div className={`h-3 ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded w-16`}></div>
                          <div className={`h-3 ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} rounded w-12`}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  <p>{error}</p>
                </div>
              ) : projects.length === 0 ? (
                <div className={`text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No projects found</p>
                  <p className="text-sm mt-2">You haven't been assigned to any projects yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {projects.map((project, index) => (
                    <div 
                      key={project.id} 
                      onClick={() => handleProjectClick(project.id)}
                      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:scale-105 h-48 w-full ${theme === "dark" ? "border-gray-700 bg-gray-900 hover:bg-gray-800" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                    >
                      <div className={`w-full h-24 bg-gradient-to-br ${
                        index % 4 === 0 ? "from-blue-100 to-purple-100" :
                        index % 4 === 1 ? "from-green-100 to-blue-100" :
                        index % 4 === 2 ? "from-purple-100 to-pink-100" :
                        "from-orange-100 to-red-100"
                      } rounded-lg mb-2 flex items-center justify-center relative overflow-hidden`}>
                        <div className="text-center z-10 px-2 w-full max-w-full">
                          <div className={`w-8 h-8 bg-white bg-opacity-80 rounded-lg mx-auto mb-1 flex items-center justify-center ${theme === "dark" ? "bg-gray-800 bg-opacity-80" : ""}`}>
                            <FolderOpen className={`w-4 h-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                          </div>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-700"} font-medium overflow-hidden text-ellipsis whitespace-nowrap px-1`} title={project.title}>
                            {project.title}
                          </p>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-2 right-2 opacity-20">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="absolute bottom-2 left-2 opacity-20">
                          <Calendar className="w-4 h-4" />
                        </div>
                        {/* Download button if file exists */}
                        {project.project_file && (
                          <div className="absolute bottom-2 right-2">
                            <button
                              onClick={(e) => handleProjectFileDownload(project, e)}
                              className={`p-1 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100 transition-all ${theme === "dark" ? "bg-gray-800 bg-opacity-90 hover:bg-opacity-100" : ""}`}
                              title="Download project file"
                            >
                              <Download className={`w-3 h-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col h-20 justify-between overflow-hidden">
                        <div className="overflow-hidden flex-1 min-h-0">
                          <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"} text-sm leading-tight mb-1 overflow-hidden text-ellipsis whitespace-nowrap`} title={project.title}>
                            {project.title}
                          </h3>
                          <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"} leading-tight h-8 overflow-hidden`}>
                            <div 
                              className="break-words" 
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1rem',
                                maxHeight: '2rem'
                              }}
                              title={project.summary || 'No description'}
                            >
                              {project.summary || 'No description available'}
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center justify-between text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"} h-4 flex-shrink-0 mt-1`}>
                          <span className="overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-2" title={`By ${project.created_by_name}`}>
                            By {project.created_by_name}
                          </span>
                          <span className="flex-shrink-0 text-right whitespace-nowrap">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                          const radius = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) / 2;
                          const x = (cx as number) + radius * Math.cos(-((midAngle ?? 0) as number) * (Math.PI / 180));
                          const y = (cy as number) + radius * Math.sin(-((midAngle ?? 0) as number) * (Math.PI / 180));
                          return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">{`${(((percent ?? 0) as number) * 100).toFixed(0)}%`}</text>;
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