import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebarLayout";
import {
    Plus,
    Minus,
} from "lucide-react";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext"; // <-- import ThemeContext
import jsPDF from 'jspdf';
import axios from 'axios';

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

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/project-management';

// Model Class
class ProjectModel {
    async createProject(project: Omit<Project, 'id'>): Promise<Project> {
        try {
            // Helper function to convert date format from MM/DD/YYYY to YYYY-MM-DD
            const formatDateForAPI = (dateString: string) => {
                if (dateString.includes('/')) {
                    const [month, day, year] = dateString.split('/');
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
                return dateString; // Already in YYYY-MM-DD format
            };

            // Filter out empty roles (only include roles with both name and role filled)
            const validRoles = project.roles.filter(role => 
                role.name.trim() !== '' && role.role.trim() !== ''
            );

            const requestData = {
                title: project.title,           // Maps to 'name' in database
                type: project.type,             // Maps to 'project_type' in database  
                description: project.description,
                startDate: formatDateForAPI(project.startDate),   // Maps to 'start_date' in database
                endDate: formatDateForAPI(project.endDate),       // Maps to 'end_date' in database
                roles: validRoles.map(role => ({
                    id: role.id,
                    name: role.name,
                    role: role.role,
                    is_selected: role.isSelected
                }))
            };

            console.log('Sending request to:', `${API_BASE_URL}/projects/`);
            console.log('Request data:', requestData);

            const response = await axios.post(`${API_BASE_URL}/projects/`, requestData, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            console.log('API Response:', response.data);
            console.log('Response status:', response.status);

            return {
                id: response.data.project_id.toString(),
                title: response.data.title || response.data.name,
                type: response.data.type || response.data.project_type,
                description: response.data.description,
                startDate: response.data.startDate || response.data.start_date,
                endDate: response.data.endDate || response.data.end_date,
                roles: (response.data.roles || response.data.project_roles || []).map((role: any) => ({
                    id: role.id || Date.now().toString(),
                    name: role.name,
                    role: role.role,
                    isSelected: role.is_selected
                }))
            };
        } catch (error: any) {
            console.error('Error creating project:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error message:', error.message);
            
            if (error.response) {
                throw new Error(`Failed to create project: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else if (error.request) {
                throw new Error('Failed to create project: No response from server');
            } else {
                throw new Error(`Failed to create project: ${error.message}`);
            }
        }
    }

    async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
        try {
            const response = await axios.patch(`${API_BASE_URL}/projects/${id}/`, {
                title: updates.title,
                type: updates.type,
                description: updates.description,
                startDate: updates.startDate,
                endDate: updates.endDate,
                roles: updates.roles?.map(role => ({
                    id: role.id,
                    name: role.name,
                    role: role.role,
                    is_selected: role.isSelected
                }))
            });
            
            return {
                id: response.data.project_id.toString(),
                title: response.data.title || response.data.name,
                type: response.data.type || response.data.project_type,
                description: response.data.description,
                startDate: response.data.startDate || response.data.start_date,
                endDate: response.data.endDate || response.data.end_date,
                roles: (response.data.roles || response.data.project_roles || []).map((role: any) => ({
                    id: role.id || Date.now().toString(),
                    name: role.name,
                    role: role.role,
                    isSelected: role.is_selected
                }))
            };
        } catch (error) {
            console.error('Error updating project:', error);
            return null;
        }
    }

    async deleteProject(id: string): Promise<boolean> {
        try {
            await axios.delete(`${API_BASE_URL}/projects/${id}/`);
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            return false;
        }
    }

    async getAllProjects(): Promise<Project[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/projects/`);
            return response.data.map((project: any) => ({
                id: project.project_id.toString(),
                title: project.title || project.name,
                type: project.type || project.project_type,
                description: project.description,
                startDate: project.startDate || project.start_date,
                endDate: project.endDate || project.end_date,
                roles: (project.roles || project.project_roles || []).map((role: any) => ({
                    id: role.id || Date.now().toString(),
                    name: role.name,
                    role: role.role,
                    isSelected: role.is_selected
                }))
            }));
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
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

    async handleCreateProject(projectData: Omit<Project, 'id'>) {
        try {
            console.log('Controller: Creating project with data:', projectData);
            const project = await this.model.createProject(projectData);
            console.log('Controller: Project created successfully:', project);
            this.view?.onProjectCreated?.(project);
            return project;
        } catch (error: any) {
            console.error('Controller: Error creating project:', error);
            this.view?.onError?.(error.message || 'Failed to create project');
            throw error; // Re-throw to let the caller handle it
        }
    }

    async handleUpdateProject(id: string, updates: Partial<Project>) {
        try {
            const project = await this.model.updateProject(id, updates);
            if (project) {
                this.view?.onProjectUpdated?.(project);
            }
            return project;
        } catch (error) {
            this.view?.onError?.('Failed to update project');
            return null;
        }
    }

    async handleDeleteProject(id: string) {
        try {
            const success = await this.model.deleteProject(id);
            if (success) {
                this.view?.onProjectDeleted?.(id);
            }
            return success;
        } catch (error) {
            this.view?.onError?.('Failed to delete project');
            return false;
        }
    }
}

const ProjectForm = ({ controller }: { controller: ProjectController }) => {
    const { theme } = useTheme(); // <-- use theme
    const navigate = useNavigate(); // <-- add navigation hook
    const [formData, setFormData] = useState({
        title: 'Addodle',
        type: 'Type - I',
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text.',
        startDate: '2022-06-01',  // Changed to YYYY-MM-DD format
        endDate: '2022-12-01'     // Changed to YYYY-MM-DD format
    });

    // Validation state
    const [titleError, setTitleError] = useState<string | null>(null);
    const titleInputRef = React.useRef<HTMLInputElement | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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

    const generatePDF = () => {
        console.log('PDF generation started...', formData);
        const doc = new jsPDF();
        
        // Set font sizes
        const titleSize = 20;
        const headerSize = 14;
        const textSize = 12;
        
        let yPosition = 20;
        
        // Title
        doc.setFontSize(titleSize);
        doc.setFont("helvetica", "bold");
        doc.text("Project Details", 20, yPosition);
        yPosition += 15;
        
        // Project Information
        doc.setFontSize(headerSize);
        doc.setFont("helvetica", "bold");
        doc.text("Project Information", 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(textSize);
        doc.setFont("helvetica", "normal");
        doc.text(`Title: ${formData.title}`, 25, yPosition);
        yPosition += 8;
        doc.text(`Type: ${formData.type}`, 25, yPosition);
        yPosition += 8;
        doc.text(`Start Date: ${formData.startDate}`, 25, yPosition);
        yPosition += 8;
        doc.text(`End Date: ${formData.endDate}`, 25, yPosition);
        yPosition += 15;
        
        // Description
        doc.setFontSize(headerSize);
        doc.setFont("helvetica", "bold");
        doc.text("Description", 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(textSize);
        doc.setFont("helvetica", "normal");
        
        // Split description into multiple lines if it's too long
        const splitDescription = doc.splitTextToSize(formData.description, 170);
        doc.text(splitDescription, 25, yPosition);
        yPosition += splitDescription.length * 6 + 15;
        
        // Team Roles
        doc.setFontSize(headerSize);
        doc.setFont("helvetica", "bold");
        doc.text("Team Roles", 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(textSize);
        doc.setFont("helvetica", "normal");
        
        // Filter out empty roles
        const validRoles = teamRoles.filter(role => role.name.trim() || role.role.trim());
        
        if (validRoles.length > 0) {
            validRoles.forEach((role, index) => {
                const name = role.name || 'N/A';
                const position = role.role || 'N/A';
                const selected = role.isSelected ? '✓' : '✗';
                doc.text(`${index + 1}. ${name} - ${position} [Selected: ${selected}]`, 25, yPosition);
                yPosition += 8;
                
                // Add new page if content is too long
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
            });
        } else {
            doc.text("No team roles defined", 25, yPosition);
        }
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `Project_${formData.title.replace(/\s+/g, '_')}_${timestamp}.pdf`;
        
        console.log('Saving PDF with filename:', filename);
        // Save the PDF (download to user's machine)
        doc.save(filename);
        console.log('PDF download initiated');
    };

    const handleSave = async () => {
        console.log('Save button clicked');

        // Validate Project Title
        if (!formData.title || formData.title.trim() === '') {
            setTitleError('Project title is required');
            // focus title input
            titleInputRef.current?.focus();
            return;
        }

        // Clear any previous error
        setTitleError(null);
        setIsSaving(true);

        try {
            // Prepare project data
            const projectData = {
                title: formData.title,
                type: formData.type,
                description: formData.description,
                startDate: formData.startDate,
                endDate: formData.endDate,
                roles: teamRoles
            };

            console.log('Attempting to save project:', projectData);

            // Save to database via controller
            const savedProject = await controller.handleCreateProject(projectData);
            
            if (savedProject) {
                console.log('Project saved successfully to PostgreSQL:', savedProject);
                
                // Generate and download PDF to user's machine
                generatePDF();
                
                // Show success message with project ID
                alert(`Project saved to PostgreSQL database successfully!\nProject ID: ${savedProject.id}\nPDF downloaded to your machine!\n\nRedirecting to Projects page...`);
                
                // Redirect to monitor projects page after successful save
                setTimeout(() => {
                    navigate('/projects');
                }, 2000); // 2 second delay to allow user to see the success message
            } else {
                console.error('Controller returned null - project creation failed');
                alert('Failed to save project to database. Please check the browser console for details.');
            }
        } catch (error: any) {
            console.error('Error in handleSave:', error);
            const errorMessage = error?.message || 'Unknown error occurred';
            alert(`Error saving project to database: ${errorMessage}\n\nPlease check the browser console for more details.`);
        } finally {
            setIsSaving(false);
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
            className={`max-w-md border rounded-lg overflow-hidden ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"}`}
        >
            {/* Only show Team Lead + Add button on the FIRST column */}
            {columnIndex === 0 && (
                <div className={`px-4 py-3 border-b flex items-center justify-between ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                    <input
                        type="text"
                        placeholder="Team Lead"
                        className={`bg-transparent text-sm font-medium ${theme === "dark" ? "text-gray-200 placeholder-gray-400" : "text-gray-700 placeholder-gray-700"} border-none outline-none flex-1`}
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

            <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${theme === "dark" ? "hover:bg-gray-900" : ""}`}
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
                                className={`text-sm bg-transparent border-none outline-none min-w-0 flex-1 ${theme === "dark" ? "text-gray-100 placeholder-gray-400" : "text-gray-900 placeholder-gray-400"}`}
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
                                className={`text-sm italic bg-transparent border-none outline-none min-w-0 flex-1 ${theme === "dark" ? "text-gray-400 placeholder-gray-500" : "text-gray-500 placeholder-gray-400"}`}
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
                                className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0 ${theme === "dark" ? "bg-gray-900 border-gray-700" : "border-gray-300"}`}
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
        <div className={`rounded-lg border p-6 m-6 ${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"}`}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Project Title</label>
                    <input
                        ref={titleInputRef}
                        type="text"
                        value={formData.title}
                        onChange={(e) => {
                            handleInputChange('title', e.target.value);
                            if (e.target.value && e.target.value.trim() !== '') setTitleError(null);
                        }}
                        aria-invalid={!!titleError}
                        aria-describedby={titleError ? 'title-error' : undefined}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"} ${titleError ? 'border-red-500 ring-red-200' : ''}`}
                    />
                    {titleError && (
                        <p id="title-error" className="mt-1 text-sm text-red-600">{titleError}</p>
                    )}
                </div>
                
                <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Project Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-100 border-gray-300"}`}
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
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Start Date</label>
                    <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                    />
                </div>
                
                <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>End Date</label>
                    <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                    />
                </div>

                <div className="lg:col-span-1"></div>
            </div>

            <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Project Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}
                />
            </div>

            <div className="mb-6">
                <h3 className={`text-lg font-medium mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Project Roles</h3>
                <div className="flex flex-wrap gap-6">
                    {rolesColumns.map((columnRoles, columnIndex) => 
                        renderRolesColumn(columnRoles, columnIndex)
                    )}
                </div>
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    onClick={handleDelete}
                    className={`px-6 py-2 text-blue-600 border rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-blue-400 hover:bg-gray-700" : "bg-white border-blue-600"}`}
                >
                    Delete
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );
};

// Main CreateProject Component
const CreateProject = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [projectModel] = useState(() => new ProjectModel());
    const [projectController] = useState(() => new ProjectController(projectModel));
    const { theme } = useTheme(); // <-- use theme

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
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Projects / Create Project</h2>
                    </div>    
                    <ProjectForm controller={projectController} />  
                </main>
            </div>
        </div>
    );
};

export default CreateProject;