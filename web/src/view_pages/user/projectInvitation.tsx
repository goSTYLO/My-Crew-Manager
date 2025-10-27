// projectInvitation.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { 
  ArrowLeft, CheckCircle, XCircle, Users, FolderOpen, Calendar, 
  FileText, Sparkles, Clock, Target, TrendingUp, GitBranch, User 
} from 'lucide-react';
import { useTheme } from "../../components/themeContext";

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

// Types
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface ProjectFeature {
  id: number;
  title: string;
}

interface ProjectRole {
  id: number;
  role: string;
}

interface ProjectGoal {
  id: number;
  title: string;
  role?: string;
}

interface TimelineItem {
  id: number;
  title: string;
}

interface TimelineWeek {
  id: number;
  week_number: number;
  timeline_items: TimelineItem[];
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
  uploaded_at: string;
}

interface Repository {
  id: number;
  name: string;
  url: string;
  branch: string;
}

interface Project {
  id: number;
  title: string;
  summary: string;
  created_by: User;
  created_at: string;
  member_count: number;
  task_count: number;
}

interface ProjectInvitation {
  id: number;
  project: number; // Just the project ID from backend
  project_title: string; // Project title from backend
  invitee: number; // Just the invitee ID from backend
  invitee_name: string; // Invitee name from backend
  invitee_email: string; // Invitee email from backend
  invited_by: number; // Just the invited_by ID from backend
  invited_by_name: string; // Invited by name from backend
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: string; // Role the user is invited with
  message: string;
  created_at: string;
  updated_at: string;
}

interface EnrichedProjectInvitation extends ProjectInvitation {
  features?: ProjectFeature[];
  roles?: ProjectRole[];
  goals?: ProjectGoal[];
  timeline?: TimelineWeek[];
  members?: ProjectMember[];
  proposal?: Proposal;
  repositories?: Repository[];
  project_title?: string;
  project_summary?: string;
}

