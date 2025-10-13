import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar
import { 
  Search, 
  Bell, 
  FolderOpen, 
  CheckSquare, 
  Clock, 
  TrendingUp,
  Menu,
  X,
  MessageSquareText
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


// Main Performance Component
const Performance = () => {
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
            
            {/* Sidebar Overlay */}
            <div
                className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
                    sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
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
                        sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 text-gray-500"
                            aria-label="Close sidebar"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <Sidebar onLogout={()=> setShowLogoutConfirm(true)}/>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                className="p-2 text-gray-500 hover:text-gray-700"
                                onClick={() => setSidebarOpen(true)}
                                aria-label="Open sidebar"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <h1 className="text-2xl font-semibold text-gray-800">
                                MyCrewManager
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Search Bar */}
                            <div className="block relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search for anything..."
                                    className="pl-10 pr-4 py-2 w-[300px] md:w-[500px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Notifications */}
                            <button
                                className="p-2 text-gray-500 hover:text-gray-700 relative -ml-2"
                                aria-label="Notifications"
                            >
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

                {/* Main Content Area */}
                <main className="flex-1 p-6 overflow-auto">
                    {/* Performance Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Projects</p>
                                    <p className="text-2xl font-semibold text-gray-900">24</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FolderOpen className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Completed</p>
                                    <p className="text-2xl font-semibold text-gray-900">18</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CheckSquare className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">In Progress</p>
                                    <p className="text-2xl font-semibold text-gray-900">4</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Efficiency</p>
                                    <p className="text-2xl font-semibold text-gray-900">92%</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Work Log Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-800">Work Log</h2>
                                <select className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                    </div>

                    {/* Additional Performance Metrics */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Development Team</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium">85%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Design Team</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium">92%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">QA Team</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div className="bg-orange-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                                        </div>
                                        <span className="text-sm font-medium">78%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Project Alpha completed</p>
                                        <p className="text-xs text-gray-500">2 hours ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">New milestone reached</p>
                                        <p className="text-xs text-gray-500">4 hours ago</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">Task assigned to team</p>
                                        <p className="text-xs text-gray-500">6 hours ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Goals</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">Monthly Target</span>
                                        <span className="text-sm font-medium">18/20</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">Quality Score</span>
                                        <span className="text-sm font-medium">9.2/10</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-gray-600">Client Satisfaction</span>
                                        <span className="text-sm font-medium">4.8/5</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Task Section */}
                    {/* Additional Section: Automatic Payment System */}
                    <div className="grid grid-cols-1 gap-6 mt-8">
                    {/* Task 1 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                        <div>
                        <h4 className="text-sm font-medium text-gray-800">
                            Make an Automatic Payment System that enable the design
                        </h4>
                        <p className="text-xs text-gray-500">#A32235 • Opened 10 days ago by Yash Ghel</p>
                        </div>
                        <div className="flex items-center space-x-4">
                        <button className="px-10 py-1 text-sm bg-green-100 text-green-600 rounded-lg 
                            hover:bg-green-600 hover:text-white ">
                            View
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img
                                src="https://i.pravatar.cc/40?img=1"
                                alt="user"
                                className="w-full h-full object-cover"
                            />
                            </div>
                            <MessageSquareText className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
                        </div>
                        </div>
                    </div>

                    {/* Task 2 */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                        <div>
                        <h4 className="text-sm font-medium text-gray-800">
                            Make an Automatic Payment System that enable the design
                        </h4>
                        <p className="text-xs text-gray-500">#A32236 • Opened 10 days ago by Yash Ghel</p>
                        </div>
                        <div className="flex items-center space-x-4">
                        <button className="px-10 py-1 text-sm bg-green-100 text-green-600 rounded-lg 
                            hover:bg-green-600 hover:text-white ">
                            View
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img
                                src="https://i.pravatar.cc/40?img=2"
                                alt="user"
                                className="w-full h-full object-cover"
                            />
                            </div>
                            <MessageSquareText className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
                        </div>
                        </div>
                    </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-center space-x-1 mt-6">
                            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
                            Previous
                            </button>
                            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                            1
                            </button>
                            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
                            2
                            </button>
                            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
                            3
                            </button>
                            <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
                            Next
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Performance;