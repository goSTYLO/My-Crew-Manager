import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import {
    ChevronDown
} from "lucide-react";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext"; // <-- import ThemeContext

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
    private model: TaskModel;

    constructor(model: TaskModel) {
        this.model = model;
    }

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
    const { theme } = useTheme(); // <-- use theme
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: '',
        startDate: '',
        endDate: '',
        assignedTo: 'Yash Ghori',
        priority: 'Low' as "Low" | "Medium" | "High",
        status: 'Pending' as "Pending" | "On Hold" | "On Progress" | "Completed"
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
        <div className={`${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white"} p-6 rounded-lg border`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Task Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                            required
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Task Type</label>
                        <input
                            type="text"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Task Start Date</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Task End Date</label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                        />
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Task Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                    />
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {/* Assign To */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Assign to</label>
                        <div className="relative">
                            <select
                                value={formData.assignedTo}
                                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300"}`}
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
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Priority</label>
                        <div className="relative">
                            <select
                                value={formData.priority}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        priority: e.target.value as "Low" | "Medium" | "High",
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300"}`}
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
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>

                    {/* Task Status with oblong color badge */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Task Status</label>
                        <div className="relative">
                            <select
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        status: e.target.value as "Pending" | "On Hold" | "On Progress" | "Completed",
                                    })
                                }
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300"}`}
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
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                    <button
                        type="button"
                        onClick={handleDelete}
                        className={`px-6 py-2 text-sm font-medium ${theme === "dark" ? "text-white bg-gray-700 border-gray-700 hover:bg-gray-600" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
    const [taskController] = useState(() => new TaskController(taskModel));
    const [,setTasks] = useState<Task[]>([]);
    const { theme } = useTheme(); // <-- use theme

    const handleCreateTask = (taskData: Omit<Task, 'id'>) => {
        const newTask = taskController.createTask(taskData);
        setTasks(taskController.getAllTasks());
        console.log('Task created:', newTask);
    };

    return (
        <div className={`flex min-h-screen w-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
            {/* ✅ Reusable Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* ✅ Shared Navbar */}
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

                {/* Main Content Area */}
                <main className="flex-1 p-6">
                    <div className="mb-6">
                        <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Tasks / Create Tasks</h2>
                    </div>
                    <TaskForm onSubmit={handleCreateTask} />
                </main>
            </div>
        </div>
    );
};

export default CreateTask;