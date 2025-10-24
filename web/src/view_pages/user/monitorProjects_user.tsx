// monitorProjects_user.tsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { Search, Mail, FileText, Sparkles, Users, CheckCircle, Clock, AlertCircle, GitBranch, Download } from "lucide-react";
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
  project_file?: string;
  project_file_url?: string;
  project_file_download_url?: string;
}

// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

const getAuthToken = () => {
  return sessionStorage.getItem('token');
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
    try {
      // Use the same API endpoint as managers - this should return projects where user is a member
      const response = await fetch(`${API_BASE_URL}/ai/projects/my-projects/`, {
        headers: apiHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const projectsData = await response.json();
      console.log('📋 Raw projects data for user:', projectsData);
      
      // Sort projects by updated_at (most recent first)
      const sortedProjects = projectsData.sort((a: any, b: any) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('📋 Sorted projects for user:', sortedProjects);
      
      // Fetch additional details for each project
      const projectsWithDetails = await Promise.all(
        sortedProjects.map(async (project: any) => {
          try {
            // Fetch proposal
            let proposal = null;
            try {
              const proposalResponse = await fetch(
                `${API_BASE_URL}/ai/projects/${project.id}/current-proposal/`,
                { headers: apiHeaders() }
              );
              if (proposalResponse.ok) {
                proposal = await proposalResponse.json();
              }
            } catch (e) {
              console.log('No proposal found for project', project.id);
            }

            // Fetch backlog to check if it exists and count tasks
            let hasBacklog = false;
            let taskCount = 0;
            try {
              const backlogResponse = await fetch(
                `${API_BASE_URL}/ai/projects/${project.id}/backlog/`,
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
              console.log('No backlog found for project', project.id);
            }

            // Fetch project members
            const membersResponse = await fetch(
              `${API_BASE_URL}/ai/project-members/?project_id=${project.id}`,
              { headers: apiHeaders() }
            );
            const members = membersResponse.ok ? await membersResponse.json() : [];

            // Fetch repositories
            const reposResponse = await fetch(
              `${API_BASE_URL}/ai/repositories/?project_id=${project.id}`,
              { headers: apiHeaders() }
            );
            const repositories = reposResponse.ok ? await reposResponse.json() : [];

            return {
              id: project.id,
              title: project.title,
              summary: project.summary || project.description,
              created_by: project.created_by,
              created_at: project.created_at,
              member_count: Array.isArray(members) ? members.length : 0,
              task_count: taskCount,
              has_proposal: !!proposal,
              has_backlog: hasBacklog,
              proposal: proposal,
              members: Array.isArray(members) ? members : [],
              repositories: Array.isArray(repositories) ? repositories : [],
              project_file: project.project_file,
              project_file_url: project.project_file_url,
              project_file_download_url: project.project_file_download_url
            };
          } catch (error) {
            console.error(`Error fetching details for project ${project.id}:`, error);
            return null;
          }
        })
      );

      return { projects: projectsWithDetails.filter(p => p !== null) };
    } catch (error) {
      console.error('Error in getMyProjects:', error);
      throw error;
    }
  }
};

// ✅ Project Status Badge Component
const StatusBadge = ({ hasProposal, hasBacklog }: { 
  hasProposal: boolean; 
  hasBacklog: boolean;
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
const ProjectCard = ({ project, theme, onDownloadFile }: { 
  project: Project; 
  theme: string; 
  onDownloadFile?: (project: Project, event: React.MouseEvent) => void; 
}) => {
  const navigate = useNavigate();
  const createdDate = new Date(project.created_at).toLocaleDateString();

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow flex flex-col h-full min-h-[600px]`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          {project.title}
        </div>
        <StatusBadge 
          hasProposal={project.has_proposal} 
          hasBacklog={project.has_backlog}
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
        {/* File Status Box - Combined Proposal and Project File */}
        <div 
          className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${
            project.has_proposal 
              ? 'bg-green-50 border border-green-200 hover:bg-green-100' 
              : project.project_file
              ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
              : 'bg-gray-50 border border-gray-200'
          }`}
          onClick={project.project_file && !project.has_proposal && onDownloadFile ? (e) => onDownloadFile(project, e) : undefined}
        >
          {project.has_proposal ? (
            <>
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                Proposal Uploaded
              </span>
            </>
          ) : project.project_file ? (
            <>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4 text-blue-600" />
                <FileText className="w-3 h-3 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-blue-700">
                Project File
              </span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">
                No Files
              </span>
            </>
          )}
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

      {/* Two-Box Layout for Team Members and Repositories */}
      <div className="flex-1 grid grid-cols-2 gap-4 mb-4">
        {/* Team Members Box */}
        <div className={`${theme === 'dark' ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg flex flex-col h-[250px]`}>
          <div className={`flex items-center justify-between p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Team Members
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              {project.members?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {project.members && project.members.length > 0 ? (
              <div className="space-y-2">
                {project.members.map((member, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white text-sm font-medium flex items-center justify-center shadow-sm`}>
                      {member.user_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        {member.user_name}
                      </p>
                      <div className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium ${
                        member.role.toLowerCase() === 'member' 
                          ? theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                          : theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {member.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No team members yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Repositories Box */}
        <div className={`${theme === 'dark' ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'} border rounded-lg flex flex-col h-[250px]`}>
          <div className={`flex items-center justify-between p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <GitBranch className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
              <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                Connected Repositories
              </span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
              {project.repositories?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {project.repositories && project.repositories.length > 0 ? (
              <div className="space-y-2">
                {project.repositories.map((repo, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg transition-colors ${
                      theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                    } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
                      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        {repo.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {repo.branch}
                      </span>
                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                        {new Date(repo.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No repositories connected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between pt-4 mt-auto border-t ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
            </div>
            <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Created: {createdDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z"/>
              </svg>
            </div>
            <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              By: {project.created_by.name}
            </p>
          </div>
        </div>

        <button
          className={`px-6 py-2 text-sm rounded-lg transition-all duration-200 transform hover:scale-105 ${
            theme === 'dark' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
          onClick={() => navigate(`/user-project/${project.id}`)}
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
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Function to fetch pending invitations count
  const fetchPendingInvitations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/invitations/my-invitations/`, {
        headers: apiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invitations: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📧 Invitations data:', data);
      
      // Handle both possible response formats
      const invitations = data.invitations || data || [];
      const pendingInvitations = invitations.filter(
        (invitation: any) => invitation.status === 'pending'
      );
      setPendingInvitationsCount(pendingInvitations.length);
      console.log('📧 Pending invitations count:', pendingInvitations.length);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      // Don't set error state for invitations, just log it
    }
  }, []);

  // Handle project file download
  const handleProjectFileDownload = async (project: Project, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click navigation
    
    if (!project.project_file_download_url) {
      console.error('No download URL available for project', project.id);
      return;
    }

    try {
      const response = await fetch(project.project_file_download_url, {
        headers: apiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get filename from content-disposition header or use a default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${project.title}-file`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading project file:', error);
    }
  };

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

    const loadData = async () => {
      await Promise.all([
        loadProjects(),
        fetchPendingInvitations()
      ]);
    };

    loadData();

    // Refresh invitation count when the page becomes visible (user returns from invitation page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPendingInvitations();
      }
    };

    const handleFocus = () => {
      fetchPendingInvitations();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPendingInvitations]);

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
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Mail className="w-5 h-5" />
                <span>Project Invitations</span>
                {/* Red Badge for Pending Invitations */}
                {pendingInvitationsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] animate-pulse">
                    {pendingInvitationsCount > 99 ? '99+' : pendingInvitationsCount}
                  </span>
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
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
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    theme={theme} 
                    onDownloadFile={handleProjectFileDownload}
                  />
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