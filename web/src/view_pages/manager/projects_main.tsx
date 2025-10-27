import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebarLayout";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { Search, Plus, Folder, FolderOpen } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";
import { useToast } from "../../components/ToastContext";
import { useRealtimeUpdates } from "../../hooks/useRealtimeUpdates";
import { 
  calculateAggregatedTaskStats, 
  generateProjectCreationTrends, 
  extractAllUsers,
  type AggregatedTaskStats,
  type MonthlyTrendData,
  type Collaborator
} from '../../utils/aggregatedAnalyticsUtils';

// Analytics data will be calculated dynamically from project backlogs


// All users will be fetched dynamically from the users API

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

    // Analytics state
    const [projectBacklogs, setProjectBacklogs] = useState<Array<{ projectId: number; backlog: any }>>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [aggregatedStats, setAggregatedStats] = useState<AggregatedTaskStats>({
      completed: 0,
      inProgress: 0,
      pending: 0,
      total: 0
    });
    const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendData>({
      months: [],
      completed: []
    });
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [timeFilter, setTimeFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<Collaborator | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showViewAllModal, setShowViewAllModal] = useState(false);
    const [modalCurrentPage, setModalCurrentPage] = useState(1);
    const projectsPerModalPage = 20;
    const [searchQuery, setSearchQuery] = useState('');

    // API Configuration
    const AI_API_BASE_URL = `${API_BASE_URL}/ai`;

    // Fetch projects from backend
    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = sessionStorage.getItem('token');
            console.log('🔍 Token from sessionStorage:', token ? 'Found' : 'Not found');
            if (!token) {
                showError('Authentication Required', 'You are not authenticated. Please log in.');
                navigate('/sign-in');
                return;
            }

            const response = await fetch(`${AI_API_BASE_URL}/projects/my-projects/`, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    showError('Authentication Failed', 'Authentication failed. Please log in again.');
                    sessionStorage.removeItem('token');
                    navigate('/sign-in');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📋 Raw projects data:', data);
            // Sort projects by updated_at (most recent first)
            const sortedProjects = data.sort((a: any, b: any) => {
                const dateA = new Date(a.updated_at || a.created_at);
                const dateB = new Date(b.updated_at || b.created_at);
                return dateB.getTime() - dateA.getTime();
            });
            console.log('📋 Sorted projects:', sortedProjects);
            setProjects(sortedProjects);
            console.log('Fetched projects:', sortedProjects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to transform backlog data
    const transformBacklog = (data: any) => {
      return {
        epics: (data.epics || []).map((epic: any) => ({
          ...epic,
          subEpics: (epic.sub_epics || []).map((subEpic: any) => ({
            ...subEpic,
            userStories: (subEpic.user_stories || []).map((story: any) => ({
              ...story,
              tasks: story.tasks || []
            }))
          }))
        }))
      };
    };

    // Helper function to filter tasks based on time filter
    const filterTasksByTime = (tasks: any[], timeFilter: string) => {
      if (timeFilter === 'all') return tasks;
      
      const now = new Date();
      let filterDate = new Date();
      
      switch (timeFilter) {
        case 'this_week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'last_week':
          filterDate.setDate(now.getDate() - 14);
          break;
        case 'this_month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'last_month':
          filterDate.setMonth(now.getMonth() - 2);
          break;
        default:
          return tasks;
      }
      
      return tasks.filter(task => {
        const taskDate = new Date(task.updated_at || task.created_at);
        return taskDate >= filterDate;
      });
    };

    // Filter projects based on search query
    const filterProjects = (projectsList: any[]) => {
      if (!searchQuery.trim()) return projectsList;
      
      const query = searchQuery.toLowerCase();
      return projectsList.filter(project => 
        project.title.toLowerCase().includes(query) ||
        (project.description && project.description.toLowerCase().includes(query))
      );
    };

    // Handle user click to show modal
    const handleUserClick = (collaborator: Collaborator) => {
      setSelectedUser(collaborator);
      setShowUserModal(true);
    };

    // Handle copy email to clipboard
    const handleCopyEmail = async (email: string) => {
      try {
        await navigator.clipboard.writeText(email);
        // You could add a toast notification here
        console.log('Email copied to clipboard:', email);
      } catch (err) {
        console.error('Failed to copy email:', err);
      }
    };

    // Close modal
    const closeUserModal = () => {
      setShowUserModal(false);
      setSelectedUser(null);
    };

    // Fetch analytics data for all owned projects
    const fetchAnalyticsData = async () => {
      try {
        setLoadingAnalytics(true);
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.log('❌ No token found for analytics');
          return;
        }

        // Filter projects where user is Owner (created_by matches current user)
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        // Try different possible user ID fields
        const userId = currentUser.id || currentUser.user_id || currentUser.pk;
        
        const ownedProjects = projects.filter(p => {
          return p.created_by === userId || p.user_id === userId || p.owner === userId;
        });

        let projectsToUse;
        if (ownedProjects.length === 0) {
          // Use all projects as fallback for testing
          projectsToUse = projects;
          
          if (projectsToUse.length === 0) {
            return;
          }
        } else {
          projectsToUse = ownedProjects;
        }

        // Fetch backlog for each project
        const backlogPromises = projectsToUse.map(async (project) => {
          const response = await fetch(`${AI_API_BASE_URL}/projects/${project.id}/backlog/`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            return { projectId: project.id, backlog: transformBacklog(data) };
          }
          return null;
        });

        // Fetch all users from the website
        const usersResponse = await fetch(`${API_BASE_URL}/user/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const backlogs = (await Promise.all(backlogPromises)).filter(b => b !== null);
        let allUsersData = [];

        if (usersResponse.ok) {
          allUsersData = await usersResponse.json();
        }

        setProjectBacklogs(backlogs);
        setAllUsers(allUsersData);

        // Calculate aggregated analytics
        const stats = calculateAggregatedTaskStats(backlogs, timeFilter);
        setAggregatedStats(stats);

        const trends = generateProjectCreationTrends(projectsToUse, timeFilter);
        setMonthlyTrends(trends);

        const collabs = extractAllUsers(allUsersData);
        setCollaborators(collabs);

      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    // Load projects on component mount
    useEffect(() => {
        fetchProjects();
    }, []);

    // Fetch analytics after projects are loaded
    useEffect(() => {
        if (projects.length > 0 && !loadingAnalytics) {
            fetchAnalyticsData();
        }
    }, [projects]);

    // Recalculate analytics when time filter changes
    useEffect(() => {
        if (projectBacklogs.length > 0) {
            const stats = calculateAggregatedTaskStats(projectBacklogs, timeFilter);
            setAggregatedStats(stats);
        }
        
        if (projects.length > 0) {
            const trends = generateProjectCreationTrends(projects, timeFilter);
            setMonthlyTrends(trends);
        }
    }, [timeFilter, projectBacklogs, projects]);

    // Reset to page 1 on search change
    useEffect(() => {
        setCurrentPage(1);
        setModalCurrentPage(1);
    }, [searchQuery]);

    // Real-time updates for project changes
    useRealtimeUpdates({
      callbacks: {
        onProjectUpdate: (data) => {
          console.log('📡 Real-time project update received:', data);
          // Refresh projects list when any project is updated
          fetchProjects();
        },
        onTaskUpdate: (data) => {
          console.log('📡 Real-time task update received:', data);
          // Refresh analytics when tasks are updated
          if (projects.length > 0) {
            fetchAnalyticsData();
          }
        },
        onMemberUpdate: (data) => {
          console.log('📡 Real-time member update received:', data);
          // Refresh projects list when members are updated
          fetchProjects();
        }
      }
    });

    // Pagination logic
    // Apply search filter before pagination
    const filteredProjects = filterProjects(projects);
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const currentProjects = filteredProjects.slice(startIndex, endIndex);

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

    // Modal pagination functions
    const modalFilteredProjects = filterProjects(projects);
    const totalModalPages = Math.ceil(modalFilteredProjects.length / projectsPerModalPage);
    const modalStartIndex = (modalCurrentPage - 1) * projectsPerModalPage;
    const modalEndIndex = modalStartIndex + projectsPerModalPage;
    const modalProjects = modalFilteredProjects.slice(modalStartIndex, modalEndIndex);

    const handleModalPageChange = (page: number) => {
        setModalCurrentPage(page);
    };

    const handleModalPreviousPage = () => {
        if (modalCurrentPage > 1) {
            setModalCurrentPage(modalCurrentPage - 1);
        }
    };

    const handleModalNextPage = () => {
        if (modalCurrentPage < totalModalPages) {
            setModalCurrentPage(modalCurrentPage + 1);
        }
    };

    // Calculate dynamic data for charts
    const taskData = aggregatedStats.total > 0 ? [
      { name: 'Completed', value: aggregatedStats.completed, color: '#10B981' },
      { name: 'In Progress', value: aggregatedStats.inProgress, color: '#3B82F6' },
      { name: 'Pending', value: aggregatedStats.pending, color: '#EF4444' }
    ] : [
      { name: 'No Data', value: 1, color: '#6B7280' }
    ];

    const performanceData = monthlyTrends.months.length > 0 ? monthlyTrends.months.map((period, i) => ({
      month: period,
      completed: monthlyTrends.completed[i] || 0,
      target: Math.ceil(monthlyTrends.completed.reduce((a, b) => a + b, 0) / monthlyTrends.completed.length) || 0
    })) : [
      { month: 'No Data', completed: 0, target: 0 }
    ];

    // Calculate dynamic data for charts

    return (
      <div className={`flex min-h-screen w-full overflow-x-hidden overflow-y-auto ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>


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
              <main className="flex-1 p-4 lg:p-[100px] overflow-y-auto overflow-x-hidden space-y-[40px] pt-20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                  <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Projects</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 text-sm ${
                          theme === "dark" ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" : "border-gray-300"
                        }`}
                      />
                    </div>
                    <button 
                      onClick={() => navigate("/create-project")} 
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">Create Project</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
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
                          <span>{filteredProjects.length} projects</span>
                          {filteredProjects.length > projectsPerPage && (
                            <span className="text-xs">
                              (Page {currentPage} of {totalPages})
                            </span>
                          )}
                        </div>
                        <button 
                           onClick={() => setShowViewAllModal(true)} 
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
                      ) : filteredProjects.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            {searchQuery ? 'No projects match your search' : 'No projects found'}
                          </div>
                        </div>
                      ) : (
                        currentProjects.map((project: any) => (
                          <div
                            key={project.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                              theme === "dark" 
                                ? "bg-gray-700 border-gray-600 hover:bg-gray-600" 
                                : "bg-gray-50 border-gray-200 hover:bg-white"
                            }`}
                            onClick={() => navigate(`/project-details/${project.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-gray-600" : "bg-blue-100"}`}>
                                  <FolderOpen className={`w-4 h-4 ${theme === "dark" ? "text-blue-300" : "text-blue-600"}`} />
                                </div>
                                <div>
                                  <h3 className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                    {project.title}
                                  </h3>
                                  <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                    {project.description || 'No description'}
                                  </p>
                                </div>
                              </div>
                              <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                {new Date(project.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Pagination Controls */}
                    {filteredProjects.length > projectsPerPage && (
                      <div className={`flex items-center justify-between mt-4 pt-4 border-t ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}>
                        <button 
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentPage === 1 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : theme === "dark"
                              ? 'text-blue-400 hover:bg-gray-700'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          Previous
                        </button>
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const getPaginationButtons = (currentPage: number, totalPages: number) => {
                              if (totalPages <= 4) return Array.from({ length: totalPages }, (_, i) => i + 1);
                              
                              const buttons: (number | string)[] = [1];
                              
                              if (currentPage > 3) buttons.push('...');
                              
                              for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                if (i !== 1 && i !== totalPages) buttons.push(i);
                              }
                              
                              if (currentPage < totalPages - 2) buttons.push('...');
                              
                              if (totalPages > 1) buttons.push(totalPages);
                              
                              return buttons;
                            };
                            
                            return getPaginationButtons(currentPage, totalPages).map((page, index) => (
                              page === '...' ? (
                                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                              ) : (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page as number)}
                                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    currentPage === page
                                      ? 'bg-blue-600 text-white'
                                      : theme === "dark"
                                      ? 'text-gray-300 hover:bg-gray-700'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            ));
                          })()}
                        </div>
                        <button 
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentPage === totalPages 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : theme === "dark"
                              ? 'text-blue-400 hover:bg-gray-700'
                              : 'text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tasks Card */}
                  <div className={`col-span-12 lg:col-span-4 rounded-xl shadow-sm border p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-7">
                      <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Task Status Across All Projects</h2>
                      <select 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                      >
                        <option value="all">All Time</option>
                        <option value="this_week">This Week</option>
                        <option value="last_week">Last Week</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                      </select>
                    </div>
        
                    {/* Pie Chart */}
                    <div className="flex flex-col lg:flex-row items-center justify-center h-auto lg:h-64 space-y-4 lg:space-y-0 relative z-10">
                      <div className="w-full lg:w-2/3 h-64 relative z-10">
                        {loadingAnalytics ? (
                          <div className="flex items-center justify-center h-full">
                            <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                              Loading analytics...
                            </div>
                          </div>
                        ) : (
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
                        )}
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
                      <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Project Creation Trends</h2>
                      <select 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                      >
                        <option value="all">All Time</option>
                        <option value="this_week">This Week</option>
                        <option value="last_week">Last Week</option>
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                      </select>
                    </div>
                    <div className="h-64 relative z-10">
                      {loadingAnalytics ? (
                        <div className="flex items-center justify-center h-full">
                          <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            Loading performance data...
                          </div>
                        </div>
                      ) : (
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
                              dataKey="completed" 
                              stroke="#10B981" 
                              strokeWidth={2}
                              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                              name="Projects Created"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="target" 
                              stroke="#3B82F6" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                              name="Average Target"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="flex items-center justify-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>Projects Created</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>Average Target</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* UI Developers Section */}
                <div className={`mt-6 p-5 rounded-lg shadow-sm ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-5 gap-4">
                    <h3 className={`text-base font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>All Users ({collaborators.length})</h3>
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
                    {loadingAnalytics ? (
                      <div className="col-span-full flex items-center justify-center py-8">
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                          Loading collaborators...
                        </div>
                      </div>
                    ) : (
                      collaborators.slice(0, 21).map((collaborator) => (
                        <div 
                          key={collaborator.id} 
                          className="text-center group cursor-pointer"
                          onClick={() => handleUserClick(collaborator)}
                        >
                          <div 
                            className="w-12 h-12 rounded-full mb-2 mx-auto group-hover:scale-105 transition-transform flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: collaborator.avatar }}
                          >
                            <span className="text-white font-medium text-sm">
                              {collaborator.name.split(' ').map(n => n.charAt(0)).join('')}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{collaborator.name}</p>
                        </div>
                      ))
                    )}
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

            {/* User Details Modal */}
            {showUserModal && selectedUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg p-6 max-w-md w-full mx-4 shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      User Details
                    </h3>
                    <button
                      onClick={closeUserModal}
                      className={`text-gray-400 hover:text-gray-600 ${theme === "dark" ? "hover:text-gray-200" : ""}`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: selectedUser.avatar }}
                    >
                      <span className="text-white font-medium text-lg">
                        {selectedUser.name.split(' ').map(n => n.charAt(0)).join('')}
                      </span>
                    </div>
                    <div>
                      <h4 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {selectedUser.name}
                      </h4>
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        User ID: {selectedUser.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Email Address
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={selectedUser.email}
                          readOnly
                          className={`flex-1 px-3 py-2 border rounded-md ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300 text-gray-900"}`}
                        />
                        <button
                          onClick={() => handleCopyEmail(selectedUser.email)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            theme === "dark" 
                              ? "bg-blue-600 hover:bg-blue-700 text-white" 
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={closeUserModal}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          theme === "dark" 
                            ? "bg-gray-600 hover:bg-gray-700 text-white" 
                            : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                        }`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View All Projects Modal */}
            {showViewAllModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className={`rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}>
                  {/* Modal Header */}
                  <div className={`flex items-center justify-between p-6 border-b ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <h3 className={`text-xl font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      All Projects ({modalFilteredProjects.length})
                    </h3>
                    <button
                      onClick={() => setShowViewAllModal(false)}
                      className={`text-gray-400 hover:text-gray-600 ${
                        theme === "dark" ? "hover:text-gray-200" : ""
                      }`}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Modal Content - Grid of Projects */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    <div className="grid grid-cols-4 gap-4">
                      {modalProjects.map((project: any) => (
                        <div
                          key={project.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                            theme === "dark" 
                              ? "bg-gray-700 border-gray-600 hover:bg-gray-600" 
                              : "bg-gray-50 border-gray-200 hover:bg-white"
                          }`}
                          onClick={() => {
                            setShowViewAllModal(false);
                            navigate(`/project-details/${project.id}`);
                          }}
                        >
                          <div className={`w-full h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center ${
                            theme === "dark" ? "from-blue-900 to-purple-900" : ""
                          }`}>
                            <FolderOpen className={`w-8 h-8 ${
                              theme === "dark" ? "text-blue-300" : "text-blue-600"
                            }`} />
                          </div>
                          <h4 className={`font-medium text-sm mb-1 truncate ${
                            theme === "dark" ? "text-white" : "text-gray-900"
                          }`}>
                            {project.title}
                          </h4>
                          <p className={`text-xs truncate ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>
                            {project.description || 'No description'}
                          </p>
                          <p className={`text-xs mt-2 ${
                            theme === "dark" ? "text-gray-500" : "text-gray-400"
                          }`}>
                            {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modal Pagination */}
                  <div className={`flex items-center justify-between p-6 border-t ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <button 
                      onClick={handleModalPreviousPage}
                      disabled={modalCurrentPage === 1}
                      className={`px-4 py-2 text-sm rounded-md transition-colors ${
                        modalCurrentPage === 1 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : theme === "dark"
                          ? 'text-blue-400 hover:bg-gray-700'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const getPaginationButtons = (currentPage: number, totalPages: number) => {
                          if (totalPages <= 4) return Array.from({ length: totalPages }, (_, i) => i + 1);
                          
                          const buttons: (number | string)[] = [1];
                          
                          if (currentPage > 3) buttons.push('...');
                          
                          for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                            if (i !== 1 && i !== totalPages) buttons.push(i);
                          }
                          
                          if (currentPage < totalPages - 2) buttons.push('...');
                          
                          if (totalPages > 1) buttons.push(totalPages);
                          
                          return buttons;
                        };
                        
                        return getPaginationButtons(modalCurrentPage, totalModalPages).map((page, index) => (
                          page === '...' ? (
                            <span key={`modal-ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => handleModalPageChange(page as number)}
                              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                modalCurrentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : theme === "dark"
                                  ? 'text-gray-300 hover:bg-gray-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        ));
                      })()}
                    </div>
                    <button 
                      onClick={handleModalNextPage}
                      disabled={modalCurrentPage === totalModalPages}
                      className={`px-4 py-2 text-sm rounded-md transition-colors ${
                        modalCurrentPage === totalModalPages 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : theme === "dark"
                          ? 'text-blue-400 hover:bg-gray-700'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default ProjectTask;