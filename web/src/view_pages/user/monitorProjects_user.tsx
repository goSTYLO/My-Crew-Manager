// monitorProjects_user.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { Search, Mail, FileText, Sparkles, Users, CheckCircle, Clock, AlertCircle, GitBranch } from "lucide-react";
import { useTheme } from "../../components/themeContext";

// ✅ Types
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface ProjectMember {
  id: number;
  user_name: string;
  user_email: string;
  role: string;
  joined_at: string;
}

interface Proposal {
  id: number;
  file: string;
  parsed_text: string;
  uploaded_by: number;
  uploaded_at: string;
}

interface Repository {
  id: number;
  name: string;
  url: string;
  branch: string;
  created_at: string;
}

interface Project {
  id: number;
  title: string;
  summary: string;
  created_by: User;
  created_at: string;
  member_count: number;
  task_count: number;
  has_proposal: boolean;
  has_backlog: boolean;
  proposal?: Proposal;
  members?: ProjectMember[];
  repositories?: Repository[];
}

// API Configuration
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

// API Functions
const projectAPI = {
  getMyProjects: async () => {
    // Get accepted invitations
    const invitationsResponse = await fetch(`${API_BASE_URL}/ai/invitations/my-invitations/`, {
      headers: apiHeaders()
    });
    
    if (!invitationsResponse.ok) {
      throw new Error(`Failed to fetch invitations: ${invitationsResponse.statusText}`);
    }
    
    const invitationsData = await invitationsResponse.json();
    const acceptedInvitations = invitationsData.invitations.filter(
      (inv: any) => inv.status === 'accepted'
    );

    // Fetch full project details for each accepted invitation
    const projectsWithDetails = await Promise.all(
      acceptedInvitations.map(async (invitation: any) => {
        const projectId = invitation.project.id;
        
        try {
          // Fetch project details
          const projectResponse = await fetch(`${API_BASE_URL}/ai/projects/${projectId}/`, {
            headers: apiHeaders()
          });
          const project = await projectResponse.json();

          // Fetch proposal
          let proposal = null;
          try {
            const proposalResponse = await fetch(
              `${API_BASE_URL}/ai/projects/${projectId}/current-proposal/`,
              { headers: apiHeaders() }
            );
            if (proposalResponse.ok) {
              proposal = await proposalResponse.json();
            }
          } catch (e) {
            console.log('No proposal found for project', projectId);
          }

          // Fetch backlog to check if it exists and count tasks
          let hasBacklog = false;
          let taskCount = 0;
          try {
            const backlogResponse = await fetch(
              `${API_BASE_URL}/ai/projects/${projectId}/backlog/`,
              { headers: apiHeaders() }
            );
            if (backlogResponse.ok) {
              const backlogData = await backlogResponse.json();
              hasBacklog = backlogData.epics && backlogData.epics.length > 0;
              
              // Count total tasks from backlog
              if (backlogData.epics) {
                taskCount = backlogData.epics.reduce((total: number, epic: any) => {
                  return total + epic.sub_epics.reduce((subTotal: number, subEpic: any) => {
                    return subTotal + subEpic.user_stories.reduce((storyTotal: number, story: any) => {
                      return storyTotal + (story.tasks?.length || 0);
                    }, 0);
                  }, 0);
                }, 0);
              }
            }
          } catch (e) {
            console.log('No backlog found for project', projectId);
          }

          // Fetch project members
          const membersResponse = await fetch(
            `${API_BASE_URL}/ai/project-members/?project_id=${projectId}`,
            { headers: apiHeaders() }
          );
          const members = membersResponse.ok ? await membersResponse.json() : [];

          // Fetch repositories
          const reposResponse = await fetch(
            `${API_BASE_URL}/ai/repositories/?project_id=${projectId}`,
            { headers: apiHeaders() }
          );
          const repositories = reposResponse.ok ? await reposResponse.json() : [];

          return {
            id: project.id,
            title: project.title,
            summary: project.summary,
            created_by: invitation.project.created_by,
            created_at: project.created_at,
            member_count: Array.isArray(members) ? members.length : 0,
            task_count: taskCount,
            has_proposal: !!proposal,
            has_backlog: hasBacklog,
            proposal: proposal,
            members: Array.isArray(members) ? members : [],
            repositories: Array.isArray(repositories) ? repositories : []
          };
        } catch (error) {
          console.error(`Error fetching details for project ${projectId}:`, error);
          return null;
        }
      })
    );

    return { projects: projectsWithDetails.filter(p => p !== null) };
  }
};

