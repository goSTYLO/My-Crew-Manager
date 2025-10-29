import { useState, useEffect } from 'react';
import { Plus, Edit, Edit2, Trash2, Send, X, BarChart3, Users, FileText, Target, CheckCircle, Clock, RefreshCw, ArrowLeft, GitBranch, Save, Camera, Upload, Calendar as CalendarIcon } from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";
import Sidebar from "../../components/sidebarLayout";
import { useTheme } from "../../components/themeContext";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from "../../config/api";
import LoadingSpinner from '../../components/LoadingSpinner';
import RegenerationSuccessModal from '../../components/RegenerationSuccessModal';
import { useToast } from '../../components/ToastContext';
import { useRealtimeUpdates } from '../../hooks/useRealtimeUpdates';
import ProposalViewer from '../../components/ProposalViewer';
import { 
  calculateTaskStats, 
  generateWeeklyData, 
  getDefaultAnalyticsConfig 
} from '../../utils/analyticsUtils';
import type { 
  AnalyticsConfig, 
  TaskStats, 
  WeeklyData 
} from '../../utils/analyticsUtils';

export default function ProjectDetailsUI() {
  const { theme } = useTheme();
  const { showSuccess, showError, showWarning, showRealtimeUpdate } = useToast();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return tab && ['monitoring', 'overview', 'backlog', 'members', 'repository'].includes(tab) 
      ? tab 
      : 'monitoring';
  });
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{type: string, id: any, name: string} | null>(null);
  

  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [showAddTimelineTaskModal, setShowAddTimelineTaskModal] = useState(false);
  const [newWeekNumber, setNewWeekNumber] = useState('');
  const [newTimelineTaskTitle, setNewTimelineTaskTitle] = useState('');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  

  const [showAddEpicModal, setShowAddEpicModal] = useState(false);
  const [showAddSubEpicModal, setShowAddSubEpicModal] = useState(false);
  const [showAddUserStoryModal, setShowAddUserStoryModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newEpicTitle, setNewEpicTitle] = useState('');
  const [newEpicDescription, setNewEpicDescription] = useState('');
  const [newSubEpicTitle, setNewSubEpicTitle] = useState('');
  const [newUserStoryTitle, setNewUserStoryTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedEpicId, setSelectedEpicId] = useState<number | null>(null);
  const [selectedSubEpicId, setSelectedSubEpicId] = useState<number | null>(null);
  const [selectedUserStoryId, setSelectedUserStoryId] = useState<number | null>(null);
  

  const [isEditingBacklog, setIsEditingBacklog] = useState(false);
  const [modifiedItems, setModifiedItems] = useState<Set<string>>(new Set());
  

  const [editingCommitTitle, setEditingCommitTitle] = useState('');
  const [editingCommitBranch, setEditingCommitBranch] = useState('');
  const [showTaskCompletionModal, setShowTaskCompletionModal] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'regenerating-overview' | 'regenerating-backlog' | null>(null);
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);
  const [regenerationType, setRegenerationType] = useState<'overview' | 'backlog'>('overview');
  

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);
  

  const [currentProposal, setCurrentProposal] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showProposalViewer, setShowProposalViewer] = useState(false);
  
  // Project status state
  const [projectStatus, setProjectStatus] = useState<string>('in_progress');
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<string | null>(null);
  const [statusUpdatedBy, setStatusUpdatedBy] = useState<string | null>(null);
  
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  

  const AI_API_BASE_URL = `${API_BASE_URL}/ai`;


  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('token');
    console.log('🔍 Token from sessionStorage:', token ? 'Found' : 'Not found');
    return {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleApiError = (error: any, operation: string) => {
    console.error(`Error ${operation}:`, error);
    if (error.status === 401) {
      showError('Authentication Failed', 'Please log in again.');
      sessionStorage.removeItem('token');
      navigate('/sign-in');
    } else {
      showError('Operation Failed', `Failed to ${operation}. Please try again.`);
    }
  };


  const showConfirmation = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm', cancelText = 'Cancel') => {
    setConfirmModalData({
      title,
      message,
      onConfirm,
      confirmText,
      cancelText
    });
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmModalData) {
      confirmModalData.onConfirm();
      setShowConfirmModal(false);
      setConfirmModalData(null);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmModalData(null);
  };


  const performRegenerateOverview = async () => {
    try {
      setLoadingState('regenerating-overview');
      const response = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/generate-overview/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Overview regenerated:', data);
      

      await fetchProjectData();
      

      setRegenerationType('overview');
      setShowRegenerationModal(true);
    } catch (error) {
      console.error('❌ Error regenerating overview:', error);
      handleApiError(error, 'regenerate overview');
    } finally {
      setLoadingState(null);
    }
  };

  const regenerateOverview = () => {
    showConfirmation(
      'Regenerate Project Overview',
      'This will regenerate your project overview using AI, including features, roles, goals, and timeline.\n\n⚠️ This process cannot be canceled once started and may take several minutes to complete.\n\nAll existing project overview data will be replaced with new AI-generated content.\n\nDo you want to continue?',
      performRegenerateOverview,
      'Regenerate Overview',
      'Cancel'
    );
  };

  const performRegenerateBacklog = async () => {
    try {
      setLoadingState('regenerating-backlog');
      const response = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/generate-backlog/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backlog regenerated:', data);
      

      await fetchBacklog();
      

      setRegenerationType('backlog');
      setShowRegenerationModal(true);
    } catch (error) {
      console.error('❌ Error regenerating backlog:', error);
      handleApiError(error, 'regenerate backlog');
    } finally {
      setLoadingState(null);
    }
  };

  const regenerateBacklog = () => {
    showConfirmation(
      'Regenerate Project Backlog',
      'This will regenerate your project backlog using AI, including epics, sub-epics, user stories, and tasks.\n\n⚠️ This process cannot be canceled once started and may take several minutes to complete.\n\nAll existing backlog data will be replaced with new AI-generated content.\n\nDo you want to continue?',
      performRegenerateBacklog,
      'Regenerate Backlog',
      'Cancel'
    );
  };


  const fetchProjectData = async () => {
    try {
      console.log('🔍 Fetching project data for projectId:', projectId);
      

      const projectRes = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!projectRes.ok) {
        console.error('❌ Project fetch failed:', projectRes.status);
        throw new Error(`HTTP error! status: ${projectRes.status}`);
      }

      const project = await projectRes.json();
      console.log('✅ Project data fetched:', project);

      // Set project status fields
      setProjectStatus(project.status || 'in_progress');
      setStatusUpdatedAt(project.status_updated_at);
      setStatusUpdatedBy(project.status_updated_by_name);


      const [featuresRes, rolesRes, goalsRes, timelineRes] = await Promise.allSettled([
        fetch(`${AI_API_BASE_URL}/project-features/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        fetch(`${AI_API_BASE_URL}/project-roles/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        fetch(`${AI_API_BASE_URL}/project-goals/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        fetch(`${AI_API_BASE_URL}/timeline-weeks/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
      ]);


      const features = featuresRes.status === 'fulfilled' && featuresRes.value.ok 
        ? await featuresRes.value.json() 
        : [];
      const roles = rolesRes.status === 'fulfilled' && rolesRes.value.ok 
        ? await rolesRes.value.json() 
        : [];
      const goals = goalsRes.status === 'fulfilled' && goalsRes.value.ok 
        ? await goalsRes.value.json() 
        : [];
      const timeline = timelineRes.status === 'fulfilled' && timelineRes.value.ok
        ? await timelineRes.value.json()
        : [];


      const roleNames = roles.map((role: any) => role.role || role.name).filter(Boolean);
      setProjectRoles(roleNames);

      console.log('✅ Related data fetched:', { features, roles, goals, timeline });

      const processedTimeline = (timeline || []).map((week: any) => ({
        id: week.id,
        week: week.week_number,
        items: (week.timeline_items || []).map((item: any) => ({ id: item.id, title: item.title }))
      }));

      setProjectData({
        id: project.id,
        title: project.title,
        aiSummary: project.summary,
        created_by: project.created_by, // Add this field
        roles: (roles || []).map((role: any) => ({ id: role.id, role: role.role, ai: role.ai })),
        features: (features || []).map((feature: any) => ({ id: feature.id, title: feature.title, ai: feature.ai })),
        goals: (goals || []).map((goal: any) => ({ id: goal.id, title: goal.title, ai: goal.ai })),
        timeline: processedTimeline
      });
    } catch (error) {
      console.error('❌ Error in fetchProjectData:', error);
      handleApiError(error, 'fetch project data');
    }
  };


  const fetchBacklog = async () => {
    try {
      console.log('🔍 Fetching backlog for projectId:', projectId);
      const response = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/backlog/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Backlog fetch failed:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backlog data fetched:', data);
      
      // Debug due dates specifically
      console.log('🔍 DEBUGGING DUE DATES:');
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

      if (data.epics && data.epics.length > 0) {
        const firstEpic = data.epics[0];
        if (firstEpic.sub_epics && firstEpic.sub_epics.length > 0) {
          const firstSubEpic = firstEpic.sub_epics[0];
          if (firstSubEpic.user_stories && firstSubEpic.user_stories.length > 0) {
            const firstStory = firstSubEpic.user_stories[0];
            if (firstStory.tasks && firstStory.tasks.length > 0) {
              const firstTask = firstStory.tasks[0];
              console.log('🔍 First task assignee details:', firstTask.assignee_details);
            }
          }
        }
      }
      

      const transformedBacklog = {
        epics: (data.epics || []).map((epic: any) => ({
          id: epic.id,
          title: epic.title,
          description: epic.description,
          ai: epic.ai,
          is_complete: epic.is_complete || false,
          subEpics: (epic.sub_epics || []).map((subEpic: any) => ({
            id: subEpic.id,
            title: subEpic.title,
            ai: subEpic.ai,
            is_complete: subEpic.is_complete || false,
            userStories: (subEpic.user_stories || []).map((story: any) => ({
              id: story.id,
              title: story.title,
              ai: story.ai,
              is_complete: story.is_complete || false,
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
        }))
      };

      setBacklog(transformedBacklog);
    } catch (error) {
      handleApiError(error, 'fetch backlog');
    }
  };


  const fetchMembers = async () => {
    try {
      console.log('🔍 Fetching members for projectId:', projectId);
      const response = await fetch(`${AI_API_BASE_URL}/project-members/?project_id=${projectId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Members fetch failed:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Members data fetched:', data);
      

      const transformedMembers = data.map((member: any) => ({
        id: member.id,
        name: member.user_name,
        email: member.user_email,
        role: member.role,
        avatar: `bg-${['blue', 'green', 'purple', 'red', 'yellow'][member.id % 5]}-400`,
        image: `bg-${['blue', 'green', 'purple', 'red', 'yellow'][member.id % 5]}-400`
      }));

      setMembers(transformedMembers);
    } catch (error) {
      handleApiError(error, 'fetch members');
    }
  };


  const fetchPendingInvitations = async () => {
    try {
      console.log('🔍 Fetching pending invitations for projectId:', projectId);
      const response = await fetch(`${AI_API_BASE_URL}/invitations/?project_id=${projectId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Invitations fetch failed:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Pending invitations data fetched:', data);
      

      const pendingInvitations = data.filter((invitation: any) => invitation.status === 'pending');
      return pendingInvitations;
    } catch (error) {
      console.error('❌ Error fetching invitations:', error);
      return [];
    }
  };


  const cancelInvitation = async (invitationId: number) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/invitations/${invitationId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        showSuccess('Invitation Cancelled', 'The invitation has been cancelled successfully.');

        const updatedInvitations = await fetchPendingInvitations();
        setPendingInvitations(updatedInvitations);
      } else {
        const errorData = await response.json();
        showError('Cancellation Failed', `Failed to cancel invitation: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'cancel invitation');
    }
  };


  const fetchRepositories = async () => {
    try {
      console.log('🔍 Fetching repositories for projectId:', projectId);
      const response = await fetch(`${AI_API_BASE_URL}/repositories/?project_id=${projectId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ No repositories found for this project (404) - this is normal');
          setRepositories([]);
          return;
        }
        console.error('❌ Repositories fetch failed:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Repositories data fetched:', data);
      setRepositories(data);
    } catch (error) {
      console.error('❌ Error in fetchRepositories:', error);

      setRepositories([]);
    }
  };


  const fetchCurrentProposal = async () => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/current-proposal/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentProposal(data);
      } else if (response.status === 404) {
        setCurrentProposal(null);
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setCurrentProposal(null);
    }
  };


  const assignTask = async (taskId: number, assigneeId: number | null) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ assignee: assigneeId }),
      });

      if (response.ok) {
        showSuccess('Task Assigned', 'Task assignment updated successfully');
        console.log('🔄 Refreshing backlog after assignment...');
        await fetchBacklog(); // Refresh backlog to show updated assignee
        console.log('✅ Backlog refreshed');
      } else {
        const errorData = await response.json();
        showError('Assignment Failed', errorData.error || 'Failed to assign task');
      }
    } catch (error) {
      handleApiError(error, 'assign task');
    }
  };

  const completeTask = async (taskId: number, commitTitle: string, commitBranch?: string) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ 
          status: 'done',
          commit_title: commitTitle,
          commit_branch: commitBranch || null
        }),
      });

      if (response.ok) {
        showSuccess('Task Completed', 'Task marked as done successfully');
        await fetchBacklog(); // Refresh backlog to show updated status and auto-completion
        setShowTaskCompletionModal(false);
        setCompletingTaskId(null);
        setEditingCommitTitle('');
        setEditingCommitBranch('');
      } else {
        const errorData = await response.json();
        showError('Completion Failed', errorData.error || 'Failed to complete task');
      }
    } catch (error) {
      handleApiError(error, 'complete task');
    }
  };

  const updateTaskDueDate = async (taskId: number, dueDate: string | null) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ due_date: dueDate })
      });

      if (response.ok) {
        showSuccess('Due Date Updated', dueDate ? 'Task due date set successfully' : 'Task due date cleared');
        await fetchBacklog();
      } else {
        const errorData = await response.json();
        showError('Update Failed', errorData.error || 'Failed to update due date');
      }
    } catch (error) {
      handleApiError(error, 'update task due date');
    }
  };

  const openTaskCompletionModal = (taskId: number) => {
    setCompletingTaskId(taskId);
    setShowTaskCompletionModal(true);
    setEditingCommitTitle('');
    setEditingCommitBranch('');
  };


  useEffect(() => {
    if (projectId) {
      console.log('🚀 Starting to load all data for projectId:', projectId);
      const loadAllData = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log('📡 Making parallel API calls...');
          await Promise.all([
            fetchProjectData(),
            fetchBacklog(),
            fetchMembers(),
            fetchRepositories(),
            fetchCurrentProposal()
          ]);
          

          const invitations = await fetchPendingInvitations();
          setPendingInvitations(invitations);
          console.log('✅ All data loaded successfully');
        } catch (error) {
          console.error('❌ Error loading data:', error);
          setError('Failed to load project data');
        } finally {
          console.log('🏁 Setting loading to false');
          setLoading(false);
        }
      };
      loadAllData();
    } else {
      console.log('❌ No projectId provided');
    }
  }, [projectId]);


  useRealtimeUpdates({
    projectId: projectId ? parseInt(projectId) : undefined,
    callbacks: {
      onProjectUpdate: (data) => {
        console.log('📡 Real-time project update received:', data);
        showRealtimeUpdate('Project Updated', `${data.action} project`, data.actor);

        fetchProjectData();
      },
      onEpicUpdate: (data) => {
        console.log('📡 Real-time epic update received:', data);
        showRealtimeUpdate('Epic Updated', `Epic ${data.action}`, data.actor);

        fetchBacklog();
      },
      onSubEpicUpdate: (data) => {
        console.log('📡 Real-time sub-epic update received:', data);
        showRealtimeUpdate('Sub-Epic Updated', `Sub-epic ${data.action}`, data.actor);

        fetchBacklog();
      },
      onUserStoryUpdate: (data) => {
        console.log('📡 Real-time user story update received:', data);
        showRealtimeUpdate('User Story Updated', `User story ${data.action}`, data.actor);

        fetchBacklog();
      },
      onTaskUpdate: (data) => {
        console.log('📡 Real-time task update received:', data);
        
        // Refresh backlog to get updated task data
        fetchBacklog();

        let message = `Task ${data.action}`;
        if (data.action === 'updated' && data.data && data.data.status === 'done') {
          message = 'Task completed';
        } else if (data.action === 'updated' && data.data && data.data.assignee) {
          message = 'Task assigned';
        }
        
        showRealtimeUpdate('Task Updated', message, data.actor);

        fetchBacklog();
      },
      onMemberUpdate: (data) => {
        console.log('📡 Real-time member update received:', data);
        
        const message = data.action === 'joined' 
          ? `${data.actor.name} joined the project`
          : `${data.actor.name} left the project`;
        
        showRealtimeUpdate('Team Updated', message, data.actor);

        fetchMembers();
        fetchPendingInvitations();
      },
      onRepositoryUpdate: (data) => {
        console.log('📡 Real-time repository update received:', data);
        showRealtimeUpdate('Repository Updated', `Repository ${data.action}`, data.actor);

        fetchRepositories();
      },
      onBacklogRegenerated: (data) => {
        console.log('📡 Real-time backlog regeneration received:', data);
        showRealtimeUpdate('Backlog Regenerated', 'Project backlog has been regenerated', data.actor);

        fetchBacklog();
      },
      onOverviewRegenerated: (data) => {
        console.log('📡 Real-time overview regeneration received:', data);
        showRealtimeUpdate('Overview Regenerated', 'Project overview has been regenerated', data.actor);

        fetchProjectData();
      },
      onNotification: (data) => {
        console.log('📡 Real-time notification received:', data);
        
        // Handle project status change notifications
        if (data.notification && data.notification.type === 'project_status_changed') {
          console.log('📡 Project status change notification received:', data);
          
          // Update the status state with the new data
          if (data.notification.message) {
            // Extract status from the message or use the notification data
            const statusMatch = data.notification.message.match(/to "([^"]+)"/);
            if (statusMatch) {
              const newStatus = statusMatch[1].toLowerCase().replace(' ', '_');
              setProjectStatus(newStatus);
            }
          }
          
          // Refresh project data to get the latest status info
          fetchProjectData();
        }
      }
    }
  });
  
  const [projectData, setProjectData] = useState({
    id: 1, // Assuming project ID is available here
    title: 'Finder 4 — Lost & Found Tracker',
    aiSummary: 'A comprehensive mobile application project focused on creating an intuitive user experience with modern design principles and seamless functionality.',
    created_by: null, // Add this field
    roles: [
      { id: 1, role: 'UI/UX Designer' },
      { id: 2, role: 'Frontend Developer' },
      { id: 3, role: 'Backend Developer' },
      { id: 4, role: 'QA Engineer' }
    ],
    features: [
      { id: 1, title: 'User Authentication' },
      { id: 2, title: 'Dashboard Analytics' },
      { id: 3, title: 'Real-time Notifications' },
      { id: 4, title: 'Data Visualization' }
    ],
    goals: [
      { id: 1, title: 'Launch MVP by Q2 2025' },
      { id: 2, title: 'Achieve 10k+ active users' },
      { id: 3, title: 'Maintain 99.9% uptime' },
      { id: 4, title: 'Implement AI-powered features' }
    ],
    timeline: [
      { 
        id: 1, 
        week: 'Week 1', 
        items: [
          { id: 1, title: 'Project kickoff' },
          { id: 2, title: 'Requirements gathering' },
          { id: 3, title: 'Initial wireframes' },
          { id: 4, title: 'Tech stack selection' }
        ] 
      },
      { 
        id: 2, 
        week: 'Week 2', 
        items: [
          { id: 5, title: 'Database design' },
          { id: 6, title: 'API architecture' },
          { id: 7, title: 'UI mockups' },
          { id: 8, title: 'Development environment setup' }
        ] 
      }
    ]
  });

  const [backlog, setBacklog] = useState({
    epics: [
      {
        id: 1,
        title: 'User Management System',
        description: 'Core user features',
        ai: true,
        subEpics: [
          {
            id: 1,
            title: 'Authentication',
            ai: true,
            userStories: [
              {
                id: 1,
                title: 'As a user, I want to register with email',
                ai: true,
                tasks: [
                  { id: 1, title: 'Create registration form', status: 'pending', ai: true, assignee: null }
                ]
              }
            ]
          }
        ]
      }
    ]
  });

  const [members, setMembers] = useState([
    { id: 1, name: 'Randal Phuta', email: 'randal@example.com', role: 'Project Manager', image: 'bg-blue-400' },
    { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', role: 'Frontend Developer', image: 'bg-green-400' }
  ]);

  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

  const [repositories, setRepositories] = useState([
    { id: 1, name: 'frontend-repo', url: 'https://github.com/company/frontend-repo', branch: 'main' },
    { id: 2, name: 'backend-api', url: 'https://github.com/company/backend-api', branch: 'develop' }
  ]);

  const [inviteForm, setInviteForm] = useState({ email: '', role: '' });
  const [projectRoles, setProjectRoles] = useState<string[]>([]);
  const [repoForm, setRepoForm] = useState({ name: '', url: '', branch: 'main' });
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState(null);


  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>(getDefaultAnalyticsConfig());
  const [taskStats, setTaskStats] = useState<TaskStats>({
    completed: 0,
    inProgress: 0,
    pending: 0,
    total: 0
  });
  const [weeklyData, setWeeklyData] = useState<WeeklyData>({
    weeks: [],
    completed: [],
    inProgress: [],
    pending: []
  });


  useEffect(() => {
    if (backlog) {
      console.log('📊 Calculating analytics for backlog:', backlog);
      const stats = calculateTaskStats(backlog, analyticsConfig);
      setTaskStats(stats);
      
      const weekly = generateWeeklyData(backlog, analyticsConfig);
      setWeeklyData(weekly);
      
      console.log('📈 Analytics calculated:', { stats, weekly });
    }
  }, [backlog, analyticsConfig]);

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.role) {
      showWarning('Missing Information', 'Please fill out both email and role fields.');
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      showError('Authentication Required', 'Please log in again.');
      return;
    }

    try {

      const usersResponse = await fetch(
        `${API_BASE_URL}/user/?email=${encodeURIComponent(inviteForm.email)}`,
        {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        }
      );

      if (!usersResponse.ok) {
        console.warn(`Failed to lookup user with email ${inviteForm.email}`);
        showError('User Not Found', `User with email ${inviteForm.email} not found. Please make sure they have an account.`);
        return;
      }

      const users = await usersResponse.json();
      
      if (users.length === 0) {
        console.warn(`User with email ${inviteForm.email} not found`);
        showError('User Not Found', `User with email ${inviteForm.email} not found. Please make sure they have an account.`);
        return;
      }
      
      const user = users[0];
      

      const existingInvitation = pendingInvitations.find(inv => inv.invitee === parseInt(user.user_id));
      if (existingInvitation) {
        showWarning('Invitation Already Sent', `An invitation has already been sent to ${inviteForm.email} for this project. Please wait for them to respond.`);
        return;
      }
      

      const isAlreadyMember = members.some(member => member.email === inviteForm.email);
      if (isAlreadyMember) {
        showWarning('User Already Member', `${inviteForm.email} is already a member of this project.`);
        return;
      }
      

      const response = await fetch(`${AI_API_BASE_URL}/invitations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          project: parseInt(projectId!),
          invitee: parseInt(user.user_id),
          role: inviteForm.role,  // Send the role with the invitation
          message: `You have been invited to join the project "${projectData.title}" as ${inviteForm.role}.`
        }),
      });

      if (response.ok) {
        showSuccess('Invitation Sent!', 'Team member invitation sent successfully.');
        setInviteForm({ email: '', role: '' });
        setShowInviteModal(false);

        fetchMembers();
        const updatedInvitations = await fetchPendingInvitations();
        setPendingInvitations(updatedInvitations);
      } else {
        const errorData = await response.json();
        console.error('Failed to send invitation:', errorData);
        

        if (response.status === 409) {
          if (errorData.error && errorData.error.includes("pending invitation already exists")) {
            showWarning('Invitation Already Sent', `An invitation has already been sent to ${inviteForm.email} for this project. Please wait for them to respond or check the invitation status.`);
          } else if (errorData.error && errorData.error.includes("already a member")) {
            showWarning('User Already Member', `${inviteForm.email} is already a member of this project.`);
          } else {
            showError('Invitation Conflict', `There's a conflict with sending the invitation: ${errorData.error || 'Unknown conflict'}`);
          }
        } else if (response.status === 403) {
          showError('Permission Denied', 'You do not have permission to send invitations for this project.');
        } else if (response.status === 404) {
          showError('Project Not Found', 'The project could not be found. Please refresh and try again.');
        } else {
          showError('Invitation Failed', `Failed to send invitation: ${errorData.error || errorData.message || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      handleApiError(error, 'send invitation');
    }
  };

  const handleEditMember = async (updatedMember: any) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/project-members/${updatedMember.id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          role: updatedMember.role
        }),
      });

      if (response.ok) {
        showSuccess('Member Updated!', 'Team member has been updated successfully.');
        setShowEditMemberModal(false);
        setEditingMember(null);
        fetchMembers(); // Refresh members list
      } else {
        const errorData = await response.json();
        showError('Update Failed', `Failed to update member: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'update member');
    }
  };


  const addNewEpic = async (epicData: any) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/epics/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          project: projectId,
          title: epicData.title,
          description: epicData.description || '',
          ai: false
        }),
      });

      if (response.ok) {
        fetchBacklog(); // Refresh backlog
      } else {
        const errorData = await response.json();
        showError('Epic Creation Failed', `Failed to create epic: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create epic');
    }
  };


  const addNewSubEpic = async (subEpicData: any, epicId: any) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/sub-epics/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          epic: epicId,
          title: subEpicData.title,
          ai: false
        }),
      });

      if (response.ok) {
        fetchBacklog(); // Refresh backlog
      } else {
        const errorData = await response.json();
        showError('Sub-Epic Creation Failed', `Failed to create sub-epic: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create sub-epic');
    }
  };


  const addNewUserStory = async (storyData: any, subEpicId: any) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/user-stories/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          sub_epic: subEpicId,
          title: storyData.title,
          ai: false
        }),
      });

      if (response.ok) {
        fetchBacklog(); // Refresh backlog
      } else {
        const errorData = await response.json();
        showError('User Story Creation Failed', `Failed to create user story: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create user story');
    }
  };


  const addNewTask = async (taskData: any, userStoryId: any) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/story-tasks/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          user_story: userStoryId,
          title: taskData.title,
          status: 'pending',
          ai: false
        }),
      });

      if (response.ok) {
        fetchBacklog(); // Refresh backlog
      } else {
        const errorData = await response.json();
        showError('Task Creation Failed', `Failed to create task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create task');
    }
  };


  const updateEpicTitle = async (epicId: number, newTitle: string) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/epics/${epicId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update epic title');
      }
      

      setModifiedItems(prev => new Set(prev).add(`epic-${epicId}`));
    } catch (error) {
      handleApiError(error, 'update epic title');
    }
  };

  const updateSubEpicTitle = async (subEpicId: number, newTitle: string) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/sub-epics/${subEpicId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update sub-epic title');
      }
      

      setModifiedItems(prev => new Set(prev).add(`subepic-${subEpicId}`));
    } catch (error) {
      handleApiError(error, 'update sub-epic title');
    }
  };

  const updateUserStoryTitle = async (storyId: number, newTitle: string) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/user-stories/${storyId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update user story title');
      }
      

      setModifiedItems(prev => new Set(prev).add(`story-${storyId}`));
    } catch (error) {
      handleApiError(error, 'update user story title');
    }
  };

  const updateTaskTitle = async (taskId: number, newTitle: string) => {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update task title');
      }
      

      setModifiedItems(prev => new Set(prev).add(`task-${taskId}`));
    } catch (error) {
      handleApiError(error, 'update task title');
    }
  };


  const saveBacklogChanges = async () => {
    try {
      const updatePromises = [];


      for (const epic of backlog.epics) {

        if (modifiedItems.has(`epic-${epic.id}`)) {
          updatePromises.push(updateEpicTitle(epic.id, epic.title));
        }


        for (const subEpic of epic.subEpics || []) {
          if (modifiedItems.has(`subepic-${subEpic.id}`)) {
            updatePromises.push(updateSubEpicTitle(subEpic.id, subEpic.title));
          }


          for (const userStory of subEpic.userStories || []) {
            if (modifiedItems.has(`story-${userStory.id}`)) {
              updatePromises.push(updateUserStoryTitle(userStory.id, userStory.title));
            }


            for (const task of userStory.tasks || []) {
              if (modifiedItems.has(`task-${task.id}`)) {
                updatePromises.push(updateTaskTitle(task.id, task.title));
              }
            }
          }
        }
      }


      await Promise.all(updatePromises);
      

      await fetchBacklog();
      

      setModifiedItems(new Set());
      setIsEditingBacklog(false);
      
      console.log('✅ All backlog changes saved successfully');
    } catch (error) {
      console.error('❌ Error saving backlog changes:', error);
      showError('Save Failed', 'Failed to save some changes. Please try again.');
    }
  };



  const updateProject = async () => {
    try {

      const projectResponse = await fetch(`${AI_API_BASE_URL}/projects/${projectId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          title: projectData.title,
          summary: projectData.aiSummary
        }),
      });

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        showError('Project Update Failed', `Failed to update project: ${errorData.message || 'Unknown error'}`);
        return;
      }


      const featuresPromises = projectData.features.map(async (feature) => {
        if (feature.id) {
          const response = await fetch(`${AI_API_BASE_URL}/project-features/${feature.id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ title: feature.title }),
          });
          return response.ok;
        }
        return true;
      });


      const rolesPromises = projectData.roles.map(async (role) => {
        if (role.id) {
          const response = await fetch(`${AI_API_BASE_URL}/project-roles/${role.id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ role: role.role }),
          });
          return response.ok;
        }
        return true;
      });


      const goalsPromises = projectData.goals.map(async (goal) => {
        if (goal.id) {
          const response = await fetch(`${AI_API_BASE_URL}/project-goals/${goal.id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ title: goal.title }),
          });
          return response.ok;
        }
        return true;
      });


      const timelinePromises = projectData.timeline.flatMap(week => 
        week.items.map(async (item) => {
          if (item.id) {
            const response = await fetch(`${AI_API_BASE_URL}/timeline-items/${item.id}/`, {
              method: 'PATCH',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({ title: item.title }),
            });
            return response.ok;
          }
          return true;
        })
      );


      await Promise.all([...featuresPromises, ...rolesPromises, ...goalsPromises, ...timelinePromises]);


      await fetchProjectData();

      showSuccess('Project Updated!', 'Project has been updated successfully.');
      setIsEditingOverview(false);
    } catch (error) {
      handleApiError(error, 'update project');
    }
  };

  const updateProjectStatus = async (newStatus: string) => {
    try {
      const response = await fetch(
        `${AI_API_BASE_URL}/projects/${projectId}/update-status/`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setProjectStatus(data.status);
        setStatusUpdatedAt(data.status_updated_at);
        setStatusUpdatedBy(data.status_updated_by_name);
        showSuccess('Status Updated', 'Project status updated successfully');
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to update status');
      }
    } catch (error) {
      handleApiError(error, 'updating project status');
    }
  };

  const addFeature = async () => {
    if (!newFeatureTitle.trim()) return;
    
    try {
      const response = await fetch(`${AI_API_BASE_URL}/project-features/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          project: projectId,
          title: newFeatureTitle.trim()
        }),
      });

      if (response.ok) {
        setNewFeatureTitle('');
        setShowAddFeatureModal(false);
        fetchProjectData(); // Refresh project data
      } else {
        const errorData = await response.json();
        showError('Feature Creation Failed', `Failed to add feature: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add feature');
    }
  };

  const handleDeleteClick = (type: string, id: any, name: string) => {
    setDeleteItem({ type, id, name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    
    try {
      let endpoint = '';
      switch (deleteItem.type) {
        case 'feature':
          endpoint = `${AI_API_BASE_URL}/project-features/${deleteItem.id}/`;
          break;
        case 'role':
          endpoint = `${AI_API_BASE_URL}/project-roles/${deleteItem.id}/`;
          break;
        case 'goal':
          endpoint = `${AI_API_BASE_URL}/project-goals/${deleteItem.id}/`;
          break;
        case 'timeline':
          endpoint = `${AI_API_BASE_URL}/timeline-items/${deleteItem.id}/`;
          break;
        case 'timeline-week':
          endpoint = `${AI_API_BASE_URL}/timeline-weeks/${deleteItem.id}/`;
          break;
        case 'epic':
          endpoint = `${AI_API_BASE_URL}/epics/${deleteItem.id}/`;
          break;
        case 'sub-epic':
          endpoint = `${AI_API_BASE_URL}/sub-epics/${deleteItem.id}/`;
          break;
        case 'user-story':
          endpoint = `${AI_API_BASE_URL}/user-stories/${deleteItem.id}/`;
          break;
        case 'task':
          endpoint = `${AI_API_BASE_URL}/story-tasks/${deleteItem.id}/`;
          break;
        case 'member':
          endpoint = `${AI_API_BASE_URL}/project-members/${deleteItem.id}/`;
          break;
        case 'repository':
          endpoint = `${AI_API_BASE_URL}/repositories/${deleteItem.id}/`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setDeleteItem(null);
        

        if (deleteItem.type === 'member') {
          fetchMembers(); // Refresh members list
        } else if (deleteItem.type === 'repository') {
          fetchRepositories(); // Refresh repositories list
        } else {
          fetchProjectData(); // Refresh project data for other items
        }
        
        showSuccess('Delete Successful', `${deleteItem.type} has been deleted successfully.`);
      } else {
        const errorData = await response.json();
        showError('Delete Failed', `Failed to delete ${deleteItem.type}: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, `delete ${deleteItem.type}`);
    }
  };

  const addRole = async () => {
    if (!newRoleTitle.trim()) return;
    
    try {
      const response = await fetch(`${AI_API_BASE_URL}/project-roles/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          project: projectId,
          role: newRoleTitle.trim()
        }),
      });

      if (response.ok) {
        setNewRoleTitle('');
        setShowAddRoleModal(false);
        fetchProjectData(); // Refresh project data
      } else {
        const errorData = await response.json();
        showError('Role Creation Failed', `Failed to add role: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add role');
    }
  };


  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    
    try {
      const response = await fetch(`${AI_API_BASE_URL}/project-goals/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          project: projectId,
          title: newGoalTitle.trim()
        }),
      });

      if (response.ok) {
        setNewGoalTitle('');
        setShowAddGoalModal(false);
        fetchProjectData(); // Refresh project data
      } else {
        const errorData = await response.json();
        showError('Goal Creation Failed', `Failed to add goal: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add goal');
    }
  };



  const validateRepositoryData = (repoData: any) => {

    if (!repoData.name || !repoData.name.trim()) {
      showWarning('Missing Information', 'Repository name is required.');
      return false;
    }

    if (!repoData.url || !repoData.url.trim()) {
      showWarning('Missing Information', 'Repository URL is required.');
      return false;
    }


    try {
      const url = new URL(repoData.url);
      

      if (!url.hostname.includes('github.com')) {
        showWarning('Invalid Repository URL', 'Please provide a valid GitHub repository URL (e.g., https://github.com/username/repository)');
        return false;
      }


      const pathParts = url.pathname.split('/').filter(part => part.length > 0);
      if (pathParts.length < 2) {
        showWarning('Invalid Repository URL', 'GitHub repository URL must include username and repository name (e.g., https://github.com/username/repository)');
        return false;
      }


      if (pathParts.length === 1 && pathParts[0] === '') {
        showWarning('Invalid Repository URL', 'Please provide a specific repository URL, not the GitHub homepage.');
        return false;
      }

    } catch (error) {
      showWarning('Invalid URL Format', 'Please provide a valid URL (e.g., https://github.com/username/repository)');
      return false;
    }


    if (repoData.branch && !/^[a-zA-Z0-9._/-]+$/.test(repoData.branch)) {
      showWarning('Invalid Branch Name', 'Branch name can only contain letters, numbers, dots, underscores, slashes, and hyphens.');
      return false;
    }

    return true;
  };

  const handleAddRepo = async (repoData: any) => {

    if (!validateRepositoryData(repoData)) {
      return false; // Return false if validation fails
    }

    try {
      const response = await fetch(`${AI_API_BASE_URL}/repositories/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          project: projectId,
          name: repoData.name.trim(),
          url: repoData.url.trim(),
          branch: repoData.branch?.trim() || 'main'
        }),
      });

      if (response.ok) {
        showSuccess('Repository Added!', 'Repository has been added successfully.');
        fetchRepositories(); // Refresh repositories
        return true; // Return true if successful
      } else {
        const errorData = await response.json();
        showError('Repository Creation Failed', `Failed to add repository: ${errorData.message || 'Unknown error'}`);
        return false; // Return false if API call failed
      }
    } catch (error) {
      handleApiError(error, 'add repository');
      return false; // Return false if error occurred
    }
  };


  const openEditMember = (member: any) => {
    setEditingMember({ ...member });
    setShowEditMemberModal(true);
  };


  const handleAddRepoLocal = async () => {
    if (!repoForm.name || !repoForm.url) {
      showWarning('Missing Information', 'Please fill out both repository name and URL fields.');
      return;
    }

    const success = await handleAddRepo({
      name: repoForm.name,
      url: repoForm.url,
      branch: repoForm.branch
    });
    

    if (success) {
      setRepoForm({ name: '', url: '', branch: 'main' });
      setShowRepoModal(false);
      setEditingRepo(null);
    }
  };

  const openEditRepo = (repo: any) => {
    setEditingRepo(repo);
    setRepoForm({ name: repo.name, url: repo.url, branch: repo.branch });
    setShowRepoModal(true);
  };




  const addEpic = async () => {
    if (newEpicTitle) {
      await addNewEpic({ title: newEpicTitle, description: newEpicDescription });
      setNewEpicTitle('');
      setNewEpicDescription('');
      setShowAddEpicModal(false);
    }
  };

  const addSubEpic = async () => {
    if (newSubEpicTitle && selectedEpicId) {
      await addNewSubEpic({ title: newSubEpicTitle }, selectedEpicId);
      setNewSubEpicTitle('');
      setSelectedEpicId(null);
      setShowAddSubEpicModal(false);
    }
  };

  const openAddSubEpicModal = (epicId: number) => {
    setSelectedEpicId(epicId);
    setShowAddSubEpicModal(true);
  };

  const addUserStory = async () => {
    if (newUserStoryTitle && selectedSubEpicId) {
      await addNewUserStory({ title: newUserStoryTitle }, selectedSubEpicId);
      setNewUserStoryTitle('');
      setSelectedSubEpicId(null);
      setShowAddUserStoryModal(false);
    }
  };

  const openAddUserStoryModal = (subEpicId: number) => {
    setSelectedSubEpicId(subEpicId);
    setShowAddUserStoryModal(true);
  };

  const addTask = async () => {
    if (newTaskTitle && selectedUserStoryId) {
      await addNewTask({ title: newTaskTitle }, selectedUserStoryId);
      setNewTaskTitle('');
      setSelectedUserStoryId(null);
      setShowAddTaskModal(false);
    }
  };

  const openAddTaskModal = (userStoryId: number) => {
    setSelectedUserStoryId(userStoryId);
    setShowAddTaskModal(true);
  };


  const addWeek = async () => {
    if (!newWeekNumber.trim()) {
      showWarning('Missing Information', 'Please enter a week number');
      return;
    }
    
    const weekNum = parseInt(newWeekNumber.trim());
    if (isNaN(weekNum) || weekNum < 1) {
      showWarning('Invalid Input', 'Please enter a valid week number (1 or higher)');
      return;
    }
    
    try {
      const response = await fetch(`${AI_API_BASE_URL}/timeline-weeks/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          project: projectId,
          week_number: weekNum
        }),
      });

      if (response.ok) {
        fetchProjectData(); // Refresh project data
        setShowAddWeekModal(false);
        setNewWeekNumber('');
      } else {
        const errorData = await response.json();
        showError('Week Creation Failed', `Failed to add week: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add week');
    }
  };

  const openAddTimelineTaskModal = (weekIndex: number) => {
    setSelectedWeekIndex(weekIndex);
    setShowAddTimelineTaskModal(true);
  };

  const addTimelineTask = async () => {
    if (!newTimelineTaskTitle.trim()) {
      showWarning('Missing Information', 'Please enter a task title');
      return;
    }
    
    if (selectedWeekIndex === null) {
      showWarning('No Week Selected', 'Please select a week to add the task to');
      return;
    }
    
    try {

      const week = projectData.timeline[selectedWeekIndex];
      if (!week || !week.id) {
        showError('Week Not Found', 'Week not found. Please refresh and try again.');
        return;
      }

      const response = await fetch(`${AI_API_BASE_URL}/timeline-items/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          week: week.id,
          title: newTimelineTaskTitle.trim()
        }),
      });

      if (response.ok) {
        fetchProjectData(); // Refresh project data
        setShowAddTimelineTaskModal(false);
        setNewTimelineTaskTitle('');
        setSelectedWeekIndex(null);
      } else {
        const errorData = await response.json();
        showError('Task Creation Failed', `Failed to add task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add timeline task');
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showWarning('Invalid File Type', 'Only PDF files are allowed.');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    } else {
      showWarning('Invalid File Type', 'Only PDF files are allowed.');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const uploadProposal = async () => {
    if (!uploadedFile || !projectId) {
      showWarning('Missing File', 'Please select a PDF file to upload');
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      showError('Authentication Required', 'Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', projectId);

      const response = await fetch(`${AI_API_BASE_URL}/proposals/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        showSuccess('Proposal Uploaded!', 'Proposal has been uploaded successfully. Click "Regenerate" to update project with new insights.');
        setUploadedFile(null);
        await fetchCurrentProposal();
      } else {
        const errorData = await response.json();
        showError('Upload Failed', `Failed to upload proposal: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'upload proposal');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className={`flex min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading project data...</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className={`flex min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  const AIBadge = ({ show, tooltipText = "AI Generated" }: { show: boolean; tooltipText?: string }) => {
    if (!show) return null;
    
    return (
      <span 
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
          theme === 'dark' 
            ? 'bg-purple-900/30 text-purple-300' 
            : 'bg-purple-100 text-purple-800'
        }`}
        title={tooltipText}
      >
        <span>✨</span>
        <span>AI</span>
      </span>
    );
  };


  const Avatar: React.FC<{ 
    member: any; 
    size?: 'sm' | 'md';
    theme: string;
  }> = ({ member, size = 'md', theme }) => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10';
    const initials = member.user_name?.substring(0, 2).toUpperCase() || member.name?.substring(0, 2).toUpperCase() || '??';
    
    return (
      <div className="relative">
        <div className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 ${theme === 'dark' ? 'border-gray-700' : 'border-white'} shadow-sm overflow-hidden ${!member.user_profile_picture ? 'bg-blue-500 text-white' : ''}`}>
          {member.user_profile_picture ? (
            <img 
              src={member.user_profile_picture} 
              alt={member.user_name || member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* AI Operation Loading Overlay */}
      {/* AI Operation Loading Modal */}
      <LoadingSpinner 
        isOpen={loadingState !== null}
        customMessages={
          loadingState === 'regenerating-overview' 
            ? [
                "Regenerating project overview...",
                "Analyzing project requirements...",
                "Updating features and roles...",
                "Refining project goals...",
                "Optimizing timeline...",
                "Almost complete..."
              ]
            : loadingState === 'regenerating-backlog'
            ? [
                "Regenerating project backlog...",
                "Creating new epics...",
                "Generating user stories...",
                "Organizing tasks...",
                "Assigning priorities...",
                "Finalizing backlog..."
              ]
            : undefined
        }
      />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto mt-20">
          {/* Header Section */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 sm:px-6 lg:px-8 py-6`}>
            <div className="w-full mx-auto">
              <button
                onClick={() => window.history.back()}
                className={`flex items-center ${theme === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors mb-4 group`}
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Projects</span>
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{projectData.title}</h1>
                  <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Manage your project details, team, and progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-8 overflow-x-auto">
                {[
                  { id: 'monitoring', icon: BarChart3, label: 'Monitoring' },
                  { id: 'overview', icon: FileText, label: 'Overview' },
                  { id: 'backlog', icon: Target, label: 'Backlog' },
                  { id: 'members', icon: Users, label: 'Team' },
                  { id: 'repository', icon: GitBranch, label: 'Git Repositories' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : `border-transparent ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:border-gray-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-green-900 to-green-800 border-green-700' : 'from-green-50 to-green-100 border-green-200'} rounded-xl shadow-sm p-6 border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-green-300' : 'text-green-600'} mb-1`}>Total Completed</p>
                        <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-green-200' : 'text-green-700'}`}>{taskStats.completed}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mt-1`}>+{taskStats.completed > 0 ? Math.floor(taskStats.completed * 0.2) : 0} from last period</p>
                      </div>
                      <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-blue-900 to-blue-800 border-blue-700' : 'from-blue-50 to-blue-100 border-blue-200'} rounded-xl shadow-sm p-6 border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} mb-1`}>In Progress</p>
                        <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>{taskStats.inProgress}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mt-1`}>Active tasks</p>
                      </div>
                      <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <RefreshCw className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`bg-gradient-to-br ${theme === 'dark' ? 'from-orange-900 to-orange-800 border-orange-700' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-xl shadow-sm p-6 border`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'} mb-1`}>Pending</p>
                        <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-orange-200' : 'text-orange-700'}`}>{taskStats.pending}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} mt-1`}>Awaiting start</p>
                      </div>
                      <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Configuration */}
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Analytics Configuration</h3>
                  <div className="flex items-center gap-6 flex-wrap">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={analyticsConfig.includeTasks} 
                        onChange={(e) => setAnalyticsConfig({...analyticsConfig, includeTasks: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Tasks</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={analyticsConfig.includeUserStories}
                        onChange={(e) => setAnalyticsConfig({...analyticsConfig, includeUserStories: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>User Stories</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={analyticsConfig.includeSubEpics}
                        onChange={(e) => setAnalyticsConfig({...analyticsConfig, includeSubEpics: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Sub-Epics</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={analyticsConfig.includeEpics}
                        onChange={(e) => setAnalyticsConfig({...analyticsConfig, includeEpics: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Epics</span>
                    </label>
                  </div>
                </div>

                {/* Chart */}
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm p-6 border`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Task Progress Over Time</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Completed</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>In Progress</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Pending</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative h-80 overflow-x-auto">
                    <svg className="w-full h-full min-w-[600px]" viewBox="0 0 800 300">
                      <defs>
                        <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f3f4f6" stopOpacity="0.5"/>
                          <stop offset="100%" stopColor="#f3f4f6" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      
                      <line x1="50" y1="20" x2="50" y2="260" stroke={theme === 'dark' ? '#4b5563' : '#d1d5db'} strokeWidth="2" />
                      <line x1="50" y1="260" x2="750" y2="260" stroke={theme === 'dark' ? '#4b5563' : '#d1d5db'} strokeWidth="2" />

                      {[0, 10, 20, 30, 40, 50].map((val, i) => (
                        <g key={i}>
                          <text x="30" y={260 - (i * 48) + 4} fontSize="12" fill={theme === 'dark' ? '#9ca3af' : '#6b7280'} textAnchor="end" fontWeight="500">
                            {val}
                          </text>
                          <line
                            x1="50"
                            y1={260 - (i * 48)}
                            x2="750"
                            y2={260 - (i * 48)}
                            stroke={theme === 'dark' ? '#374151' : '#f3f4f6'}
                            strokeWidth="1"
                          />
                        </g>
                      ))}
                      
                      {weeklyData.weeks.map((week, i) => {
                        const x = 80 + (i * 110);
                        const barWidth = 25;
                        const completed = weeklyData.completed[i];
                        const inProgress = weeklyData.inProgress[i];
                        const pending = weeklyData.pending[i];
                        const scale = 4.8;
                        
                        return (
                          <g key={i}>
                            <rect
                              x={x}
                              y={260 - (completed * scale)}
                              width={barWidth}
                              height={completed * scale}
                              fill="#10b981"
                              rx="3"
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                            <rect
                              x={x + barWidth + 5}
                              y={260 - (inProgress * scale)}
                              width={barWidth}
                              height={inProgress * scale}
                              fill="#3b82f6"
                              rx="3"
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                            <rect
                              x={x + (barWidth + 5) * 2}
                              y={260 - (pending * scale)}
                              width={barWidth}
                              height={pending * scale}
                              fill="#f97316"
                              rx="3"
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                            <text
                              x={x + 37.5}
                              y="280"
                              fontSize="12"
                              fill={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                              textAnchor="middle"
                              fontWeight="500"
                            >
                              {week}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Project Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border overflow-hidden`}>
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
                    {isEditingOverview ? (
                      <input
                        type="text"
                        value={projectData.title}
                        onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
                        className="text-2xl font-bold text-white bg-white bg-opacity-20 px-3 py-1 rounded-lg border-2 border-white focus:outline-none focus:bg-opacity-30"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-white">{projectData.title}</h2>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={regenerateOverview}
                        disabled={loadingState !== null}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Regenerate project overview using AI"
                      >
                        {loadingState === 'regenerating-overview' ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => isEditingOverview ? updateProject() : setIsEditingOverview(true)}
                        disabled={loadingState !== null}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {isEditingOverview ? 'Save Changes' : 'Edit'}
                      </button>
                      {isEditingOverview && (
                        <button
                          onClick={() => {
                            setIsEditingOverview(false);
                            setUploadedFile(null);
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center font-medium"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`p-6 space-y-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Project Status Section */}
                    {!isEditingOverview && (
                      <div className="mb-6">
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
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Last updated by {statusUpdatedBy} on {new Date(statusUpdatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {isEditingOverview && (
                      <div className="mb-6">
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          Project Status
                        </label>
                        <select
                          value={projectStatus}
                          onChange={(e) => updateProjectStatus(e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            theme === 'dark'
                              ? 'bg-gray-900 border-gray-700 text-white'
                              : 'border-gray-300'
                          }`}
                        >
                          <option value="setting_up">Setting Up</option>
                          <option value="in_progress">In Progress</option>
                          <option value="complete">Complete</option>
                          <option value="on_hold">On Hold</option>
                        </select>
                        {statusUpdatedAt && statusUpdatedBy && (
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Last updated by {statusUpdatedBy} on {new Date(statusUpdatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Proposal Upload Section */}
                    <div className="mb-6">
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center`}>
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-purple-600" />
                        </div>
                        Project Proposal
                      </h3>
                      
                      {!currentProposal && !isEditingOverview && (
                        <div className={`p-6 border-2 border-dashed rounded-lg text-center ${
                          theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'
                        }`}>
                          <FileText className={`w-12 h-12 mx-auto mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            No proposal found. Upload a PDF proposal in edit mode to enable AI analysis.
                          </p>
                        </div>
                      )}
                      
                      {currentProposal && !isEditingOverview && (
                        <div className={`p-4 rounded-lg border ${
                          theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-purple-600 mr-3" />
                              <div>
                                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  Proposal Uploaded
                                </p>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {new Date(currentProposal.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowProposalViewer(true)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View Proposal
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {isEditingOverview && (
                        <div className="space-y-4">
                          {currentProposal && (
                            <div className={`p-4 rounded-lg border ${
                              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FileText className="w-5 h-5 text-purple-600 mr-3" />
                                  <div>
                                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                      Current Proposal
                                    </p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {new Date(currentProposal.uploaded_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setShowProposalViewer(true)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  View Proposal
                                </button>
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                              {currentProposal ? 'Upload New Proposal (Replace)' : 'Upload Proposal'}
                            </label>
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                                dragActive ? 'border-blue-400 bg-blue-50' : theme === 'dark' ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                              } cursor-pointer`}
                              onClick={() => document.getElementById('proposalFileInput')?.click()}
                            >
                              <Upload size={32} className={`mx-auto mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {uploadedFile
                                  ? `Selected: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(2)} KB)`
                                  : 'Click to upload or drag and drop'}
                              </p>
                              <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>PDF files only</p>

                              <input
                                id="proposalFileInput"
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </div>

                            {uploadedFile && (
                              <div className={`mt-3 flex items-center justify-between border p-3 rounded-lg ${
                                theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                              }`}>
                                <span className={`text-sm truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                  {uploadedFile.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      uploadProposal();
                                    }}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium px-3 py-1 rounded hover:bg-green-50"
                                  >
                                    Upload
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile();
                                    }}
                                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                                  >
                                    <X size={14} /> Remove
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {currentProposal && uploadedFile && (
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              Note: Uploading a new proposal will replace the current one. Click "Regenerate" after upload to update project insights.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AI Summary */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center`}>
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        AI Summary
                      </h3>
                      {isEditingOverview ? (
                        <textarea
                          value={projectData.aiSummary}
                          onChange={(e) => setProjectData({ ...projectData, aiSummary: e.target.value })}
                          className={`w-full p-4 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow`}
                          rows={3}
                        />
                      ) : (
                        <p className={`${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'} leading-relaxed p-4 rounded-lg`}>{projectData.aiSummary}</p>
                      )}
                    </div>

                    {/* Project Roles */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'} rounded-lg flex items-center justify-center mr-3`}>
                          <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}`} />
                        </div>
                        Project Roles
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projectData.roles.map((role, idx) => (
                          <div key={role.id || idx} className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme === 'dark' ? 'from-blue-900 to-indigo-900 border-blue-800' : 'from-blue-50 to-indigo-50 border-blue-100'} rounded-lg border hover:shadow-md transition-shadow`}>
                            {isEditingOverview ? (
                              <input
                                type="text"
                                value={role.role}
                                onChange={(e) => {
                                  const newRoles = [...projectData.roles];
                                  newRoles[idx] = { ...newRoles[idx], role: e.target.value };
                                  setProjectData({ ...projectData, roles: newRoles });
                                }}
                                className={`${theme === 'dark' ? 'text-gray-200 border-blue-400' : 'text-gray-700 border-blue-300'} font-medium bg-transparent border-b focus:outline-none focus:border-blue-500 flex-1`}
                              />
                            ) : (
                              <div className="flex items-center">
                                <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{role.role}</span>
                                <AIBadge show={role.ai} />
                              </div>
                            )}
                            {isEditingOverview && (
                              <button 
                                onClick={() => handleDeleteClick('role', role.id, role.role)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={() => setShowAddRoleModal(true)} className={`p-4 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'} rounded-lg transition-all`}>
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Top Features */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'} rounded-lg flex items-center justify-center mr-3`}>
                          <Target className={`w-4 h-4 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`} />
                        </div>
                        Top Features
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projectData.features.map((feature, idx) => (
                          <div key={feature.id || idx} className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme === 'dark' ? 'from-green-900 to-emerald-900 border-green-800' : 'from-green-50 to-emerald-50 border-green-100'} rounded-lg border hover:shadow-md transition-shadow`}>
                            {isEditingOverview ? (
                              <input
                                type="text"
                                value={feature.title}
                                onChange={(e) => {
                                  const newFeatures = [...projectData.features];
                                  newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                                  setProjectData({ ...projectData, features: newFeatures });
                                }}
                                className={`${theme === 'dark' ? 'text-gray-200 border-green-400' : 'text-gray-700 border-green-300'} font-medium bg-transparent border-b focus:outline-none focus:border-green-500 flex-1`}
                              />
                            ) : (
                              <div className="flex items-center">
                                <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{feature.title}</span>
                                <AIBadge show={feature.ai} />
                              </div>
                            )}
                            {isEditingOverview && (
                              <button 
                                onClick={() => handleDeleteClick('feature', feature.id, feature.title)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={() => setShowAddFeatureModal(true)} className={`p-4 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-400 hover:bg-green-900' : 'border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 hover:bg-green-50'} rounded-lg transition-all`}>
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project Goals */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-orange-900' : 'bg-orange-100'} rounded-lg flex items-center justify-center mr-3`}>
                          <CheckCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`} />
                        </div>
                        Project Goals
                      </h3>
                      <div className="space-y-3">
                        {projectData.goals.map((goal, idx) => (
                          <div key={goal.id || idx} className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme === 'dark' ? 'from-purple-900 to-pink-900 border-purple-800' : 'from-purple-50 to-pink-50 border-purple-100'} rounded-lg border hover:shadow-md transition-shadow`}>
                            <div className="flex items-center flex-1">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {idx + 1}
                              </div>
                              {isEditingOverview ? (
                                <input
                                  type="text"
                                  value={goal.title}
                                  onChange={(e) => {
                                    const newGoals = [...projectData.goals];
                                    newGoals[idx] = { ...newGoals[idx], title: e.target.value };
                                    setProjectData({ ...projectData, goals: newGoals });
                                  }}
                                  className={`${theme === 'dark' ? 'text-gray-200 border-purple-400' : 'text-gray-700 border-purple-300'} font-medium bg-transparent border-b focus:outline-none focus:border-purple-500 flex-1`}
                                />
                              ) : (
                                <div className="flex items-center">
                                  <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{goal.title}</span>
                                  <AIBadge show={goal.ai} />
                                </div>
                              )}
                            </div>
                            {isEditingOverview && (
                              <button 
                                onClick={() => handleDeleteClick('goal', goal.id, goal.title)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={() => setShowAddGoalModal(true)} className={`w-full p-4 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-900' : 'border-gray-300 text-gray-500 hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50'} rounded-lg transition-all`}>
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project Timeline */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className={`w-8 h-8 ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'} rounded-lg flex items-center justify-center mr-3`}>
                          <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'}`} />
                        </div>
                        Project Timeline
                      </h3>
                      <div className="space-y-4">
                        {projectData.timeline?.map((week, idx) => (
                          <div key={idx} className={`border ${theme === 'dark' ? 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'} rounded-xl p-5 hover:shadow-md transition-shadow`}>
                            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center justify-between`}>
                              <div className="flex items-center">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                {idx + 1}
                              </div>
                              {week.week}
                              </div>
                              {isEditingOverview && (
                                <button
                                  onClick={() => handleDeleteClick('timeline-week', week.id, week.week)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Delete week"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </h4>
                            <div className="space-y-2 ml-8">
                              {week.items?.map((task, taskIdx) => (
                                <div key={task.id || taskIdx} className={`flex items-center justify-between p-3 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:border-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'} rounded-lg border transition-colors`}>
                                  {isEditingOverview ? (
                                    <input
                                      type="text"
                                      value={task.title}
                                      onChange={(e) => {
                                        const updatedTimeline = (projectData.timeline || []).map((w, wIdx) => {
                                          if (wIdx === idx) {
                                            const newItems = [...(w.items || [])];
                                            newItems[taskIdx] = { ...newItems[taskIdx], title: e.target.value };
                                            return { ...w, items: newItems };
                                          }
                                          return w;
                                        });
                                        setProjectData({ ...projectData, timeline: updatedTimeline });
                                      }}
                                      className={`${theme === 'dark' ? 'text-gray-200 border-blue-400' : 'text-gray-700 border-blue-300'} bg-transparent border-b focus:outline-none focus:border-blue-500 flex-1`}
                                    />
                                  ) : (
                                    <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{task.title}</span>
                                  )}
                                  {isEditingOverview && (
                                    <button 
                                      onClick={() => handleDeleteClick('timeline', task.id, task.title)}
                                      className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {isEditingOverview && (
                                <button onClick={() => openAddTimelineTaskModal(idx)} className={`w-full p-3 border border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'} rounded-lg text-sm transition-all`}>
                                  + Add Task
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={() => setShowAddWeekModal(true)} className={`w-full p-5 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'} rounded-xl transition-all`}>
                            <Plus className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm font-medium">Add Week</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Backlog Tab */}
            {activeTab === 'backlog' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Generated Backlog</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage epics, user stories, and tasks</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={regenerateBacklog}
                      disabled={loadingState !== null}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Regenerate backlog using AI"
                    >
                      {loadingState === 'regenerating-backlog' ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </>
                      )}
                    </button>
                    {!isEditingBacklog ? (
                  <button
                        onClick={() => {
                          setModifiedItems(new Set());
                          setIsEditingBacklog(true);
                        }}
                        disabled={loadingState !== null}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setModifiedItems(new Set());
                            setIsEditingBacklog(false);
                          }}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveBacklogChanges}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                    {isEditingBacklog && (
                      <button
                        onClick={() => setShowAddEpicModal(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Epic
                  </button>
                    )}
                  </div>
                </div>

                {(backlog.epics || []).map((epic) => (
                  <div key={epic.id} className={`rounded-xl shadow-sm border overflow-hidden ${
                    theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    <div className={`px-6 py-4 border-b ${
                      theme === "dark" 
                        ? "bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-800/30" 
                        : "bg-gradient-to-r from-red-50 to-pink-50 border-red-100"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="px-4 py-1.5 bg-red-500 text-white rounded-full text-sm font-semibold mr-4 shadow-sm">
                            Epic
                          </span>
                          {(epic as any).is_complete && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                              theme === "dark" ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
                            }`}>
                              ✅ Complete
                            </span>
                          )}
                          {isEditingBacklog ? (
                          <input
                            type="text"
                              value={epic.title}
                            className={`text-xl font-bold bg-transparent border-b-2 border-transparent focus:outline-none transition-colors flex-1 ${
                              theme === "dark" 
                                ? "text-white hover:border-red-400 focus:border-red-400" 
                                : "text-gray-900 hover:border-red-300 focus:border-red-500"
                            }`}
                            onChange={(e) => {
                                const updatedEpics = backlog.epics.map(ep => 
                                  ep.id === epic.id ? { ...ep, title: e.target.value } : ep
                              );
                              setBacklog({ ...backlog, epics: updatedEpics });

                              setModifiedItems(prev => new Set(prev).add(`epic-${epic.id}`));
                            }}
                          />
                          ) : (
                            <div className="flex items-center">
                              <span className={`text-xl font-bold ${
                                theme === "dark" ? "text-white" : "text-gray-900"
                              }`}>{epic.title}</span>
                              <AIBadge show={epic.ai} />
                            </div>
                          )}
                        </div>
                        {isEditingBacklog && (
                        <button 
                            onClick={() => handleDeleteClick('epic', epic.id, epic.title)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === "dark" 
                              ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                              : "text-red-500 hover:text-red-700 hover:bg-red-100"
                          }`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Sub-Epics */}
                      <div className="space-y-6">
                        {(epic.subEpics || []).map((subEpic) => (
                          <div key={subEpic.id} className={`border-l-4 pl-6 py-2 ${
                            theme === "dark" ? "border-orange-500" : "border-orange-400"
                          }`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center flex-1">
                                <span className="px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold mr-3 shadow-sm">
                                  Sub-Epic
                                </span>
                                {(subEpic as any).is_complete && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                    theme === "dark" ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
                                  }`}>
                                    ✅ Complete
                                  </span>
                                )}
                                {isEditingBacklog ? (
                                <input
                                  type="text"
                                    value={subEpic.title}
                                  onChange={(e) => {
                                    const updatedEpics = backlog.epics.map(ep => {
                                      if (ep.id === epic.id) {
                                        return {
                                          ...ep,
                                          subEpics: ep.subEpics.map(se =>
                                              se.id === subEpic.id ? { ...se, title: e.target.value } : se
                                          )
                                        };
                                      }
                                      return ep;
                                    });
                                    setBacklog({ ...backlog, epics: updatedEpics });

                                    setModifiedItems(prev => new Set(prev).add(`subepic-${subEpic.id}`));
                                  }}
                                  className={`text-lg font-semibold bg-transparent border-b-2 border-transparent focus:outline-none transition-colors flex-1 ${
                                    theme === "dark" 
                                      ? "text-white hover:border-orange-400 focus:border-orange-400" 
                                      : "text-gray-900 hover:border-orange-300 focus:border-orange-500"
                                  }`}
                                />
                                ) : (
                                  <div className="flex items-center">
                                    <span className={`text-lg font-semibold ${
                                      theme === "dark" ? "text-white" : "text-gray-900"
                                    }`}>{subEpic.title}</span>
                                    <AIBadge show={subEpic.ai} />
                                  </div>
                                )}
                              </div>
                              {isEditingBacklog && (
                              <button 
                                  onClick={() => handleDeleteClick('sub-epic', subEpic.id, subEpic.title)}
                                className={`p-2 rounded-lg transition-colors ${
                                  theme === "dark" 
                                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                                    : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              )}
                            </div>

                            {/* User Stories */}
                            <div className="space-y-4 ml-6">
                              {(subEpic.userStories || []).map((story) => (
                                <div key={story.id} className={`border-l-4 pl-6 py-2 ${
                                  theme === "dark" ? "border-blue-500" : "border-blue-400"
                                }`}>
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center flex-1">
                                      <span className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-semibold mr-3 shadow-sm">
                                        User Story
                                      </span>
                                      {(story as any).is_complete && (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                                          theme === "dark" ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
                                        }`}>
                                          ✅ Complete
                                        </span>
                                      )}
                                      {isEditingBacklog ? (
                                      <input
                                        type="text"
                                          value={story.title}
                                        onChange={(e) => {
                                          const updatedEpics = backlog.epics.map(ep => {
                                            if (ep.id === epic.id) {
                                              return {
                                                ...ep,
                                                subEpics: ep.subEpics.map(se => {
                                                  if (se.id === subEpic.id) {
                                                    return {
                                                      ...se,
                                                      userStories: se.userStories.map(us =>
                                                          us.id === story.id ? { ...us, title: e.target.value } : us
                                                      )
                                                    };
                                                  }
                                                  return se;
                                                })
                                              };
                                            }
                                            return ep;
                                          });
                                          setBacklog({ ...backlog, epics: updatedEpics });

                                          setModifiedItems(prev => new Set(prev).add(`story-${story.id}`));
                                        }}
                                        className={`flex-1 bg-transparent border-b-2 border-transparent focus:outline-none transition-colors ${
                                          theme === "dark" 
                                            ? "text-white hover:border-blue-400 focus:border-blue-400" 
                                            : "text-gray-900 hover:border-blue-300 focus:border-blue-500"
                                        }`}
                                      />
                                      ) : (
                                        <div className="flex items-center flex-1">
                                          <span className={`flex-1 ${
                                            theme === "dark" ? "text-white" : "text-gray-900"
                                          }`}>{story.title}</span>
                                          <AIBadge show={story.ai} />
                                        </div>
                                      )}
                                    </div>
                                    {isEditingBacklog && (
                                    <button 
                                        onClick={() => handleDeleteClick('user-story', story.id, story.title)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        theme === "dark" 
                                          ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                                          : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                      }`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    )}
                                  </div>

                                  {/* Tasks */}
                                  <div className="space-y-2 ml-6">
                                    {(story.tasks || []).map((task) => (
                                      <div key={task.id} className={`p-3 rounded-lg border hover:shadow-md transition-shadow ${
                                        theme === "dark" 
                                          ? "bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-800/30" 
                                          : "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                                      }`}>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center flex-1">
                                            <span className="px-2.5 py-1 bg-green-600 text-white rounded-md text-xs font-semibold mr-3 shadow-sm">
                                              Task
                                            </span>
                                            {isEditingBacklog ? (
                                            <input
                                              type="text"
                                                value={task.title}
                                              onChange={(e) => {
                                                const updatedEpics = backlog.epics.map(ep => {
                                                  if (ep.id === epic.id) {
                                                    return {
                                                      ...ep,
                                                      subEpics: ep.subEpics.map(se => {
                                                        if (se.id === subEpic.id) {
                                                          return {
                                                            ...se,
                                                            userStories: se.userStories.map(us => {
                                                              if (us.id === story.id) {
                                                                  return {
                                                                    ...us,
                                                                    tasks: us.tasks.map(t =>
                                                                      t.id === task.id ? { ...t, title: e.target.value } : t
                                                                    )
                                                                  };
                                                              }
                                                              return us;
                                                            })
                                                          };
                                                        }
                                                        return se;
                                                      })
                                                    };
                                                  }
                                                  return ep;
                                                });
                                                setBacklog({ ...backlog, epics: updatedEpics });

                                                setModifiedItems(prev => new Set(prev).add(`task-${task.id}`));
                                              }}
                                              className={`bg-transparent border-b-2 border-transparent focus:outline-none flex-1 transition-colors ${
                                                theme === "dark" 
                                                  ? "text-gray-300 hover:border-green-400 focus:border-green-400" 
                                                  : "text-gray-700 hover:border-green-300 focus:border-green-500"
                                              }`}
                                            />
                                            ) : (
                                              <div className="flex items-center flex-1">
                                                <span className={`flex-1 ${
                                                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                                                }`}>{task.title}</span>
                                                <AIBadge show={task.ai} />
                                              </div>
                                            )}
                                          </div>
                                          {isEditingBacklog && (
                                          <button 
                                              onClick={() => handleDeleteClick('task', task.id, task.title)}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                              theme === "dark" 
                                                ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" 
                                                : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                            }`}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                          )}
                                        </div>
                                        
                                        {/* Task Details Row */}
                                        <div className="flex items-center justify-between text-sm">
                                          <div className="flex items-center gap-4">
                                            {/* Status Badge */}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              task.status === 'done' 
                                                ? theme === "dark" 
                                                  ? 'bg-green-900/30 text-green-300' 
                                                  : 'bg-green-100 text-green-800'
                                                : theme === "dark"
                                                  ? 'bg-yellow-900/30 text-yellow-300'
                                                  : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {task.status === 'done' ? '✅ Done' : '⏳ Pending'}
                                            </span>
                              {/* Due Date Badge / Editor */}
                              {!isEditingBacklog ? (
                                <>
                                  {(() => {
                                    console.log('🔍 Due date check for task', task.id, ':', {
                                      hasDueDateProperty: 'due_date' in task,
                                      dueDateValue: task.due_date,
                                      dueDateType: typeof task.due_date,
                                      willShow: ('due_date' in task) && task.due_date
                                    });
                                    return ('due_date' in task) && task.due_date;
                                  })() && (
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                                      (() => {
                                        const today = new Date().toISOString().slice(0,10);
                                        const dueDate = task.due_date;
                                        if (dueDate < today) return 'bg-red-100 text-red-800 border border-red-200';
                                        if (dueDate === today) return 'bg-orange-100 text-orange-800 border border-orange-200';
                                        return 'bg-blue-100 text-blue-800 border border-blue-200';
                                      })()
                                    }`}>
                                      <CalendarIcon className="w-3.5 h-3.5" />
                                      {(() => {
                                        const today = new Date().toISOString().slice(0,10);
                                        if (task.due_date === today) return 'Due on: Today';
                                        if (task.due_date < today) return `Overdue: ${task.due_date}`;
                                        return `Due on: ${task.due_date}`;
                                      })()}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="relative">
                                    <input
                                      type="date"
                                      value={(task as any).due_date || ''}
                                      onChange={(e) => {
                                        console.log('📅 Date picker changed for task', task.id, 'from', (task as any).due_date, 'to', e.target.value);
                                        updateTaskDueDate(task.id, e.target.value || null);
                                      }}
                                      onFocus={() => {
                                        console.log('📅 Date picker focused for task', task.id, 'current value:', (task as any).due_date);
                                      }}
                                      className={`px-4 py-3 border rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                                        theme === "dark" 
                                          ? 'border-gray-600 bg-gray-800 text-gray-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-750' 
                                          : 'border-gray-300 bg-white text-gray-900 hover:border-blue-400 hover:shadow-md hover:shadow-blue-100 focus:ring-blue-400 focus:border-blue-500 focus:bg-blue-50/30'
                                      }`}
                                      placeholder="Set due date"
                                    />
                                  </div>
                                  {(task as any).due_date && (
                                    <button
                                      onClick={() => updateTaskDueDate(task.id, null)}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        theme === "dark"
                                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/20'
                                          : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:shadow-md hover:border-red-300'
                                      }`}
                                      title="Clear due date"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                              )}
                                            
                                            {/* Assignee */}
                                            <div className="flex items-center gap-2">
                                              <span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>Assigned to:</span>
                                              {isEditingBacklog ? (
                                                <select
                                                  value={task.assignee || ''}
                                                  onChange={(e) => {
                                                    const assigneeId = e.target.value ? parseInt(e.target.value) : null;
                                                    assignTask(task.id, assigneeId);
                                                  }}
                                                  className={`px-4 py-3 border rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 min-w-[160px] ${
                                                    theme === "dark" 
                                                      ? "border-gray-600 bg-gray-800 text-gray-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-750" 
                                                      : "border-gray-300 bg-white text-gray-900 hover:border-blue-400 hover:shadow-md hover:shadow-blue-100 focus:ring-blue-400 focus:border-blue-500 focus:bg-blue-50/30"
                                                  }`}
                                                >
                                                  <option value="">Unassigned</option>
                                                  {members.map((member) => (
                                                    <option key={member.id} value={member.id}>
                                                      {member.name} ({member.email})
                                                    </option>
                                                  ))}
                                                </select>
                                              ) : (
                                                <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                                                  {(task as any).assignee_details ? 
                                                    `${(task as any).assignee_details.user_name} (${(task as any).assignee_details.user_email})` : 
                                                    'Unassigned'
                                                  }
                                                </span>
                                              )}
                                            </div>
                                            
                                            {/* Completion Action */}
                                            {task.status !== 'done' && (
                                              <button
                                                onClick={() => openTaskCompletionModal(task.id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                                              >
                                                Mark as Done
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Commit Information (if task is done) */}
                                        {task.status === 'done' && ((task as any).commit_title || (task as any).commit_branch) && (
                                          <div className="mt-2 p-2 bg-gray-50 rounded border-l-4 border-green-400">
                                            <div className="text-xs text-gray-600">
                                              <strong>Commit:</strong> {(task as any).commit_title}
                                              {(task as any).commit_branch && (
                                                <span className="ml-2">
                                                  <strong>Branch:</strong> {(task as any).commit_branch}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {isEditingBacklog && (
                                      <button onClick={() => openAddTaskModal(story.id)} className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-500 hover:bg-green-50 text-sm font-medium transition-all">
                                      + Add Task
                                    </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {isEditingBacklog && (
                                <button onClick={() => openAddUserStoryModal(subEpic.id)} className="px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 text-sm font-medium transition-all">
                                + Add User Story
                              </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {isEditingBacklog && (
                          <button onClick={() => openAddSubEpicModal(epic.id)} className="px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium transition-all">
                          + Add Sub-Epic
                        </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
                    <p className="text-sm text-gray-500 mt-1">{members.length} member{members.length !== 1 ? 's' : ''} in total</p>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Invite Member
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Member
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                              <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 mr-3 shadow-md flex items-center justify-center">
  {member.image ? (
    <img
      src={member.image}
      alt={member.name}
      className="w-full h-full object-cover"
    />
  ) : (
    <span className="text-gray-600 font-bold text-base">
      {member.name.charAt(0).toUpperCase()}
    </span>
  )}
</div>
                                <div className="text-sm font-semibold text-gray-900">{member.name}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{member.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                                {member.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button 
                                  onClick={() => openEditMember(member)}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {(() => {
                                  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                                  const currentUserId = currentUser.id || currentUser.user_id || currentUser.pk;
                                  const isOwner = projectData.created_by === currentUserId;
                                  const isSelf = member.email === currentUser.email;
                                  const isMemberOwner = member.role === 'Owner';
                                  



                                  if ((isOwner && isSelf) || isMemberOwner) {
                                    return null;
                                  }
                                  
                                  return (
                                    <button
                                      onClick={() => handleDeleteClick('member', member.id, member.name)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pending Invitations Section */}
                {pendingInvitations.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-6 py-4 border-b border-orange-100">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-orange-600" />
                        Pending Invitations ({pendingInvitations.length})
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">Invitations waiting for response</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-orange-50 to-yellow-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Invitee
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Invited By
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Sent Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingInvitations.map((invitation) => (
                            <tr key={invitation.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                                    <span className="text-orange-600 font-bold text-sm">
                                      {invitation.invitee_name?.charAt(0).toUpperCase() || '?'}
                                    </span>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {invitation.invitee_name || 'Unknown User'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{invitation.invitee_email || 'N/A'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{invitation.invited_by_name || 'Unknown'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {new Date(invitation.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800">
                                  Pending
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => cancelInvitation(invitation.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                  title="Cancel invitation"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Task Distribution Section */}
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border overflow-hidden`}>
                  <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Task Distribution
                    </h3>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Task completion progress by team member
                    </p>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {members.map((member) => {
                      const memberTasks = backlog.epics.flatMap(epic =>
                        epic.subEpics.flatMap(subEpic =>
                          subEpic.userStories.flatMap(story =>
                            story.tasks.filter(task => 
                              task.assignee_details?.user_email === member.email ||
                              (task.assignee && members.find(m => m.id === task.assignee)?.email === member.email)
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
                                  {member.name}
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

            {/* Git Repositories Tab */}
            {activeTab === 'repository' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Git Repositories</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage project repositories and assignments</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingRepo(null);
                      setRepoForm({ name: '', url: '', branch: 'main' });
                      setShowRepoModal(true);
                    }}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Repository
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {repositories.map((repo) => (
                    <div key={repo.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                            <GitBranch className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
                            <p className="text-xs text-gray-500">Branch: {repo.branch}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditRepo(repo)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick('repository', repo.id, repo.name)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium mr-2">URL:</span>
                          <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {repo.url}
                          </a>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>

                {repositories.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No repositories yet</h3>
                    <p className="text-gray-500 mb-6">Add your first repository to get started</p>
                    <button
                      onClick={() => {
                        setEditingRepo(null);
                        setRepoForm({ name: '', url: '', branch: 'main' });
                        setShowRepoModal(true);
                      }}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Repository
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Select a role</option>
                  {projectRoles.length > 0 ? (
                    projectRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Scrum Master">Scrum Master</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-md transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Edit Team Member</h3>
                <button
                  onClick={() => {
                    setShowEditMemberModal(false);
                    setEditingMember(null);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Image Upload Section */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <img
                    src={
                      editingMember.imagePreview ||
                      editingMember.image ||
                      "https://via.placeholder.com/100x100.png?text=No+Image"
                    }
                    alt="Member"
                    className="w-24 h-24 rounded-full object-cover border-4 border-green-500 shadow-md"
                  />
                  <label className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full cursor-pointer hover:bg-green-700 transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingMember({
                              ...editingMember,
                              imagePreview: reader.result,
                              imageFile: file,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Camera className="w-4 h-4 text-white" />
                  </label>
                </div>
                <p className="text-sm text-gray-500">Click the camera to update image</p>
              </div>

              {/* Member Info Display (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Member Information</div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{editingMember.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{editingMember.email}</span>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={editingMember.role}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, role: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Select a role</option>
                  {projectRoles.length > 0 ? (
                    projectRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="QA Engineer">QA Engineer</option>
                      <option value="DevOps Engineer">DevOps Engineer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="Scrum Master">Scrum Master</option>
                    </>
                  )}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowEditMemberModal(false);
                    setEditingMember(null);
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditMember(editingMember)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium shadow-md transition-all flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Repository Modal */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-5 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {editingRepo ? 'Edit Repository' : 'Add Repository'}
                </h3>
                <button
                  onClick={() => {
                    setShowRepoModal(false);
                    setEditingRepo(null);
                    setRepoForm({ name: '', url: '', branch: 'main' });
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoForm.name}
                  onChange={(e) => setRepoForm({ ...repoForm, name: e.target.value })}
                  placeholder="e.g., frontend-app"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Repository URL
                </label>
                <input
                  type="url"
                  value={repoForm.url}
                  onChange={(e) => setRepoForm({ ...repoForm, url: e.target.value })}
                  placeholder="https://github.com/username/repository-name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be a valid GitHub repository URL (e.g., https://github.com/microsoft/vscode)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  value={repoForm.branch}
                  onChange={(e) => setRepoForm({ ...repoForm, branch: e.target.value })}
                  placeholder="main"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                />
              </div>

              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowRepoModal(false);
                    setEditingRepo(null);
                    setRepoForm({ name: '', url: '', branch: 'main' });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRepoLocal}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium shadow-md transition-all flex items-center justify-center"
                >
                  {editingRepo ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Repository
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Feature Modal */}
      {showAddFeatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md mx-4`}>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Add New Feature</h3>
            <input
              type="text"
              value={newFeatureTitle}
              onChange={(e) => setNewFeatureTitle(e.target.value)}
              placeholder="Enter feature title..."
              className={`w-full px-3 py-2 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mb-4`}
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setNewFeatureTitle('');
                  setShowAddFeatureModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addFeature}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Role</h3>
            <input
              type="text"
              value={newRoleTitle}
              onChange={(e) => setNewRoleTitle(e.target.value)}
              placeholder="Enter role title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setNewRoleTitle('');
                  setShowAddRoleModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Goal</h3>
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder="Enter goal title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setNewGoalTitle('');
                  setShowAddGoalModal(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addGoal}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{deleteItem.name}"? 
              {deleteItem.type === 'epic' && ' This will also delete all sub-epics, user stories, and tasks within this epic.'}
              {deleteItem.type === 'sub-epic' && ' This will also delete all user stories and tasks within this sub-epic.'}
              {deleteItem.type === 'user-story' && ' This will also delete all tasks within this user story.'}
              {!['epic', 'sub-epic', 'user-story'].includes(deleteItem.type) && ' This action cannot be undone.'}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteItem(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Week Modal */}
      {showAddWeekModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Week</h3>
            <input
              type="number"
              value={newWeekNumber}
              onChange={(e) => setNewWeekNumber(e.target.value)}
              placeholder="Enter week number (e.g., 1, 2, 3...)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              min="1"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddWeekModal(false);
                  setNewWeekNumber('');
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addWeek}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Week
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Timeline Task Modal */}
      {showAddTimelineTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adding task to: {selectedWeekIndex !== null ? projectData.timeline[selectedWeekIndex]?.week : 'Unknown Week'}
            </p>
            <input
              type="text"
              value={newTimelineTaskTitle}
              onChange={(e) => setNewTimelineTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddTimelineTaskModal(false);
                  setNewTimelineTaskTitle('');
                  setSelectedWeekIndex(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTimelineTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Epic Modal */}
      {showAddEpicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Epic</h3>
            <input
              type="text"
              value={newEpicTitle}
              onChange={(e) => setNewEpicTitle(e.target.value)}
              placeholder="Enter epic title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <textarea
              value={newEpicDescription}
              onChange={(e) => setNewEpicDescription(e.target.value)}
              placeholder="Enter epic description (optional)"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddEpicModal(false);
                  setNewEpicTitle('');
                  setNewEpicDescription('');
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEpic}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Epic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SubEpic Modal */}
      {showAddSubEpicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Sub-Epic</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adding sub-epic to: {selectedEpicId ? backlog.epics.find(e => e.id === selectedEpicId)?.title : 'Unknown Epic'}
            </p>
            <input
              type="text"
              value={newSubEpicTitle}
              onChange={(e) => setNewSubEpicTitle(e.target.value)}
              placeholder="Enter sub-epic title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddSubEpicModal(false);
                  setNewSubEpicTitle('');
                  setSelectedEpicId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addSubEpic}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Sub-Epic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add UserStory Modal */}
      {showAddUserStoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User Story</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adding user story to: {selectedSubEpicId ? backlog.epics.flatMap(e => e.subEpics).find(se => se.id === selectedSubEpicId)?.title : 'Unknown Sub-Epic'}
            </p>
            <textarea
              value={newUserStoryTitle}
              onChange={(e) => setNewUserStoryTitle(e.target.value)}
              placeholder="Enter user story (e.g., As a user, I want to...)"
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddUserStoryModal(false);
                  setNewUserStoryTitle('');
                  setSelectedSubEpicId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addUserStory}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add User Story
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Task</h3>
            <p className="text-sm text-gray-600 mb-4">
              Adding task to: {selectedUserStoryId ? backlog.epics.flatMap(e => e.subEpics).flatMap(se => se.userStories).find(us => us.id === selectedUserStoryId)?.title : 'Unknown User Story'}
            </p>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddTaskModal(false);
                  setNewTaskTitle('');
                  setSelectedUserStoryId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Modal */}
      {showTaskCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Task</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide commit information to mark this task as done.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commit Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCommitTitle}
                  onChange={(e) => setEditingCommitTitle(e.target.value)}
                  placeholder="e.g., Fix login bug, Add user authentication"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name (Optional)
                </label>
                <input
                  type="text"
                  value={editingCommitBranch}
                  onChange={(e) => setEditingCommitBranch(e.target.value)}
                  placeholder="e.g., feature/login-fix, bugfix/auth"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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

      {/* Regeneration Success Modal */}
      <RegenerationSuccessModal
        isOpen={showRegenerationModal}
        onClose={() => setShowRegenerationModal(false)}
        title={regenerationType === 'overview' ? 'Project Overview Regenerated!' : 'Backlog Regenerated!'}
        message={regenerationType === 'overview' 
          ? 'Your project overview has been successfully regenerated with fresh AI insights. All features, roles, goals, and timeline have been updated.'
          : 'Your project backlog has been successfully regenerated with fresh AI insights. All epics, sub-epics, user stories, and tasks have been updated.'
        }
        type={regenerationType}
      />

      {/* Proposal Viewer Modal */}
      {showProposalViewer && currentProposal && (
        <ProposalViewer
          isOpen={showProposalViewer}
          onClose={() => setShowProposalViewer(false)}
          proposalData={currentProposal}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmModalData && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${
          theme === 'dark' ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'
        }`}>
          <div className={`rounded-xl p-6 w-full max-w-md mx-4 shadow-xl ${
            theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {confirmModalData.title}
            </h3>
            <p className={`mb-6 whitespace-pre-line ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {confirmModalData.message}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelConfirm}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-600 text-white hover:bg-gray-700 border border-gray-600' 
                    : 'bg-gray-500 text-white hover:bg-gray-600 border border-gray-400'
                }`}
              >
                {confirmModalData.cancelText || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600'
                }`}
              >
                {confirmModalData.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
