import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { 
  Lightbulb, 
  Calendar, 
  ArrowLeft, 
  Users, 
  FileText,
  Sparkles,
  CheckCircle,
  GitBranch,
  AlertCircle,
  Download
} from 'lucide-react';
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { useTheme } from "../../components/themeContext";
import ProposalViewer from "../../components/ProposalViewer";
import { useToast } from "../../components/ToastContext";
import { useRealtimeUpdates } from "../../hooks/useRealtimeUpdates";

// API configuration
const API_BASE_URL = 'http://localhost:8000/api';
const AI_API_BASE_URL = `${API_BASE_URL}/ai`;

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

// Type definitions
interface User {
  id: number;
  name: string;
  email: string;
}

interface ProjectMember {
  id: number;
  user_name: string;
  user_email: string;
  role: string;
  joined_at: string;
  user: number;
  user_profile_picture?: string | null;
}

interface TaskAssignee {
  id: number;
  user_name: string;
  user_email: string;
  profile_picture?: string | null;
}

interface StoryTask {
  id: number;
  title: string;
  status: string;
  ai: boolean;
  assignee: TaskAssignee | null;
  assignee_details?: {
    id: number;
    user_name: string;
    user_email: string;
    profile_picture?: string | null;
  };
  due_date?: string | null;
}

interface UserStory {
  id: number;
  title: string;
  ai: boolean;
  tasks: StoryTask[];
}

interface SubEpic {
  id: number;
  title: string;
  ai: boolean;
  user_stories: UserStory[];
}

interface Epic {
  id: number;
  title: string;
  description: string;
  ai: boolean;
  sub_epics: SubEpic[];
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

interface ProjectFeature {
  id: number;
  title: string;
}

interface ProjectGoal {
  id: number;
  title: string;
  role: string;
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

interface Project {
  id: number;
  title: string;
  summary: string;
  status?: string;
  status_updated_at?: string;
  status_updated_by_name?: string;
  created_by: User;
  created_at: string;
  member_count?: number;
  task_count?: number;
  has_proposal?: boolean;
  has_backlog?: boolean;
  project_file?: string;
  project_file_url?: string;
  project_file_download_url?: string;
}

interface ProjectDetails extends Project {
  members: ProjectMember[];
  repositories: Repository[];
  proposal: Proposal | null;
  backlog: Epic[];
  features: ProjectFeature[];
  goals: ProjectGoal[];
  timeline: TimelineWeek[];
}

// Avatar Component
const Avatar: React.FC<{ 
  member: ProjectMember; 
  size?: 'sm' | 'md';
  theme: string;
}> = ({ member, size = 'md', theme }) => {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10';
  const initials = member.user_name.substring(0, 2).toUpperCase();
  
  return (
    <div className="relative">
      <div className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 ${theme === 'dark' ? 'border-gray-700' : 'border-white'} shadow-sm overflow-hidden ${!member.user_profile_picture ? 'bg-blue-500 text-white' : ''}`}>
        {member.user_profile_picture ? (
          <img 
            src={member.user_profile_picture} 
            alt={member.user_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );
};

// Team Avatars Component
const TeamAvatars: React.FC<{ members: ProjectMember[]; theme: string }> = ({ members, theme }) => {
  const displayMembers = members.slice(0, 4);
  const remainingCount = Math.max(0, members.length - 4);

  return (
    <div className="flex items-center">
      {displayMembers.map((member, index) => (
        <div key={member.id} className={`relative ${index > 0 ? '-ml-2' : ''}`} title={member.user_name}>
          <Avatar member={member} size="sm" theme={theme} />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="relative -ml-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 shadow-sm ${
            theme === 'dark' 
              ? 'bg-gray-700 text-gray-200 border-gray-600' 
              : 'bg-gray-300 text-gray-700 border-white'
          }`}>
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    done: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    canceled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Canceled' }
  };
  
