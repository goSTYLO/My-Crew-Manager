import React, { useState } from "react";
import {
  Search,
  Bell,
  FolderOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  MessageSquareText,
  Trophy,
  Medal,
  Award,
  Star,
  Target,
} from "lucide-react";
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

import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { useTheme } from "../../components/themeContext";

const workLogData = [
  { name: "Product 1", value: 30, color: "#EF4444" },
  { name: "Product 2", value: 25, color: "#3B82F6" },
  { name: "Product 3", value: 20, color: "#F59E0B" },
  { name: "Product 4", value: 15, color: "#10B981" },
  { name: "Product 5", value: 10, color: "#8B5CF6" },
];

const performanceData = [
  { month: "Oct 2021", achieved: 3, target: 3 },
  { month: "Nov 2021", achieved: 4, target: 4 },
  { month: "Dec 2021", achieved: 3, target: 4 },
  { month: "Jan 2022", achieved: 7, target: 5 },
  { month: "Feb 2022", achieved: 5, target: 6 },
  { month: "Mar 2022", achieved: 6, target: 4 },
];

// Developer Leaderboard Data (sorted by EXP)
const developerLeaderboard = [
  { rank: 1, name: "Sarah Johnson", role: "Senior Developer", exp: 15420, projects: 38, efficiency: 96, avatar: "SJ" },
  { rank: 2, name: "Michael Chen", role: "Lead Developer", exp: 14850, projects: 42, efficiency: 94, avatar: "MC" },
  { rank: 3, name: "Emily Rodriguez", role: "Full Stack Developer", exp: 13990, projects: 35, efficiency: 92, avatar: "ER" },
  { rank: 4, name: "David Kim", role: "Backend Developer", exp: 12750, projects: 31, efficiency: 90, avatar: "DK" },
  { rank: 5, name: "Jessica Martinez", role: "Frontend Developer", exp: 11680, projects: 29, efficiency: 89, avatar: "JM" },
  { rank: 6, name: "Ryan Thompson", role: "DevOps Engineer", exp: 10920, projects: 26, efficiency: 87, avatar: "RT" },
  { rank: 7, name: "Amanda Wilson", role: "UI/UX Developer", exp: 9850, projects: 24, efficiency: 85, avatar: "AW" },
  { rank: 8, name: "James Anderson", role: "Mobile Developer", exp: 8740, projects: 22, efficiency: 83, avatar: "JA" },
];

// Project Leaderboard Data (sorted by EXP)
const projectLeaderboard = [
  { rank: 1, name: "E-Commerce Platform", category: "Web Development", exp: 8950, completion: 100, team: 12, status: "Completed" },
  { rank: 2, name: "Mobile Banking App", category: "Mobile Development", exp: 8420, completion: 100, team: 10, status: "Completed" },
  { rank: 3, name: "AI Analytics Dashboard", category: "Data Science", exp: 7850, completion: 100, team: 8, status: "Completed" },
  { rank: 4, name: "Healthcare Portal", category: "Web Development", exp: 7320, completion: 95, team: 9, status: "In Progress" },
  { rank: 5, name: "Social Media Integration", category: "API Development", exp: 6890, completion: 100, team: 6, status: "Completed" },
  { rank: 6, name: "Cloud Infrastructure", category: "DevOps", exp: 6450, completion: 88, team: 7, status: "In Progress" },
  { rank: 7, name: "CRM System", category: "Enterprise Software", exp: 5920, completion: 100, team: 11, status: "Completed" },
  { rank: 8, name: "IoT Dashboard", category: "IoT Development", exp: 5380, completion: 92, team: 5, status: "In Progress" },
];

const Performance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch(rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500";
      case 3:
        return "bg-gradient-to-r from-orange-400 to-orange-600";
      default:
        return theme === "dark" ? "bg-gray-700" : "bg-gray-200";
    }
  };

  return (
    <div className={`flex min-h-screen w-full overflow-x-hidden ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px] pt-20">
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Total Projects</p>
                  <p className={`text-xl sm:text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>24</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Completed</p>
                  <p className={`text-xl sm:text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>18</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>In Progress</p>
                  <p className={`text-xl sm:text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>4</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Efficiency</p>
                  <p className={`text-xl sm:text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>92%</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Work Log Card */}
            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-base sm:text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Work Log</h2>
                <select className={`text-xs sm:text-sm border rounded-md px-2 sm:px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <div className="h-48 w-48 sm:h-56 sm:w-56 md:h-64 md:w-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workLogData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
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

                <div className="space-y-2 sm:space-y-3">
                  {workLogData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between w-full sm:w-32">
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
            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`text-base sm:text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Performance</h2>
                <select className={`text-xs sm:text-sm border rounded-md px-2 sm:px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="h-48 sm:h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#333" : "#f0f0f0"} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10, fill: theme === "dark" ? "#fff" : "#6B7280" }}
                      stroke={theme === "dark" ? "#fff" : "#6B7280"}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: theme === "dark" ? "#fff" : "#6B7280" }}
                      stroke={theme === "dark" ? "#fff" : "#6B7280"}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="achieved"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                      name="Achieved"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ fill: "#3B82F6", strokeWidth: 2, r: 3 }}
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>7 Projects Achieved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-600"}`}>5 Projects Target</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboards Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            {/* Developer Leaderboard */}
            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-base sm:text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Developer Leaderboard</h2>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Ranked by Experience Points</p>
                  </div>
                </div>
                <select className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>All Time</option>
                </select>
              </div>

              <div className="space-y-3">
                {developerLeaderboard.map((dev) => (
                  <div
                    key={dev.rank}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.02] ${
                      dev.rank <= 3
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600"
                          : "bg-gradient-to-r from-gray-50 to-white border border-gray-200 shadow-sm"
                        : theme === "dark"
                        ? "bg-gray-900 border border-gray-700"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getRankBadgeColor(dev.rank)}`}>
                        {dev.rank <= 3 ? (
                          getRankIcon(dev.rank)
                        ) : (
                          <span className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-gray-700"}`}>#{dev.rank}</span>
                        )}
                      </div>
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                        theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-700"
                      }`}>
                        {dev.avatar}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm truncate ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                          {dev.name}
                        </h3>
                        <p className={`text-xs truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                          {dev.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Projects</p>
                        <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>{dev.projects}</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Efficiency</p>
                        <p className={`text-sm font-semibold text-green-600`}>{dev.efficiency}%</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>EXP</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          {dev.exp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Leaderboard */}
            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-base sm:text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Project Leaderboard</h2>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Ranked by Total EXP Earned</p>
                  </div>
                </div>
                <select className={`text-xs border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                  <option>All Projects</option>
                  <option>Completed</option>
                  <option>In Progress</option>
                </select>
              </div>

              <div className="space-y-3">
                {projectLeaderboard.map((project) => (
                  <div
                    key={project.rank}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all hover:scale-[1.02] ${
                      project.rank <= 3
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-gray-700 to-gray-800 border border-gray-600"
                          : "bg-gradient-to-r from-gray-50 to-white border border-gray-200 shadow-sm"
                        : theme === "dark"
                        ? "bg-gray-900 border border-gray-700"
                        : "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getRankBadgeColor(project.rank)}`}>
                        {project.rank <= 3 ? (
                          getRankIcon(project.rank)
                        ) : (
                          <span className={`text-xs font-bold ${theme === "dark" ? "text-white" : "text-gray-700"}`}>#{project.rank}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-sm truncate ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                          {project.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <p className={`text-xs truncate ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            {project.category}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            project.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Team</p>
                        <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>{project.team}</p>
                      </div>
                      <div className="text-right hidden md:block">
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Progress</p>
                        <p className={`text-sm font-semibold ${project.completion === 100 ? "text-green-600" : "text-orange-600"}`}>
                          {project.completion}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>EXP</p>
                        <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          {project.exp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Team Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Development Team</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-16 sm:w-20 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Design Team</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-16 sm:w-20 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>QA Team</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-16 sm:w-20 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium">78%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Project Alpha completed</p>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>New milestone reached</p>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className={`text-xs sm:text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Task assigned to team</p>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>6 hours ago</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"}`}>
              <h3 className={`text-base sm:text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Goals</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Monthly Target</span>
                    <span className="text-xs sm:text-sm font-medium">18/20</span>
                  </div>
                  <div className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Quality Score</span>
                    <span className="text-xs sm:text-sm font-medium">9.2/10</span>
                  </div>
                  <div className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Client Satisfaction</span>
                    <span className="text-xs sm:text-sm font-medium">4.8/5</span>
                  </div>
                  <div className={`w-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"} rounded-full h-2`}>
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Performance;