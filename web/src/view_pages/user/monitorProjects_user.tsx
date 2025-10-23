import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { Search, Mail } from "lucide-react";
import { useTheme } from "../../components/themeContext";

// ✅ Types
interface Member {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: number;
  title: string;
  summary: string;
  created_by: Member;
  created_at: string;
  member_count: number;
  task_count: number;
  status: "Completed" | "Ongoing" | "Offtrack";
}

// API functions
const API_BASE_URL = 'http://localhost:8000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const apiHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  };
};

const projectAPI = {
  getMyProjects: async () => {
    // First, get accepted invitations
    const invitationsResponse = await fetch(`${API_BASE_URL}/ai/invitations/my-invitations/`, {
      headers: apiHeaders()
    });
    
    if (!invitationsResponse.ok) {
      throw new Error(`Failed to fetch invitations: ${invitationsResponse.statusText}`);
    }
    
    const invitationsData = await invitationsResponse.json();
    const acceptedProjects = invitationsData.invitations
      .filter(invitation => invitation.status === 'accepted')
      .map(invitation => ({
        id: invitation.project.id,
        title: invitation.project.title,
        summary: invitation.project.summary,
        created_by: invitation.project.created_by,
        created_at: invitation.project.created_at,
        member_count: invitation.project.member_count,
        task_count: invitation.project.task_count,
        status: "Ongoing" as const
      }));

    return { projects: acceptedProjects };
  }
};



// ✅ Project Card Component
const ProjectCard = ({ project, theme }: { project: Project; theme: string }) => {
  const navigate = useNavigate();
  const createdDate = new Date(project.created_at).toLocaleDateString();

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          {project.title}
        </div>
        <button className={`px-4 py-2 text-sm font-medium border rounded-lg shadow transition-colors ${theme === 'dark' ? 'bg-gray-700 text-gray-200 border-gray-600 hover:text-green-400 hover:bg-green-900' : 'bg-white text-black border-gray-300 hover:text-green-600 hover:bg-green-100'}`}>
          {project.status}
        </button>
      </div>

      <hr className={`border-t-1.7 ${theme === 'dark' ? 'border-gray-600' : 'border-black'}`} />

      {/* Content */}
      <div className="rounded-xl p-4 bg-transparent">
        <p className={`text-medium leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-black-600'}`}>
          {project.summary}
        </p>

        <div className="flex justify-between items-end mt-12">
          {/* Left side */}
          <div className="flex flex-col gap-2">
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Created on: {createdDate}
            </p>
            <p className={`font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              By: {project.created_by.name}
            </p>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                />
              </svg>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{project.task_count} tasks</p>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{project.member_count} members</p>
            </div>
            <button
              className={`px-8 py-1 text-sm rounded-lg transition ${theme === 'dark' ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
              onClick={() => navigate("/project-details/")}
              // onClick={() => navigate(`/project-details/${project.id}`)} (when already connected)
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Main Component
const Projects = () => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectAPI.getMyProjects();
        setProjects(response.projects || []);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          {/* Header with search and invitation button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Projects</h2>
            
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="relative w-[400px]">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search for anything..."
                  className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-800'}`}
                />
              </div>

              {/* Project Invitation Button */}
              <button
                onClick={() => navigate('/project-invitation')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Mail className="w-5 h-5" />
                <span>Project Invitations</span>
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className={`rounded-lg border p-12 text-center ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}>
              <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <h3 className={`text-lg font-medium mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>Loading projects...</h3>
              <p className={`${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>Fetching your projects from the server.</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className={`rounded-lg border p-6 ${
              theme === "dark"
                ? "bg-red-900 border-red-700"
                : "bg-red-50 border-red-200"
            }`}>
              <h3 className={`text-lg font-medium mb-2 ${
                theme === "dark" ? "text-red-200" : "text-red-800"
              }`}>Error Loading Projects</h3>
              <p className={`mb-3 ${
                theme === "dark" ? "text-red-300" : "text-red-700"
              }`}>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  theme === "dark" 
                    ? "bg-red-800 hover:bg-red-700 text-red-200" 
                    : "bg-red-100 hover:bg-red-200 text-red-800"
                }`}
              >
                Retry
              </button>
            </div>
          )}

          {/* Projects Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                <div className={`col-span-3 rounded-lg border p-12 text-center ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}>
                  <h3 className={`text-lg font-medium mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>No Projects Found</h3>
                  <p className={`${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>You haven't joined any projects yet. Check your project invitations to get started.</p>
                </div>
              ) : (
                projects.map((project) => (
                  <ProjectCard key={project.id} project={project} theme={theme} />
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center space-x-1 mt-6">
            <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
              Previous
            </button>
            <button className={`px-3 py-1 text-sm rounded-md ${theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>
              1
            </button>
            <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
              2
            </button>
            <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
              3
            </button>
            <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Projects;