  const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Task Row Component
const TaskRow: React.FC<{ 
  task: StoryTask;
  userStoryTitle: string;
  epicTitle: string;
  theme: string;
  currentUserEmail: string | null;
  onTaskComplete: (taskId: number) => void;
  onTaskClick?: (taskId: number) => void;
}> = ({ task, userStoryTitle, epicTitle, theme, currentUserEmail, onTaskComplete, onTaskClick }) => {
  const assignee = task.assignee_details || task.assignee;
  
  return (
    <div 
      className={`w-full flex items-start gap-4 p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => onTaskClick?.(task.id)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Icon */}
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <Lightbulb className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            {task.title}
          </h3>

          <div className={`flex items-center gap-4 text-xs flex-wrap ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="truncate">Epic: {epicTitle}</span>
            <span className="truncate">Story: {userStoryTitle}</span>
            <StatusBadge status={task.status} />
            {(() => {
              console.log('🔍 Due date check in projectsDetails for task', task.id, ':', {
                dueDateValue: task.due_date,
                dueDateType: typeof task.due_date,
                willShow: !!task.due_date
              });
              return task.due_date;
            })() && (
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                (() => {
                  const today = new Date().toISOString().slice(0,10);
                  const dueDate = task.due_date!; // We know it's not null due to the condition above
                  if (dueDate < today) return 'bg-red-100 text-red-800 border border-red-200';
                  if (dueDate === today) return 'bg-orange-100 text-orange-800 border border-orange-200';
                  return 'bg-blue-100 text-blue-800 border border-blue-200';
                })()}
              `}>
                <Calendar className="w-3.5 h-3.5" />
                {(() => {
                  const today = new Date().toISOString().slice(0,10);
                  const dueDate = task.due_date!; // We know it's not null due to the condition above
                  if (dueDate === today) return 'Due on: Today';
                  if (dueDate < today) return `Overdue: ${dueDate}`;
                  return `Due on: ${dueDate}`;
                })()}
              </span>
            )}
            {task.ai && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs whitespace-nowrap">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Assignee and Action Button */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {assignee.user_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-sm min-w-[120px]">
              <div className={`font-medium truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                {assignee.user_name}
              </div>
              <div className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {assignee.user_email}
              </div>
            </div>
          </div>
        ) : (
          <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Unassigned
          </span>
        )}
        
        {/* Mark as Done button */}
        {task.status !== 'done' && 
         assignee && 
         currentUserEmail && 
         assignee.user_email === currentUserEmail && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTaskComplete(task.id);
            }}
            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            Mark as Done
          </button>
        )}
      </div>
    </div>
  );
};

// Team Member Card Component
const TeamMemberCard: React.FC<{ member: ProjectMember; theme: string }> = ({ member, theme }) => {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <Avatar member={member} theme={theme} />
      <div className="flex-1">
        <div className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          {member.user_name}
        </div>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {member.user_email}
        </div>
      </div>
      <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
        {member.role}
      </div>
    </div>
  );
};

