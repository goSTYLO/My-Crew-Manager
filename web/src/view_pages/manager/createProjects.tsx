import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebarLayout"; // <-- import Sidebar
import {
    Search,
    Bell,
    Menu,
    X,
    Plus,
    Minus,
} from "lucide-react";

// Models (MVC Architecture)
interface ProjectRole {
    id: string;
    name: string;
    role: string;
    isSelected: boolean;
}

interface Project {
    id: string;
    title: string;
    type: string;
    description: string;
    startDate: string;
    endDate: string;
    roles: ProjectRole[];
}

// Model Class
class ProjectModel {
    private projects: Project[] = [];

    createProject(project: Omit<Project, 'id'>): Project {
        const newProject: Project = {
            ...project,
            id: Date.now().toString()
        };
        this.projects.push(newProject);
        return newProject;
    }

    updateProject(id: string, updates: Partial<Project>): Project | null {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...updates };
            return this.projects[index];
        }
        return null;
    }

    deleteProject(id: string): boolean {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projects.splice(index, 1);
            return true;
        }
        return false;
    }

    getAllProjects(): Project[] {
        return [...this.projects];
    }
}

// Controller
class ProjectController {
    private model: ProjectModel;
    private view: any;

    constructor(model: ProjectModel) {
        this.model = model;
    }

    setView(view: any) {
        this.view = view;
    }

    handleCreateProject(projectData: Omit<Project, 'id'>) {
        try {
            const project = this.model.createProject(projectData);
            this.view?.onProjectCreated?.(project);
            return project;
        } catch (error) {
            this.view?.onError?.('Failed to create project');
            return null;
        }
    }

    handleUpdateProject(id: string, updates: Partial<Project>) {
        const project = this.model.updateProject(id, updates);
        if (project) {
            this.view?.onProjectUpdated?.(project);
        }
        return project;
    }

    handleDeleteProject(id: string) {
        const success = this.model.deleteProject(id);
        if (success) {
            this.view?.onProjectDeleted?.(id);
        }
        return success;
    }
}

const ProjectForm = ({ controller }: { controller: ProjectController }) => {
    const [formData, setFormData] = useState({
        title: 'Addodle',
        type: 'Type - I',
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text.',
        startDate: '01/06/2022',
        endDate: '01/12/2022'
    });

    // State for team roles with default 1 row
    const [teamRoles, setTeamRoles] = useState<ProjectRole[]>([
        {
            id: '1',
            name: '',
            role: '',
            isSelected: false
        }
    ]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTeamRoleChange = (id: string, field: keyof ProjectRole, value: string | boolean) => {
        setTeamRoles(prev => prev.map(role => 
            role.id === id ? { ...role, [field]: value } : role
        ));
    };

    const addTeamRole = () => {
        const newRole: ProjectRole = {
            id: Date.now().toString(),
            name: '',
            role: '',
            isSelected: false
        };
        setTeamRoles(prev => [...prev, newRole]);
    };

    const removeTeamRole = (id: string) => {
        // Prevent removing if it's the last remaining role
        if (teamRoles.length > 1) {
            setTeamRoles(prev => prev.filter(role => role.id !== id));
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            alert('Project deleted!');
        }
    };

   // Split roles into columns (first column = 6, next columns = 7 each)
    const rolesColumns: ProjectRole[][] = [];
    let startIndex = 0;

    // First column takes 6 roles max
    rolesColumns.push(teamRoles.slice(startIndex, startIndex + 6));
    startIndex += 6;

    // Remaining columns take 7 each
    while (startIndex < teamRoles.length) {
        rolesColumns.push(teamRoles.slice(startIndex, startIndex + 7));
        startIndex += 7;
    }

    const renderRolesColumn = (roles: ProjectRole[], columnIndex: number) => (
        <div
            key={columnIndex}
            className="max-w-md border border-gray-300 rounded-lg overflow-hidden"
        >
            {/* Only show Team Lead + Add button on the FIRST column */}
            {columnIndex === 0 && (
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <input
                        type="text"
                        placeholder="Team Lead"
                        className="bg-transparent text-sm font-medium text-gray-700 placeholder-gray-700 border-none outline-none flex-1"
                    />
                    <button
                        onClick={addTeamRole}
                        className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                        title="Add team member"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
    
            <div className="divide-y divide-gray-200">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                    >
                        <div className="flex items-center space-x-3 flex-1">
                            <input
                                type="text"
                                placeholder="Name"
                                value={role.name}
                                onChange={(e) =>
                                    handleTeamRoleChange(
                                        role.id,
                                        "name",
                                        e.target.value
                                    )
                                }
                                className="text-sm text-gray-900 bg-transparent border-none outline-none min-w-0 flex-1 placeholder-gray-400"
                            />
                            <input
                                type="text"
                                placeholder="Position"
                                value={role.role}
                                onChange={(e) =>
                                    handleTeamRoleChange(
                                        role.id,
                                        "role",
                                        e.target.value
                                    )
                                }
                                className="text-sm text-gray-500 italic bg-transparent border-none outline-none min-w-0 flex-1 placeholder-gray-400"
                            />
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                            <input
                                type="checkbox"
                                checked={role.isSelected}
                                onChange={(e) =>
                                    handleTeamRoleChange(
                                        role.id,
                                        "isSelected",
                                        e.target.checked
                                    )
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                            />
                            <button
                                onClick={() => removeTeamRole(role.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                title="Remove team member"
                                disabled={teamRoles.length <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


    return (
        <div className="bg-white rounded-lg border p-6 m-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                    >
                        <option value="Type - I">Type - I</option>
                        <option value="Type - II">Type - II</option>
                        <option value="Type - III">Type - III</option>
                    </select>
                </div>

                <div className="lg:col-span-1"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                        type="text"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                        type="text"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="lg:col-span-1"></div>
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Roles</h3>
                <div className="flex flex-wrap gap-6">
                    {rolesColumns.map((columnRoles, columnIndex) => 
                        renderRolesColumn(columnRoles, columnIndex)
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    onClick={handleDelete}
                    className="px-6 py-2 text-blue-600 bg-white border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Delete
                </button>
                <button
                    className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

// Main CreateProject Component
const CreateProject = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projectModel] = useState(() => new ProjectModel());
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [projectController] = useState(() => new ProjectController(projectModel));


    return (
        <div className="flex h-screen bg-gray-50">
            {/* ✅ Reusable Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

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
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">Projects / Create Project</h2>
                    </div>    
                    <ProjectForm controller={projectController} />  
                </main>
            </div>
        </div>
    );
};

export default CreateProject;