// ✅ Project Status Badge Component
const StatusBadge = ({ hasProposal, hasBacklog, theme }: { 
  hasProposal: boolean; 
  hasBacklog: boolean;
  theme: string;
}) => {
  if (hasBacklog) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
        <CheckCircle className="w-4 h-4" />
        <span>Active</span>
      </div>
    );
  } else if (hasProposal) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium">
        <Clock className="w-4 h-4" />
        <span>In Setup</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
        <AlertCircle className="w-4 h-4" />
        <span>Pending Setup</span>
      </div>
    );
  }
};

// ✅ Project Card Component
const ProjectCard = ({ project, theme }: { project: Project; theme: string }) => {
  const navigate = useNavigate();
  const createdDate = new Date(project.created_at).toLocaleDateString();

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          {project.title}
        </div>
        <StatusBadge 
          hasProposal={project.has_proposal} 
          hasBacklog={project.has_backlog}
          theme={theme}
        />
      </div>

      <hr className={`border-t mb-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`} />

      {/* Summary */}
      <div className="mb-4">
        <p className={`text-sm leading-relaxed line-clamp-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {project.summary || 'No description available'}
        </p>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          project.has_proposal 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <FileText className={`w-4 h-4 ${project.has_proposal ? 'text-green-600' : 'text-gray-400'}`} />
          <span className={`text-xs font-medium ${project.has_proposal ? 'text-green-700' : 'text-gray-500'}`}>
            {project.has_proposal ? 'Proposal Uploaded' : 'No Proposal'}
          </span>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          project.has_backlog 
            ? 'bg-blue-50 border border-blue-200' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <Sparkles className={`w-4 h-4 ${project.has_backlog ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className={`text-xs font-medium ${project.has_backlog ? 'text-blue-700' : 'text-gray-500'}`}>
            {project.has_backlog ? 'Backlog Generated' : 'No Backlog'}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={`flex items-center gap-2 p-2 rounded ${
          theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
        }`}>
          <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {project.member_count} {project.member_count === 1 ? 'Member' : 'Members'}
          </span>
        </div>
        
        <div className={`flex items-center gap-2 p-2 rounded ${
          theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
        }`}>
          <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {project.task_count} {project.task_count === 1 ? 'Task' : 'Tasks'}
          </span>
        </div>
      </div>

      {/* Team Members Preview */}
      {project.members && project.members.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Team Members
            </span>
          </div>
          <div className="flex -space-x-2">
            {project.members.slice(0, 5).map((member, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center border-2 ${
                  theme === 'dark' ? 'border-gray-800' : 'border-white'
                }`}
                title={`${member.user_name} (${member.role})`}
              >
                {member.user_name.substring(0, 2).toUpperCase()}
              </div>
            ))}
            {project.members.length > 5 && (
              <div className={`w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center border-2 ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-gray-300 border-gray-800' 
                  : 'bg-gray-300 text-gray-700 border-white'
              }`}>
                +{project.members.length - 5}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Repositories Preview */}
      {project.repositories && project.repositories.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Connected Repositories
            </span>
          </div>
          <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            {project.repositories[0].name}
            {project.repositories.length > 1 && ` +${project.repositories.length - 1} more`}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between pt-4 border-t ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex flex-col gap-1">
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Created: {createdDate}
          </p>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            By: {project.created_by.name}
          </p>
        </div>

        <button
          className="px-6 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
          onClick={() => navigate(`/project-details/${project.id}`)}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

// ✅ Main Component
const MonitorProjectsUser = () => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          {/* Header with search and invitation button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              My Projects
            </h2>
            
            <div className="flex items-center gap-4">
              {/* Search Input */}
              <div className="relative w-[400px]">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.length === 0 ? (
                <div className={`col-span-3 rounded-lg border p-12 text-center ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}>
                  <h3 className={`text-lg font-medium mb-2 ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {searchQuery ? 'No matching projects' : 'No Projects Found'}
                  </h3>
                  <p className={`${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                    {searchQuery 
                      ? 'Try adjusting your search query' 
                      : "You haven't joined any projects yet. Check your invitations to get started."}
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} theme={theme} />
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MonitorProjectsUser;