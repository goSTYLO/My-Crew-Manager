import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Bell,
    Settings,
    LayoutDashboard,
    FolderOpen,
    CheckSquare,
    Clock,
    TrendingUp,
    Menu,
    X,
    LogOut,
    ChevronDown,
} from "lucide-react";

// Models (MVC Architecture)
interface Task {
    id: string;
    title: string;
    description: string;
    type: string;
    startDate: string;
    endDate: string;
    assignedTo: string;
    priority: 'Low' | 'Medium'  | 'High';
    status: 'Pending' | 'On Hold' | 'On Progress' | 'Completed';
}


// Task Model
class TaskModel {
    private tasks: Task[] = [];

    createTask(task: Omit<Task, 'id'>): Task {
        const newTask: Task = {
            id: Date.now().toString(),
            ...task
        };
        this.tasks.push(newTask);
        return newTask;
    }

    getTasks(): Task[] {
        return this.tasks;
    }

    updateTask(id: string, updates: Partial<Task>): Task | null {
        const taskIndex = this.tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            return this.tasks[taskIndex];
        }
        return null;
    }

    deleteTask(id: string): boolean {
        const initialLength = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== id);
        return this.tasks.length < initialLength;
    }
}

// Task Controller
class TaskController {
    constructor(private model: TaskModel) {}

    createTask(taskData: Omit<Task, 'id'>) {
        return this.model.createTask(taskData);
    }

    getAllTasks() {
        return this.model.getTasks();
    }

    updateTask(id: string, updates: Partial<Task>) {
        return this.model.updateTask(id, updates);
    }

    deleteTask(id: string) {
        return this.model.deleteTask(id);
    }
}

// Task Form Component
const TaskForm: React.FC<{ onSubmit: (task: Omit<Task, 'id'>) => void; onCancel?: () => void }> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '',
        startDate: '',
        endDate: '',
        assignedTo: 'Yash Ghori',
        priority: 'Low' as const,
        status: 'Pending' as const
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title.trim()) {
            onSubmit(formData);
            setFormData({
                title: '',
                description: '',
                type: '',
                startDate: '',
                endDate: '',
                assignedTo: 'Yash Ghori',
                priority: 'Low',
                status: 'Pending'
            });
        }
    };

    const handleDelete = () => {
        if (onCancel) {
            onCancel();
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                        <input
                            type="text"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task Start Date</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Task End Date</label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Task Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Assign To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assign to</label>
                        <div className="relative">
                            <select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                            >
                                <option value="Yash Ghori">Yash Ghori</option>
                                <option value="John Wayne">John Wayne</option>
                                <option value="Other User">Other User</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Priority with oblong color badge */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <div className="relative">
                        <select
                        value={formData.priority}
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            priority: e.target.value as  "Low" | "Medium" | "High",
                            })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
                        >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        </select>

                        {/* Overlayed oblong badge */}
                        <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-medium pointer-events-none
                            ${
                            formData.priority === "Low"
                                ? "bg-green-100 text-green-800"
                                : formData.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                        {formData.priority}
                        </span>

                        <ChevronDown
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                        />
                    </div>
                </div>

            {/* Task Status with oblong color badge */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task Status</label>
                    <div className="relative">
                        <select
                        value={formData.status}
                        onChange={(e) =>
                            setFormData({
                            ...formData,
                            status: e.target.value as "Pending" | "On Hold" | "In Progress" | "Completed",
                            })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10"
                        >
                        <option value="Pending">Pending</option>
                        <option value="On Hold">On Hold</option>
                        <option value="On Progress">On Progress</option>
                        <option value="Completed">Completed</option>
                        </select>

                        {/* Overlayed oblong badge */}
                        <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-medium pointer-events-none
                            ${
                            formData.status === "Pending"
                                ? "bg-red-100 text-red-800"
                                : formData.status === "On Hold"
                                ? "bg-orange-100 text-orange-800"
                                : formData.status === "On Progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                        >
                        {formData.status}
                        </span>

                        <ChevronDown
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={16}
                        />
                    </div>
                </div>
            </div>

                <div className="flex justify-end space-x-4 pt-6">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Delete
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Create
                    </button>
                </div>
            </form>
        </div>
    );
};

// Main CreateTask Component
const CreateTask = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [taskModel] = useState(() => new TaskModel());
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [taskController] = useState(() => new TaskController(taskModel));
    const [tasks, setTasks] = useState<Task[]>([]);
    const navigate = useNavigate();

    const navigationItems = [
        { name: "Dashboard", icon: LayoutDashboard, action: () => navigate("/main") },
        { name: "Project", icon: FolderOpen, action: () => navigate("/projects") },
        { name: "Task", icon: CheckSquare, active: true, action: () => navigate("/create") },
        { name: "Work Logs", icon: Clock, action: () => navigate("/worklogs") },
        { name: "Performance", icon: TrendingUp, action: () => navigate("/performance") },
        { name: "Settings", icon: Settings, action: () => navigate("/settings") },
        { name: "Logout", icon: LogOut, active: false, action: () => setShowLogoutConfirm(true) },
    ];

    const handleCreateTask = (taskData: Omit<Task, 'id'>) => {
        const newTask = taskController.createTask(taskData);
        setTasks(taskController.getAllTasks());
        console.log('Task created:', newTask);
    };

    const Sidebar = ({ className = "" }) => (
        <div className={`bg-white shadow-lg h-full ${className}`}>
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <span className="text-xl font-semibold text-gray-800">
                        MyCrewManager
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-6">
                {navigationItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={item.action ? item.action : undefined}
                        className={`flex items-center px-6 py-3 text-left w-full transition-colors ${
                            item.active
                                ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                    </button>
                ))}
            </nav>
        </div>
    );

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
                    <Sidebar />
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
                                    <p className="text-sm font-medium text-gray-800">John Wayne</p>
                                    <p className="text-xs text-gray-500">Philippines</p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                    JW
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 p-6">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Tasks / Create Tasks</h2>
                    </div>
                    <TaskForm onSubmit={handleCreateTask} />
                </main>
            </div>
        </div>
    );
};

export default CreateTask;