// API Functions
const invitationAPI = {
  getMyInvitations: async () => {
    const response = await fetch(`${API_BASE_URL}/ai/invitations/my-invitations/`, {
      headers: apiHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch invitations: ${response.statusText}`);
    }
    return response.json();
  },

  getProjectDetails: async (projectId: number) => {
    const [features, roles, goals, timeline, members, proposal, repositories] = await Promise.all([
      fetch(`${API_BASE_URL}/ai/project-features/?project_id=${projectId}`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/ai/project-roles/?project_id=${projectId}`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/ai/project-goals/?project_id=${projectId}`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/ai/timeline-weeks/?project_id=${projectId}`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/ai/project-members/?project_id=${projectId}`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE_URL}/ai/projects/${projectId}/current-proposal/`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`${API_BASE_URL}/ai/repositories/?project_id=${projectId}`, { headers: apiHeaders() })
        .then(r => r.ok ? r.json() : [])
    ]);

    return { features, roles, goals, timeline, members, proposal, repositories };
  },

  acceptInvitation: async (invitationId: number) => {
    const response = await fetch(`${API_BASE_URL}/ai/invitations/${invitationId}/accept/`, {
      method: 'POST',
      headers: apiHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to accept invitation: ${response.statusText}`);
    }
    return response.json();
  },

  declineInvitation: async (invitationId: number) => {
    const response = await fetch(`${API_BASE_URL}/ai/invitations/${invitationId}/decline/`, {
      method: 'POST',
      headers: apiHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to decline invitation: ${response.statusText}`);
    }
    return response.json();
  }
};

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Project Details Section Component
const ProjectDetailsSection = ({ 
  invitation, 
  theme 
}: { 
  invitation: EnrichedProjectInvitation; 
  theme: string;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="mt-4">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 hover:bg-gray-650 text-gray-200'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-medium">View Project Details</span>
          <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {showDetails && (
        <div className={`mt-4 space-y-6 p-6 rounded-lg border ${
          theme === 'dark' 
            ? 'bg-gray-750 border-gray-600' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          {/* Proposal Section */}
          {invitation.proposal && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-green-500" />
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Proposal Document
                </h4>
              </div>
              <div className={`p-4 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Project Proposal.pdf
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Uploaded {formatDate(invitation.proposal.uploaded_at)}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>
          )}

          {/* Features Section */}
          {invitation.features && invitation.features.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Key Features ({invitation.features.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {invitation.features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`p-3 rounded-lg border text-sm ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    • {feature.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Roles Section */}
          {invitation.roles && invitation.roles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-purple-500" />
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Project Roles ({invitation.roles.length})
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {invitation.roles.map((role) => (
                  <span
                    key={role.id}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      theme === 'dark'
                        ? 'bg-purple-900 text-purple-200'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {role.role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Goals Section */}
          {invitation.goals && invitation.goals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-orange-500" />
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Project Goals ({invitation.goals.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {invitation.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-3 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      {goal.title}
                    </p>
                    {goal.role && (
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Role: {goal.role}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          {invitation.timeline && invitation.timeline.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Project Timeline ({invitation.timeline.length} weeks)
                </h4>
              </div>
              <div className="space-y-3">
                {invitation.timeline.map((week) => (
                  <div
                    key={week.id}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <h5 className={`font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Week {week.week_number}
                    </h5>
                    <ul className="space-y-1">
                      {week.timeline_items.map((item) => (
                        <li
                          key={item.id}
                          className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                          • {item.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members Section */}
          {invitation.members && invitation.members.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-cyan-500" />
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Team Members ({invitation.members.length})
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invitation.members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-lg border flex items-center gap-3 ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-white text-sm font-medium flex items-center justify-center">
                      {member.user_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        {member.user_name}
                      </p>
                      <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {member.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Repositories Section */}
          {invitation.repositories && invitation.repositories.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-5 h-5 text-green-500" />
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Connected Repositories ({invitation.repositories.length})
                </h4>
              </div>
              <div className="space-y-2">
                {invitation.repositories.map((repo) => (
                  <div
                    key={repo.id}
                    className={`p-3 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          {repo.name}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          Branch: {repo.branch}
                        </p>
                      </div>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 text-xs"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Component
const ProjectInvitation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<EnrichedProjectInvitation[]>([]);
  const [loadingDetails, setLoadingDetails] = useState<{ [key: number]: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const loadInvitations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await invitationAPI.getMyInvitations();
        const invitationsData: ProjectInvitation[] = response.invitations || [];
        
        // Enrich invitations with project details
        const enrichedInvitations = await Promise.all(
          invitationsData.map(async (invitation) => {
            try {
              // Check if project ID exists before making API call
              if (!invitation.project) {
                console.warn('Invalid project data in invitation:', invitation);
                return invitation;
              }
              
              // First get basic project info (title, summary)
              const projectResponse = await fetch(`${API_BASE_URL}/ai/projects/${invitation.project}/`, {
                headers: apiHeaders()
              });
              
              let projectDetails = {};
              if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                projectDetails = {
                  project_summary: projectData.summary
                };
              }
              
              // Then get additional project details
              const details = await invitationAPI.getProjectDetails(invitation.project);
              return {
                ...invitation,
                ...projectDetails,
                ...details
              };
            } catch (err) {
              console.error(`Error loading details for project ${invitation.project || 'unknown'}:`, err);
              return invitation;
            }
          })
        );
        
        setInvitations(enrichedInvitations);
      } catch (err) {
        console.error('Error loading invitations:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invitations');
      } finally {
        setLoading(false);
      }
    };
    
    loadInvitations();
  }, []);

  const handleInvitationResponse = async (
    invitationId: number,
    response: 'accepted' | 'declined'
  ) => {
    try {
      if (response === 'accepted') {
        await invitationAPI.acceptInvitation(invitationId);
        navigate('/projects-user');
      } else {
        await invitationAPI.declineInvitation(invitationId);
      }

      setInvitations(prev =>
        prev.map(inv => {
          if (inv.id === invitationId) {
            return {
              ...inv,
              status: response,
              updated_at: new Date().toISOString()
            };
          }
          return inv;
        })
      );
    } catch (err) {
      console.error('Error responding to invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
    }
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <header className={`border-b sticky top-0 z-50 ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </header>
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px] pt-20">
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => navigate('/projects-user')}
            className="flex items-center gap-2 text-2xl font-semibold"
          >
            <ArrowLeft
              className={`w-5 h-5 transition-colors duration-200 ${
                theme === "dark" ? "text-white hover:text-blue-400" : "text-black hover:text-blue-600"
              }`}
            />
            <span className={theme === "dark" ? "text-white" : "text-black"}>
              Project Invitations
            </span>
          </button>
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
            }`}>Loading invitations...</h3>
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
            }`}>Error Loading Invitations</h3>
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

        {/* Invitations List */}
        {!loading && !error && (
          <div className="space-y-4">
            {invitations.map(invitation => (
              <div
                key={invitation.id}
                className={`rounded-lg border p-6 hover:shadow-md transition-shadow ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-lg font-medium">
                      {invitation.invited_by_name ? invitation.invited_by_name.substring(0, 2).toUpperCase() : '??'}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        theme === "dark" ? "text-white" : "text-gray-900"
                      }`}>{invitation.project_title || 'Untitled Project'}</h3>
                      <p className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }`}>
                        Invited by <span className="font-medium">{invitation.invited_by_name || 'Unknown User'}</span> •{' '}
                        {formatDate(invitation.created_at)}
                      </p>
                    </div>
                  </div>
                  {invitation.status === 'pending' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">New</span>
                  )}
                </div>

                <p className={`mb-4 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>{invitation.project_summary || 'No description available'}</p>

                {invitation.message && (
                  <div className={`mb-4 p-3 rounded-lg border-l-4 border-blue-500 ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}>
                    <p className={`text-sm italic ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>"{invitation.message}"</p>
                  </div>
                )}

                <div className={`flex items-center space-x-6 mb-4 text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{invitation.members?.length || 0} members</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4" />
                    <span>Project Tasks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(invitation.created_at)}</span>
                  </div>
                  {invitation.proposal && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <FileText className="w-4 h-4" />
                      <span>Proposal Uploaded</span>
                    </div>
                  )}
                </div>

                {/* Project Details Section */}
                <ProjectDetailsSection invitation={invitation} theme={theme} />

                {/* Action Buttons */}
                <div className="mt-4">
                  {invitation.status === 'pending' ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                        className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span>Accept Invitation</span>
                      </button>
                      <button
                        onClick={() => handleInvitationResponse(invitation.id, 'declined')}
                        className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Decline Invitation</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-3 rounded-lg text-center font-medium ${
                        invitation.status === 'accepted'
                          ? theme === "dark" 
                            ? 'bg-green-900 text-green-300' 
                            : 'bg-green-100 text-green-700'
                          : theme === "dark"
                            ? 'bg-red-900 text-red-300'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {invitation.status === 'accepted' ? (
                        <span className="flex items-center justify-center space-x-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>You accepted this invitation</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center space-x-2">
                          <XCircle className="w-5 h-5" />
                          <span>You declined this invitation</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {invitations.length === 0 && (
              <div className={`rounded-lg border p-12 text-center ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}>
                <Clock className={`w-16 h-16 mx-auto mb-4 ${
                  theme === "dark" ? "text-gray-600" : "text-gray-300"
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>No pending invitations</h3>
                <p className={`${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}>You're all caught up! New project invitations will appear here.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectInvitation;