import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebarLayout";
import TopNavbar from '../../components/topbarLayouot';
import { useTheme } from "../../components/themeContext"; // <-- import ThemeContext
import axios from 'axios';

// Types for project data
interface Project {
  project_id: number;
  name: string;
  project_type: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

// Modal props interface
interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdate: (updatedProject: Project) => void;
  theme: string;
}

// Edit Project Modal Component
const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  onUpdate, 
  theme 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    project_type: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Configuration
  const API_BASE_URL = 'http://localhost:8000/api/project-management';

  // Update form data when project changes
  useEffect(() => {
    if (project) {
      // Format dates to YYYY-MM-DD for input fields
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        name: project.name,
        project_type: project.project_type,
        description: project.description,
        start_date: formatDateForInput(project.start_date),
        end_date: formatDateForInput(project.end_date)
      });
    }
  }, [project]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  const handleSave = async () => {
    if (!project) return;

    // Validation
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setError('Start and end dates are required');
      return;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.patch(`${API_BASE_URL}/projects/${project.project_id}/`, {
        title: formData.name,  // Maps to 'name' in database
        type: formData.project_type,  // Maps to 'project_type' in database
        description: formData.description,
        startDate: formData.start_date,  // Maps to 'start_date' in database
        endDate: formData.end_date  // Maps to 'end_date' in database
      });

      // Update the project with the response data
      const updatedProject: Project = {
        project_id: project.project_id,
        name: response.data.title || response.data.name || formData.name,
        project_type: response.data.type || response.data.project_type || formData.project_type,
        description: response.data.description || formData.description,
        start_date: response.data.startDate || response.data.start_date || formData.start_date,
        end_date: response.data.endDate || response.data.end_date || formData.end_date,
        created_at: project.created_at,
        updated_at: response.data.updated_at || new Date().toISOString()
      };

      onUpdate(updatedProject);
      onClose();
      console.log('Project updated successfully:', updatedProject);
    } catch (error: any) {
      console.error('Error updating project:', error);
      if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
        setError(`Failed to update project: ${errorMessage}`);
      } else {
        setError('Failed to update project. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl mx-4 rounded-lg shadow-xl ${
        theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Edit Project</h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-100 ${theme === "dark" ? "hover:bg-gray-700 text-gray-400" : "text-gray-500"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                Project Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark" 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="Enter project name"
              />
            </div>

            {/* Project Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                Project Type
              </label>
              <select
                value={formData.project_type}
                onChange={(e) => handleInputChange('project_type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark" 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="Type - I">Type - I</option>
                <option value="Type - II">Type - II</option>
                <option value="Type - III">Type - III</option>
              </select>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white" 
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                  theme === "dark" 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="Enter project description"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
                theme === "dark"
                  ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme(); // <-- use theme

  // API Configuration
  const API_BASE_URL = 'http://localhost:8000/api/project-management';

  // Fetch projects from database
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/projects/`);
      setProjects(response.data);
      console.log('Fetched projects:', response.data);
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

  // Handle opening edit modal
  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  // Handle closing edit modal
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedProject(null);
  };

  // Handle project update
  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.project_id === updatedProject.project_id ? updatedProject : project
      )
    );
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit',
      month: 'long', 
      year: 'numeric' 
    }).toUpperCase();
  };

  // Calculate project status based on dates
  const getProjectStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) {
      return { status: 'upcoming', color: 'blue' };
    } else if (today > end) {
      return { status: 'overdue', color: 'red' };
    } else {
      return { status: 'active', color: 'green' };
    }
  };

  // Members data (example)
  const members = [
    { name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'David', avatar: 'https://i.pravatar.cc/150?img=4' },
    { name: 'Eve', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Frank', avatar: 'https://i.pravatar.cc/150?img=6' },
    { name: 'Grace', avatar: 'https://i.pravatar.cc/150?img=7' },
    { name: 'Henry', avatar: 'https://i.pravatar.cc/150?img=8' },
  ];

  // Members component
  const Members = ({ members }: { members: { name: string; avatar: string }[] }) => (
    <div className="flex items-center -space-x-3 mt-2">
      {members.slice(0, 4).map((member, index) => (
        <img
          key={index}
          className="w-8 h-8 rounded-full border-2 border-white"
          src={member.avatar}
          alt={member.name}
        />
      ))}
      {members.length > 4 && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-red-100 flex items-center justify-center text-xs font-medium text-red-500">
          +{members.length - 4}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Projects</h2>
            <div className="flex items-center space-x-10">
              <button
                onClick={() => navigate("/create-project")}
                className={`px-14 py-3 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700 hover:bg-blue-600 hover:text-white" : "bg-white text-black border border-gray-300 hover:bg-blue-500 hover:text-white"} text-sm font-medium border rounded-lg shadow transition-colors`}
              >
                Create
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Loading projects...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500 text-lg">
                {error}
                <button 
                  onClick={fetchProjects}
                  className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* No Projects State */}
          {!loading && !error && projects.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className={`text-lg ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                No projects found. Create your first project!
              </div>
            </div>
          )}

          {/* Projects Grid */}
          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const projectStatus = getProjectStatus(project.start_date, project.end_date);
                return (
                  <div 
                    key={project.project_id} 
                    className={`${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-6`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <h2
                          className={`text-lg font-semibold cursor-pointer hover:text-blue-500 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                          onClick={() => navigate(`/project-task/${project.project_id}`)}
                          title="Click to view project details"
                        >
                          {project.name}
                        </h2>
                        <button
                          className={`transition-colors ${theme === "dark" ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-500"}`}
                          title="Edit Project"
                          onClick={() => handleEditProject(project)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 
                              1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 
                              1-1.897 1.13L6 18l.8-2.685a4.5 4.5 
                              0 0 1 1.13-1.897l8.932-8.931Zm0 
                              0L19.5 7.125M18 14v4.75A2.25 2.25 
                              0 0 1 15.75 21H5.25A2.25 2.25 
                              0 0 1 3 18.75V8.25A2.25 2.25 
                              0 0 1 5.25 6H10"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          projectStatus.status === 'active' ? 'bg-green-100 text-green-800' :
                          projectStatus.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {project.project_type}
                        </span>
                        <button className={`px-4 py-2 text-sm font-medium rounded-lg shadow transition-colors ${
                          projectStatus.status === 'overdue' 
                            ? (theme === "dark" ? "bg-red-900 text-red-200 border border-red-700" : "bg-red-100 text-red-600 border border-red-300")
                            : projectStatus.status === 'active'
                            ? (theme === "dark" ? "bg-green-900 text-green-200 border border-green-700" : "bg-green-100 text-green-600 border border-green-300")
                            : (theme === "dark" ? "bg-blue-900 text-blue-200 border border-blue-700" : "bg-blue-100 text-blue-600 border border-blue-300")
                        }`}>
                          {projectStatus.status === 'overdue' ? 'Overdue' : 
                           projectStatus.status === 'active' ? 'Active' : 'Upcoming'}
                        </button>
                      </div>
                    </div>

                    {/* Divider Line */}
                    <hr className="border-t-1.7 border-gray-300 dark:border-gray-600" />

                    {/* Project Details */}
                    <div className="rounded-xl p-4 bg-transparent">
                      <div className="rounded-xl p-4 bg-transparent">
                        <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-sm leading-relaxed line-clamp-3`}>
                          {project.description || 'No description available.'}
                        </p>
                        <div className="flex justify-between items-end mt-8">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              {/* Date Icon */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                className={`w-5 h-5 ${projectStatus.color === 'red' ? 'text-red-500' : projectStatus.color === 'green' ? 'text-green-500' : 'text-blue-500'}`}
                                fill="currentColor"
                              >
                                <path
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                                />
                              </svg>

                              {/* End Date */}
                              <p className={`font-medium text-sm ${projectStatus.color === 'red' ? 'text-red-500' : projectStatus.color === 'green' ? 'text-green-500' : 'text-blue-500'}`}>
                                End: {formatDate(project.end_date)}
                              </p>
                            </div>

                            {/* Project ID and Created Date */}
                            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                              ID: {project.project_id} • Created: {formatDate(project.created_at)}
                            </div>
                          </div>

                          {/* Members placeholder - can be integrated later */}
                          <Members members={members} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
        onUpdate={handleProjectUpdate}
        theme={theme}
      />
    </div>
  );
};

export default Projects;