// Main Component
const ProjectDetails: React.FC = () => {
  const { theme } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: projectId } = useParams<{ id: string }>();
  
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'team' | 'timeline' | 'repository'>(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as 'overview' | 'tasks' | 'team' | 'timeline' | 'repository' | null;
    return tab && ['overview', 'tasks', 'team', 'timeline', 'repository'].includes(tab)
      ? tab
      : 'overview';
  });
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [editingCommitTitle, setEditingCommitTitle] = useState('');
  const [editingCommitBranch, setEditingCommitBranch] = useState('');
  const [showProposalViewer, setShowProposalViewer] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  
  // Project status state
  const [projectStatus, setProjectStatus] = useState<string>('in_progress');
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<string | null>(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState<string | null>(null);

  // Get current user email from sessionStorage
  useEffect(() => {
    const email = sessionStorage.getItem('email');
    setCurrentUserEmail(email);
  }, []);

  // Fetch backlog function similar to monitor_created.tsx
  const fetchBacklog = async () => {
    try {
      console.log('🔍 Fetching backlog for projectId:', projectId);
      const response = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/backlog/`, {
        headers: apiHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Backlog fetch failed:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backlog data fetched:', data);
      
      // Debug due dates specifically
      console.log('🔍 DEBUGGING DUE DATES in projectsDetails:');
      if (data.epics && Array.isArray(data.epics)) {
        data.epics.forEach((epic: any, epicIndex: number) => {
          if (epic.sub_epics) {
            epic.sub_epics.forEach((subEpic: any, subEpicIndex: number) => {
              if (subEpic.user_stories) {
                subEpic.user_stories.forEach((story: any, storyIndex: number) => {
                  if (story.tasks) {
                    story.tasks.forEach((task: any, taskIndex: number) => {
                      console.log(`📅 Task [${epicIndex}.${subEpicIndex}.${storyIndex}.${taskIndex}] ID: ${task.id}, Title: "${task.title}", Due Date: "${task.due_date}" (type: ${typeof task.due_date})`);
                    });
                  }
                });
              }
            });
          }
        });
      }
      
      // Transform the backlog data to match the expected structure
      const transformedBacklog = (data.epics || []).map((epic: any) => ({
        id: epic.id,
        title: epic.title,
        description: epic.description,
        ai: epic.ai,
        sub_epics: (epic.sub_epics || []).map((subEpic: any) => ({
          id: subEpic.id,
          title: subEpic.title,
          ai: subEpic.ai,
          user_stories: (subEpic.user_stories || []).map((story: any) => ({
            id: story.id,
            title: story.title,
            ai: story.ai,
            tasks: (story.tasks || []).map((task: any) => ({
              id: task.id,
              title: task.title,
              status: task.status,
              ai: task.ai,
              assignee: task.assignee,
              assignee_details: task.assignee_details,
              commit_title: task.commit_title,
            commit_branch: task.commit_branch,
            due_date: task.due_date || null
            }))
          }))
        }))
      }));

      setProjectDetails(prev => prev ? {...prev, backlog: transformedBacklog} : null);
    } catch (error) {
      console.error('Error fetching backlog:', error);
    }
  };

  // Task completion functions
  const openTaskCompletionModal = (taskId: number) => {
    setCompletingTaskId(taskId);
    setShowTaskCompletionModal(true);
    setEditingCommitTitle('');
    setEditingCommitBranch('');
  };

  const completeTask = async (taskId: number, commitTitle: string, commitBranch?: string) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: apiHeaders(),
        body: JSON.stringify({ 
          status: 'done',
          commit_title: commitTitle,
          commit_branch: commitBranch || null
        }),
      });

      if (response.ok) {
        showSuccess('Task Completed', 'Task marked as done successfully');
        await fetchBacklog(); // Refresh backlog to show updated status
        setShowTaskCompletionModal(false);
        setCompletingTaskId(null);
        setEditingCommitTitle('');
        setEditingCommitBranch('');
      } else {
        const errorData = await response.json();
        showError('Completion Failed', errorData.error || 'Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      showError('Error', 'Failed to complete task. Please try again.');
    }
  };

  // Handle project file download
  const handleProjectFileDownload = async () => {
    if (!projectDetails?.project_file_download_url) {
      console.error('No download URL available');
      return;
    }

    try {
      const response = await fetch(projectDetails.project_file_download_url, {
        headers: apiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get filename from content-disposition header or use a default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${projectDetails.title}-file`;
      
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
    const fetchProjectDetails = async () => {
      if (!projectId) {
        setError('No project ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch project basic info
        const projectResponse = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/`, {
          headers: apiHeaders()
        });
        
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project details');
        }
        
        const project = await projectResponse.json();
        console.log('Project details fetched:', project);

        // Set project status fields
        setProjectStatus(project.status || 'in_progress');
        setStatusUpdatedAt(project.status_updated_at);
        setStatusUpdatedBy(project.status_updated_by_name);

        // Fetch proposal
        let proposal = null;
        try {
          const proposalResponse = await fetch(
            `${AI_API_BASE_URL}/projects/${projectId}/current-proposal/`,
            { headers: apiHeaders() }
          );
          if (proposalResponse.ok) {
            proposal = await proposalResponse.json();
          }
        } catch (e) {
          console.log('No proposal found');
        }

        // Fetch backlog using the same function as task completion
        let backlog: Epic[] = [];
        try {
          const backlogResponse = await fetch(
            `${AI_API_BASE_URL}/projects/${projectId}/backlog/`,
            { headers: apiHeaders() }
          );
          if (backlogResponse.ok) {
            const backlogData = await backlogResponse.json();
            
            // Transform the backlog data to match the expected structure
            backlog = (backlogData.epics || []).map((epic: any) => ({
              id: epic.id,
              title: epic.title,
              description: epic.description,
              ai: epic.ai,
              sub_epics: (epic.sub_epics || []).map((subEpic: any) => ({
                id: subEpic.id,
                title: subEpic.title,
                ai: subEpic.ai,
                user_stories: (subEpic.user_stories || []).map((story: any) => ({
                  id: story.id,
                  title: story.title,
                  ai: story.ai,
                  tasks: (story.tasks || []).map((task: any) => ({
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    ai: task.ai,
                    assignee: task.assignee,
                    assignee_details: task.assignee_details,
                    commit_title: task.commit_title,
                    commit_branch: task.commit_branch,
                    due_date: task.due_date || null
                  }))
                }))
              }))
            }));
          }
        } catch (e) {
          console.log('No backlog found');
        }

        // Fetch project members
        const membersResponse = await fetch(
          `${AI_API_BASE_URL}/project-members/?project_id=${projectId}`,
          { headers: apiHeaders() }
        );
        const members = membersResponse.ok ? await membersResponse.json() : [];

        // Fetch repositories
        const reposResponse = await fetch(
          `${AI_API_BASE_URL}/repositories/?project_id=${projectId}`,
          { headers: apiHeaders() }
        );
        const repositories = reposResponse.ok ? await reposResponse.json() : [];

        // Fetch features
        const featuresResponse = await fetch(
          `${AI_API_BASE_URL}/project-features/?project_id=${projectId}`,
          { headers: apiHeaders() }
        );
        const features = featuresResponse.ok ? await featuresResponse.json() : [];

        // Fetch goals
        const goalsResponse = await fetch(
          `${AI_API_BASE_URL}/project-goals/?project_id=${projectId}`,
          { headers: apiHeaders() }
        );
        const goals = goalsResponse.ok ? await goalsResponse.json() : [];

        // Fetch timeline
        const timelineResponse = await fetch(
          `${AI_API_BASE_URL}/timeline-weeks/?project_id=${projectId}`,
          { headers: apiHeaders() }
        );
        const timeline = timelineResponse.ok ? await timelineResponse.json() : [];

        setProjectDetails({
          ...project,
          members: Array.isArray(members) ? members : [],
          repositories: Array.isArray(repositories) ? repositories : [],
          proposal,
          backlog,
          features: Array.isArray(features) ? features : [],
          goals: Array.isArray(goals) ? goals : [],
          timeline: Array.isArray(timeline) ? timeline : []
        });

      } catch (err) {
        console.error('Error fetching project details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  // Calculate stats
  const totalTasks = projectDetails?.backlog.reduce((acc, epic) => 
    acc + epic.sub_epics.reduce((acc2, subEpic) => 
      acc2 + subEpic.user_stories.reduce((acc3, story) => 
        acc3 + story.tasks.length, 0), 0), 0) || 0;

  const completedTasks = projectDetails?.backlog.reduce((acc, epic) => 
    acc + epic.sub_epics.reduce((acc2, subEpic) =>
      acc2 + subEpic.user_stories.reduce((acc3, story) => 
        acc3 + story.tasks.filter(t => t.status === 'done').length, 0), 0), 0) || 0;

  // Real-time updates using the same pattern as monitor_created.tsx
  useRealtimeUpdates({
    projectId: projectId ? parseInt(projectId) : undefined,
    callbacks: {
      onTaskUpdate: (data) => {
        console.log('📡 User Project Details: Real-time task update received:', data);
        // Refresh backlog to get updated task data
        fetchBacklog();
      },
      onProjectUpdate: (data) => {
        console.log('📡 User Project Details: Real-time project update received:', data);
        // Refresh backlog to get updated project data
        fetchBacklog();
      },
      onMemberUpdate: (data) => {
        console.log('📡 User Project Details: Real-time member update received:', data);
        // Refresh backlog to get updated member data
        fetchBacklog();
      },
      onEpicUpdate: (data) => {
        console.log('📡 User Project Details: Real-time epic update received:', data);
        // Refresh backlog when epics are added/updated
        fetchBacklog();
      },
      onSubEpicUpdate: (data) => {
        console.log('📡 User Project Details: Real-time sub-epic update received:', data);
        // Refresh backlog when sub-epics are added/updated
        fetchBacklog();
      },
      onUserStoryUpdate: (data) => {
        console.log('📡 User Project Details: Real-time user story update received:', data);
        // Refresh backlog when user stories are added/updated
        fetchBacklog();
      },
      onNotification: (data) => {
        console.log('📡 User Project Details: Real-time notification received:', data);
        
        // Handle project status change notifications
        if (data.notification && data.notification.type === 'project_status_changed') {
          console.log('📡 User Project Details: Project status change notification received:', data);
          
          // Update the status state with the new data
          if (data.notification.message) {
            // Extract status from the message
            const statusMatch = data.notification.message.match(/to "([^"]+)"/);
            if (statusMatch) {
              const newStatus = statusMatch[1].toLowerCase().replace(' ', '_');
              setProjectStatus(newStatus);
            }
          }
          
          // Refresh project details to get the latest status info
          fetchBacklog();
        }
        
        // Handle task assignment notifications
        if (data.notification && data.notification.type === 'task_assigned') {
          console.log('📡 User Project Details: Task assignment notification received:', data);
          
          // Show toast notification
          showInfo(
            data.notification.title,
            data.notification.message
          );
          
          // Refresh backlog to get updated task data
          fetchBacklog();
        }
      }
    }
  });

  if (loading) {
    return (
      <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Loading project details...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !projectDetails) {
    return (
      <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 flex items-center justify-center">
            <div className={`text-center p-8 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                Error Loading Project
              </h3>
              <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {error || 'Project not found'}
              </p>
              <button
                onClick={() => navigate('/projects-user')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Back to Projects
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px] pt-20">
          {/* Header */}
          <header className="mb-8">
            <button
              onClick={() => navigate('/projects-user')}
              className={`flex items-center gap-2 mb-4 text-sm ${
                theme === 'dark' ? 'text-gray-300 hover:text-gray-100' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  {projectDetails.title}
                </h1>
                <TeamAvatars members={projectDetails.members} theme={theme} />
              </div>

              <div className="flex items-center gap-4">
                {/* Project Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Status:
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    projectStatus === 'complete' ? 'bg-green-100 text-green-800' :
                    projectStatus === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    projectStatus === 'setting_up' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {projectStatus === 'setting_up' ? 'Setting Up' :
                     projectStatus === 'in_progress' ? 'In Progress' :
                     projectStatus === 'complete' ? 'Complete' :
                     projectStatus === 'on_hold' ? 'On Hold' : projectStatus}
                  </span>
                </div>
                {statusUpdatedAt && statusUpdatedBy && (
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Last updated by {statusUpdatedBy} on {new Date(statusUpdatedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                {projectDetails.backlog.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Backlog Generated</span>
                  </div>
                )}
              </div>
            </div>

            {projectDetails.summary && (
              <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {projectDetails.summary}
              </p>
            )}
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {projectDetails.members.length}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Team Members
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {completedTasks}/{totalTasks}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Tasks Completed
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <GitBranch className="w-8 h-8 text-purple-500" />
                <div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {projectDetails.repositories.length}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Repositories
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-orange-500" />
                <div>
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    {projectDetails.backlog.length}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Epics
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={`border-b mb-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex gap-6">
              {(['overview', 'tasks', 'team', 'timeline', 'repository'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 font-medium text-sm capitalize transition-colors border-b-2 ${
                    activeTab === tab
                      ? theme === 'dark'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-blue-500 text-blue-600'
                      : theme === 'dark'
                      ? 'border-transparent text-gray-400 hover:text-gray-200'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Files Section */}
                <div className={`p-6 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    Project Files
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Proposal Status */}
                    <div className={`p-4 rounded-lg border ${
                      projectDetails.proposal 
                        ? 'bg-green-50 border-green-200' 
                        : theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${projectDetails.proposal ? 'text-green-600' : 'text-gray-400'}`} />
                          <div>
                            <p className={`font-medium text-sm ${
                              projectDetails.proposal 
                                ? 'text-green-700' 
                                : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              PDF Proposal
                            </p>
                            <p className={`text-xs ${
                              projectDetails.proposal 
                                ? 'text-green-600' 
                                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {projectDetails.proposal ? 'Uploaded and ready for AI analysis' : 'No proposal uploaded yet'}
                            </p>
                          </div>
                        </div>
                        {projectDetails.proposal && (
                          <button
                            onClick={() => setShowProposalViewer(true)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            View Proposal
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project File Status */}
                    <div className={`p-4 rounded-lg border ${
                      projectDetails.project_file 
                        ? 'bg-blue-50 border-blue-200' 
                        : theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Download className={`w-5 h-5 ${projectDetails.project_file ? 'text-blue-600' : 'text-gray-400'}`} />
                          <FileText className={`w-4 h-4 ${projectDetails.project_file ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            projectDetails.project_file 
                              ? 'text-blue-700' 
                              : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Project File
                          </p>
                          <p className={`text-xs ${
                            projectDetails.project_file 
                              ? 'text-blue-600' 
                              : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {projectDetails.project_file ? 'File available for download' : 'No project file uploaded'}
                          </p>
                        </div>
                        {projectDetails.project_file && (
                          <button
                            onClick={handleProjectFileDownload}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {projectDetails.features.length > 0 && (
                  <div className={`p-6 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      Project Features
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {projectDetails.features.map((feature) => (
                        <div key={feature.id} className={`flex items-start gap-2 p-3 rounded border ${
                          theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feature.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goals */}
                {projectDetails.goals.length > 0 && (
                  <div className={`p-6 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      Project Goals
                    </h3>
                    <div className="space-y-3">
                      {projectDetails.goals.map((goal) => (
                        <div key={goal.id} className={`p-4 rounded border ${
                          theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                            {goal.title}
                          </div>
                          {goal.role && (
                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Role: {goal.role}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repositories */}
                {projectDetails.repositories.length > 0 && (
                  <div className={`p-6 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      Connected Repositories
                    </h3>
                    <div className="space-y-3">
                      {projectDetails.repositories.map((repo) => (
                        <div key={repo.id} className={`flex items-center gap-3 p-4 rounded border ${
                          theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <GitBranch className="w-5 h-5 text-purple-500" />
                          <div className="flex-1">
                            <div className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                              {repo.name}
                            </div>
                            <a 
                              href={repo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-500 hover:underline"
                            >
                              {repo.url}
                            </a>
                          </div>
                          <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {repo.branch}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-4">
                {projectDetails.backlog.length === 0 ? (
                  <div className={`p-12 text-center rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      No Tasks Yet
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Generate a backlog to see tasks and assignments
                    </p>
                  </div>
                ) : (
                  projectDetails.backlog.map((epic) => (
                    <div key={epic.id} className={`rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                            {epic.title}
                          </h3>
                          {epic.ai && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              <Sparkles className="w-3 h-3" />
                              AI Generated
                            </span>
                          )}
                        </div>
                        {epic.description && (
                          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {epic.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="p-4 space-y-4">
                        {epic.sub_epics.map((subEpic) => (
                          <div key={subEpic.id}>
                            <h4 className={`text-md font-medium mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                              {subEpic.title}
                            </h4>
                            
                            {subEpic.user_stories.map((story) => (
                              <div key={story.id} className="mb-4">
                                <h5 className={`text-sm font-medium mb-2 pl-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {story.title}
                                </h5>
                                
                                <div className="space-y-2 pl-4">
                                  {story.tasks.map((task) => (
                                    <TaskRow
                                      key={task.id}
                                      task={task}
                                      userStoryTitle={story.title}
                                      epicTitle={epic.title}
                                      theme={theme}
                                      currentUserEmail={currentUserEmail}
                                      onTaskComplete={openTaskCompletionModal}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className={`p-6 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      Team Members ({projectDetails.members.length})
                    </h3>
                  </div>

                  {projectDetails.members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        No team members yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projectDetails.members.map((member) => (
                        <TeamMemberCard key={member.id} member={member} theme={theme} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Member Task Distribution */}
                <div className={`p-6 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                    Task Distribution
                  </h3>
                  
                  <div className="space-y-4">
                    {projectDetails.members.map((member) => {
                      const memberTasks = projectDetails.backlog.flatMap(epic =>
                        epic.sub_epics.flatMap(subEpic =>
                          subEpic.user_stories.flatMap(story =>
                            story.tasks.filter(task => 
                              task.assignee_details?.user_email === member.user_email ||
                              task.assignee?.user_email === member.user_email
                            )
                          )
                        )
                      );

                      const completedCount = memberTasks.filter(t => t.status === 'done').length;
                      const totalCount = memberTasks.length;
                      const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                      return (
                        <div key={member.id} className={`p-4 rounded-lg border ${
                          theme === 'dark' ? 'bg-gray-750 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar member={member} size="sm" theme={theme} />
                              <div>
                                <div className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {member.user_name}
                                </div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {member.role}
                                </div>
                              </div>
                            </div>
                            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {completedCount}/{totalCount} tasks
                            </div>
                          </div>
                          
                          <div className={`w-full h-2 rounded-full overflow-hidden ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                          }`}>
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {projectDetails.timeline.length === 0 ? (
                  <div className={`p-12 text-center rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <Calendar className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      No Timeline Yet
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Generate project overview to see the timeline
                    </p>
                  </div>
                ) : (
                  <div className={`p-6 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      Project Timeline
                    </h3>
                    
                    <div className="space-y-6">
                      {projectDetails.timeline
                        .sort((a, b) => a.week_number - b.week_number)
                        .map((week) => (
                          <div key={week.id} className={`border-l-4 border-blue-500 pl-6 pb-6 relative ${
                            theme === 'dark' ? 'border-opacity-70' : ''
                          }`}>
                            <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-500 rounded-full border-4 border-white"></div>
                            
                            <div className={`font-semibold mb-3 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                              Week {week.week_number}
                            </div>
                            
                            <div className="space-y-2">
                              {week.timeline_items.map((item) => (
                                <div 
                                  key={item.id} 
                                  className={`flex items-start gap-2 p-3 rounded ${
                                    theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
                                  }`}
                                >
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {item.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'repository' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Git Repositories</h2>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>View project repositories</p>
                </div>

                {projectDetails.repositories.length === 0 ? (
                  <div className={`p-12 text-center rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <GitBranch className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                      No repositories yet
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      No repositories have been added to this project
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projectDetails.repositories.map((repo) => (
                      <div key={repo.id} className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                              <GitBranch className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {repo.name}
                              </h3>
                              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Branch: {repo.branch}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className={`flex items-center text-sm p-3 rounded-lg ${
                            theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'
                          }`}>
                            <span className="font-medium mr-2">URL:</span>
                            <a 
                              href={repo.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {repo.url}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Task Completion Modal */}
      {showTaskCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-md mx-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Complete Task</h3>
            <p className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              ⚠️ Warning: Once marked as done, this action cannot be undone. Please provide commit information to complete this task.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Commit Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCommitTitle}
                  onChange={(e) => setEditingCommitTitle(e.target.value)}
                  placeholder="e.g., Fix login bug, Add user authentication"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Branch Name (Optional)
                </label>
                <input
                  type="text"
                  value={editingCommitBranch}
                  onChange={(e) => setEditingCommitBranch(e.target.value)}
                  placeholder="e.g., feature/login-fix, bugfix/auth"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTaskCompletionModal(false);
                  setCompletingTaskId(null);
                  setEditingCommitTitle('');
                  setEditingCommitBranch('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editingCommitTitle.trim()) {
                    showError('Validation Error', 'Commit title is required');
                    return;
                  }
                  if (completingTaskId) {
                    completeTask(completingTaskId, editingCommitTitle, editingCommitBranch);
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark as Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Viewer Modal */}
      {showProposalViewer && projectDetails.proposal && (
        <ProposalViewer
          isOpen={showProposalViewer}
          onClose={() => setShowProposalViewer(false)}
          proposalData={projectDetails.proposal}
        />
      )}
    </div>
  );
};

export default ProjectDetails;