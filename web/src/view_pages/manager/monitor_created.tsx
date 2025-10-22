import { useState, useEffect } from 'react';
import { Plus, Edit, Edit2, Trash2, Send, X, BarChart3, Users, FileText, Target, CheckCircle, Clock, RefreshCw, ArrowLeft, GitBranch, Save, Camera } from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";
import Sidebar from "../../components/sidebarLayout";
import { useTheme } from "../../components/themeContext";
import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectDetailsUI() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('monitoring');
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modal states
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{type: string, id: any, name: string} | null>(null);
  
  // Modal input states
  const [newFeatureTitle, setNewFeatureTitle] = useState('');
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [showAddTimelineTaskModal, setShowAddTimelineTaskModal] = useState(false);
  const [newWeekNumber, setNewWeekNumber] = useState('');
  const [newTimelineTaskTitle, setNewTimelineTaskTitle] = useState('');
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number | null>(null);
  
  // Backlog modal states
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
  
  // Backlog editing state
  const [isEditingBacklog, setIsEditingBacklog] = useState(false);
  
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  
  // API Configuration
  const API_BASE_URL = 'http://localhost:8000/api/ai';

  // API Utility Functions
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log('🔍 Token from localStorage:', token ? 'Found' : 'Not found');
    return {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const handleApiError = (error: any, operation: string) => {
    console.error(`Error ${operation}:`, error);
    if (error.status === 401) {
      alert('Authentication failed. Please log in again.');
      localStorage.removeItem('token');
      navigate('/sign-in');
    } else {
      alert(`Failed to ${operation}. Please try again.`);
    }
  };

  // Regenerate functions
  const regenerateOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/generate-overview/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Overview regenerated:', data);
      
      // Refresh all data
      await fetchProjectData();
      alert('Project overview regenerated successfully!');
    } catch (error) {
      console.error('❌ Error regenerating overview:', error);
      handleApiError(error, 'regenerate overview');
    } finally {
      setLoading(false);
    }
  };

  const regenerateBacklog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/generate-backlog/`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backlog regenerated:', data);
      
      // Refresh backlog data
      await fetchBacklog();
      alert('Backlog regenerated successfully!');
    } catch (error) {
      console.error('❌ Error regenerating backlog:', error);
      handleApiError(error, 'regenerate backlog');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Project Overview Data
  const fetchProjectData = async () => {
    try {
      console.log('🔍 Fetching project data for projectId:', projectId);
      
      // First, fetch the main project data
      const projectRes = await fetch(`${API_BASE_URL}/projects/${projectId}/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!projectRes.ok) {
        console.error('❌ Project fetch failed:', projectRes.status);
        throw new Error(`HTTP error! status: ${projectRes.status}`);
      }

      const project = await projectRes.json();
      console.log('✅ Project data fetched:', project);

      // Then fetch related data in parallel, but handle each one individually
      const [featuresRes, rolesRes, goalsRes, timelineRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/project-features/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/project-roles/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/project-goals/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
        fetch(`${API_BASE_URL}/timeline-weeks/?project_id=${projectId}`, {
          headers: getAuthHeaders(),
          credentials: 'include',
        }),
      ]);

      // Process each response, handling failures gracefully
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
        roles: (roles || []).map((role: any) => ({ id: role.id, role: role.role })),
        features: (features || []).map((feature: any) => ({ id: feature.id, title: feature.title })),
        goals: (goals || []).map((goal: any) => ({ id: goal.id, title: goal.title })),
        timeline: processedTimeline
      });
    } catch (error) {
      console.error('❌ Error in fetchProjectData:', error);
      handleApiError(error, 'fetch project data');
    }
  };

  // Fetch Backlog Data
  const fetchBacklog = async () => {
    try {
      console.log('🔍 Fetching backlog for projectId:', projectId);
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/backlog/`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Backlog fetch failed:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Backlog data fetched:', data);
      
      // Transform nested structure to match frontend state
      const transformedBacklog = {
        epics: (data.epics || []).map((epic: any) => ({
          id: epic.id,
          title: epic.title,
          description: epic.description,
          ai: epic.ai,
          subEpics: (epic.sub_epics || []).map((subEpic: any) => ({
            id: subEpic.id,
            title: subEpic.title,
            ai: subEpic.ai,
            userStories: (subEpic.user_stories || []).map((story: any) => ({
              id: story.id,
              title: story.title,
              ai: story.ai,
              tasks: (story.tasks || []).map((task: any) => ({
                id: task.id,
                title: task.title,
                status: task.status,
                ai: task.ai,
                assignee: task.assignee
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

  // Fetch Members Data
  const fetchMembers = async () => {
    try {
      console.log('🔍 Fetching members for projectId:', projectId);
      const response = await fetch(`${API_BASE_URL}/project-members/?project_id=${projectId}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('❌ Members fetch failed:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Members data fetched:', data);
      
      // Map to frontend format
      const transformedMembers = data.map((member: any) => ({
        id: member.id,
        name: member.user_name,
        email: member.user_email,
        position: member.role,
        avatar: `bg-${['blue', 'green', 'purple', 'red', 'yellow'][member.id % 5]}-400`,
        image: `bg-${['blue', 'green', 'purple', 'red', 'yellow'][member.id % 5]}-400`
      }));

      setMembers(transformedMembers);
    } catch (error) {
      handleApiError(error, 'fetch members');
    }
  };

  // Fetch Repositories Data
  const fetchRepositories = async () => {
    try {
      console.log('🔍 Fetching repositories for projectId:', projectId);
      const response = await fetch(`${API_BASE_URL}/repositories/?project_id=${projectId}`, {
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
      // Don't show error for repositories as it's optional
      setRepositories([]);
    }
  };

  // Load all data on component mount
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
            fetchRepositories()
          ]);
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
  
  const [projectData, setProjectData] = useState({
    id: 1, // Assuming project ID is available here
    title: 'Finder 4 — Lost & Found Tracker',
    aiSummary: 'A comprehensive mobile application project focused on creating an intuitive user experience with modern design principles and seamless functionality.',
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
    { id: 1, name: 'Randal Phuta', email: 'randal@example.com', position: 'Project Manager', image: 'bg-blue-400' },
    { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', position: 'Frontend Developer', image: 'bg-green-400' }
  ]);

  const [repositories, setRepositories] = useState([
    { id: 1, name: 'frontend-repo', url: 'https://github.com/company/frontend-repo', branch: 'main', assignedTo: 'Sarah Chen' },
    { id: 2, name: 'backend-api', url: 'https://github.com/company/backend-api', branch: 'develop', assignedTo: 'Randal Phuta' }
  ]);

  const [inviteForm, setInviteForm] = useState({ email: '', position: '' });
  const [repoForm, setRepoForm] = useState({ name: '', url: '', branch: 'main', assignedTo: '' });
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState(null);

  const [monitoringData] = useState({
    weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    completed: [12, 18, 25, 32, 38, 45],
    inProgress: [5, 8, 6, 9, 7, 10],
    pending: [8, 6, 4, 3, 5, 2]
  });

  const handleInvite = async () => {
    if (inviteForm.email && inviteForm.position) {
      try {
        const response = await fetch(`${API_BASE_URL}/invitations/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({
            project: projectId,
            invitee_email: inviteForm.email,
            message: `You have been invited to join the project "${projectData.title}" as ${inviteForm.position}.`,
          }),
        });
  
        if (response.ok) {
          alert('Invitation sent successfully!');
          setInviteForm({ email: '', position: '' });
          setShowInviteModal(false);
          // Refresh members list to show any new members
          fetchMembers();
        } else {
          const errorData = await response.json();
          alert(`Failed to send invitation: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        handleApiError(error, 'send invitation');
      }
    } else {
      alert('Please fill out both email and position fields.');
    }
  };

  const handleEditMember = (updatedMember: any) => {
    setMembers((prevMembers) =>
      prevMembers.map((m) =>
        m.id === updatedMember.id
          ? {
              ...updatedMember,
              image:
                updatedMember.imagePreview || updatedMember.image || m.image,
            }
          : m
      )
    );
  
    setShowEditMemberModal(false);
    setEditingMember(null);
  };

  // Backlog CRUD Operations
  const addNewEpic = async (epicData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/`, {
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
        alert(`Failed to create epic: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create epic');
    }
  };


  const addNewSubEpic = async (subEpicData: any, epicId: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sub-epics/`, {
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
        alert(`Failed to create sub-epic: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create sub-epic');
    }
  };


  const addNewUserStory = async (storyData: any, subEpicId: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-stories/`, {
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
        alert(`Failed to create user story: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create user story');
    }
  };


  const addNewTask = async (taskData: any, userStoryId: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/story-tasks/`, {
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
        alert(`Failed to create task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'create task');
    }
  };

  // Backlog Update Functions
  const updateEpicTitle = async (epicId: number, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/${epicId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update epic title');
      }
    } catch (error) {
      handleApiError(error, 'update epic title');
    }
  };

  const updateSubEpicTitle = async (subEpicId: number, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sub-epics/${subEpicId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update sub-epic title');
      }
    } catch (error) {
      handleApiError(error, 'update sub-epic title');
    }
  };

  const updateUserStoryTitle = async (storyId: number, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-stories/${storyId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update user story title');
      }
    } catch (error) {
      handleApiError(error, 'update user story title');
    }
  };

  const updateTaskTitle = async (taskId: number, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update task title');
      }
    } catch (error) {
      handleApiError(error, 'update task title');
    }
  };

  // Save all backlog changes
  const saveBacklogChanges = async () => {
    try {
      const updatePromises = [];

      // Collect all updates from the current backlog state
      for (const epic of backlog.epics) {
        // Update epic title
        updatePromises.push(updateEpicTitle(epic.id, epic.title));

        // Update sub-epic titles
        for (const subEpic of epic.subEpics || []) {
          updatePromises.push(updateSubEpicTitle(subEpic.id, subEpic.title));

          // Update user story titles
          for (const userStory of subEpic.userStories || []) {
            updatePromises.push(updateUserStoryTitle(userStory.id, userStory.title));

            // Update task titles
            for (const task of userStory.tasks || []) {
              updatePromises.push(updateTaskTitle(task.id, task.title));
            }
          }
        }
      }

      // Execute all updates in parallel
      await Promise.all(updatePromises);
      
      // Refresh the backlog data to ensure we have the latest from the server
      await fetchBacklog();
      
      // Exit editing mode
      setIsEditingBacklog(false);
      
      console.log('✅ All backlog changes saved successfully');
    } catch (error) {
      console.error('❌ Error saving backlog changes:', error);
      alert('Failed to save some changes. Please try again.');
    }
  };

  // Overview CRUD Operations
  // TODO: Implement project title/summary update in UI
  const updateProject = async () => {
    try {
      // Update project title and summary
      const projectResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/`, {
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
        alert(`Failed to update project: ${errorData.message || 'Unknown error'}`);
        return;
      }

      // Update features
      const featuresPromises = projectData.features.map(async (feature) => {
        if (feature.id) {
          const response = await fetch(`${API_BASE_URL}/project-features/${feature.id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ title: feature.title }),
          });
          return response.ok;
        }
        return true;
      });

      // Update roles
      const rolesPromises = projectData.roles.map(async (role) => {
        if (role.id) {
          const response = await fetch(`${API_BASE_URL}/project-roles/${role.id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ role: role.role }),
          });
          return response.ok;
        }
        return true;
      });

      // Update goals
      const goalsPromises = projectData.goals.map(async (goal) => {
        if (goal.id) {
          const response = await fetch(`${API_BASE_URL}/project-goals/${goal.id}/`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ title: goal.title }),
          });
          return response.ok;
        }
        return true;
      });

      // Update timeline items
      const timelinePromises = projectData.timeline.flatMap(week => 
        week.items.map(async (item) => {
          if (item.id) {
            const response = await fetch(`${API_BASE_URL}/timeline-items/${item.id}/`, {
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

      // Wait for all updates to complete
      await Promise.all([...featuresPromises, ...rolesPromises, ...goalsPromises, ...timelinePromises]);

      // Refresh all data from the server
      await fetchProjectData();

      alert('Project updated successfully!');
      setIsEditingOverview(false);
    } catch (error) {
      handleApiError(error, 'update project');
    }
  };

  const addFeature = async () => {
    if (!newFeatureTitle.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/project-features/`, {
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
        alert(`Failed to add feature: ${errorData.message || 'Unknown error'}`);
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
          endpoint = `${API_BASE_URL}/project-features/${deleteItem.id}/`;
          break;
        case 'role':
          endpoint = `${API_BASE_URL}/project-roles/${deleteItem.id}/`;
          break;
        case 'goal':
          endpoint = `${API_BASE_URL}/project-goals/${deleteItem.id}/`;
          break;
        case 'timeline':
          endpoint = `${API_BASE_URL}/timeline-items/${deleteItem.id}/`;
          break;
        case 'timeline-week':
          endpoint = `${API_BASE_URL}/timeline-weeks/${deleteItem.id}/`;
          break;
        case 'epic':
          endpoint = `${API_BASE_URL}/epics/${deleteItem.id}/`;
          break;
        case 'sub-epic':
          endpoint = `${API_BASE_URL}/sub-epics/${deleteItem.id}/`;
          break;
        case 'user-story':
          endpoint = `${API_BASE_URL}/user-stories/${deleteItem.id}/`;
          break;
        case 'task':
          endpoint = `${API_BASE_URL}/story-tasks/${deleteItem.id}/`;
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
        fetchProjectData(); // Refresh project data
      } else {
        const errorData = await response.json();
        alert(`Failed to delete ${deleteItem.type}: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, `delete ${deleteItem.type}`);
    }
  };

  const addRole = async () => {
    if (!newRoleTitle.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/project-roles/`, {
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
        alert(`Failed to add role: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add role');
    }
  };


  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/project-goals/`, {
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
        alert(`Failed to add goal: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add goal');
    }
  };


  // Repository CRUD Operations
  const handleAddRepo = async (repoData: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/repositories/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          project: projectId,
          name: repoData.name,
          url: repoData.url,
          branch: repoData.branch || 'main',
          assigned_to: repoData.assigned_to || null
        }),
      });

      if (response.ok) {
        fetchRepositories(); // Refresh repositories
      } else {
        const errorData = await response.json();
        alert(`Failed to add repository: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add repository');
    }
  };

  const deleteRepo = async (repoId: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/repositories/${repoId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (response.ok) {
        fetchRepositories(); // Refresh repositories
      } else {
        alert('Failed to delete repository');
      }
    } catch (error) {
      handleApiError(error, 'delete repository');
    }
  };

  const openEditMember = (member: any) => {
    setEditingMember({ ...member });
    setShowEditMemberModal(true);
  };

  // Updated handleAddRepo to use the API-based function
  const handleAddRepoLocal = () => {
    if (repoForm.name && repoForm.url) {
      handleAddRepo({
        name: repoForm.name,
        url: repoForm.url,
        branch: repoForm.branch,
        assigned_to: repoForm.assignedTo
      });
      setRepoForm({ name: '', url: '', branch: 'main', assignedTo: '' });
      setShowRepoModal(false);
      setEditingRepo(null);
    }
  };

  const openEditRepo = (repo: any) => {
    setEditingRepo(repo);
    setRepoForm({ name: repo.name, url: repo.url, branch: repo.branch, assignedTo: repo.assignedTo });
    setShowRepoModal(true);
  };

  // Old local state manipulation functions removed - now using API-based CRUD operations

  // Wrapper functions for UI compatibility
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
      alert('Please enter a week number');
      return;
    }
    
    const weekNum = parseInt(newWeekNumber.trim());
    if (isNaN(weekNum) || weekNum < 1) {
      alert('Please enter a valid week number (1 or higher)');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/timeline-weeks/`, {
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
        alert(`Failed to add week: ${errorData.message || 'Unknown error'}`);
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
      alert('Please enter a task title');
      return;
    }
    
    if (selectedWeekIndex === null) {
      alert('No week selected');
      return;
    }
    
    try {
      // Get the week ID from the current timeline data
      const week = projectData.timeline[selectedWeekIndex];
      if (!week || !week.id) {
        alert('Week not found. Please refresh and try again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/timeline-items/`, {
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
        alert(`Failed to add task: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      handleApiError(error, 'add timeline task');
    }
  };



  // Show loading state
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

  // Show error state
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

  return (
    <div className={`flex min-h-screen w-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
                        <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-green-200' : 'text-green-700'}`}>45</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mt-1`}>+8 from last week</p>
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
                        <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>10</p>
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
                        <p className={`text-4xl font-bold ${theme === 'dark' ? 'text-orange-200' : 'text-orange-700'}`}>2</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} mt-1`}>Awaiting start</p>
                      </div>
                      <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                    </div>
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
                      
                      {monitoringData.weeks.map((week, i) => {
                        const x = 80 + (i * 110);
                        const barWidth = 25;
                        const completed = monitoringData.completed[i];
                        const inProgress = monitoringData.inProgress[i];
                        const pending = monitoringData.pending[i];
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
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center font-medium"
                        title="Regenerate project overview using AI"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </button>
                      <button
                        onClick={() => isEditingOverview ? updateProject() : setIsEditingOverview(true)}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center font-medium"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {isEditingOverview ? 'Save Changes' : 'Edit'}
                      </button>
                      {isEditingOverview && (
                        <button
                          onClick={() => setIsEditingOverview(false)}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center font-medium"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={`p-6 space-y-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
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
                              <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{role.role}</span>
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
                              <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{feature.title}</span>
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
                                <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{goal.title}</span>
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
                                <div key={task.id || taskIdx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
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
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center shadow-sm"
                      title="Regenerate backlog using AI"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </button>
                    {!isEditingBacklog ? (
                  <button
                        onClick={() => setIsEditingBacklog(true)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center shadow-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingBacklog(false)}
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
                  <div key={epic.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="px-4 py-1.5 bg-red-500 text-white rounded-full text-sm font-semibold mr-4 shadow-sm">
                            Epic
                          </span>
                          {isEditingBacklog ? (
                          <input
                            type="text"
                              value={epic.title}
                            className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-red-300 focus:border-red-500 focus:outline-none transition-colors flex-1"
                            onChange={(e) => {
                                const updatedEpics = backlog.epics.map(ep => 
                                  ep.id === epic.id ? { ...ep, title: e.target.value } : ep
                              );
                              setBacklog({ ...backlog, epics: updatedEpics });
                            }}
                          />
                          ) : (
                            <span className="text-xl font-bold text-gray-900">{epic.title}</span>
                          )}
                        </div>
                        {isEditingBacklog && (
                        <button 
                            onClick={() => handleDeleteClick('epic', epic.id, epic.title)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"
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
                          <div key={subEpic.id} className="border-l-4 border-orange-400 pl-6 py-2">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center flex-1">
                                <span className="px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold mr-3 shadow-sm">
                                  Sub-Epic
                                </span>
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
                                  }}
                                  className="text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-orange-300 focus:border-orange-500 focus:outline-none transition-colors flex-1"
                                />
                                ) : (
                                  <span className="text-lg font-semibold text-gray-900">{subEpic.title}</span>
                                )}
                              </div>
                              {isEditingBacklog && (
                              <button 
                                  onClick={() => handleDeleteClick('sub-epic', subEpic.id, subEpic.title)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              )}
                            </div>

                            {/* User Stories */}
                            <div className="space-y-4 ml-6">
                              {(subEpic.userStories || []).map((story) => (
                                <div key={story.id} className="border-l-4 border-blue-400 pl-6 py-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center flex-1">
                                      <span className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-semibold mr-3 shadow-sm">
                                        User Story
                                      </span>
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
                                        }}
                                        className="flex-1 text-gray-900 bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none transition-colors"
                                      />
                                      ) : (
                                        <span className="flex-1 text-gray-900">{story.title}</span>
                                      )}
                                    </div>
                                    {isEditingBacklog && (
                                    <button 
                                        onClick={() => handleDeleteClick('user-story', story.id, story.title)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    )}
                                  </div>

                                  {/* Tasks */}
                                  <div className="space-y-2 ml-6">
                                    {(story.tasks || []).map((task) => (
                                      <div key={task.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
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
                                            }}
                                            className="bg-transparent text-gray-700 border-b-2 border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none flex-1 transition-colors"
                                          />
                                          ) : (
                                            <span className="flex-1 text-gray-700">{task.title}</span>
                                          )}
                                        </div>
                                        {isEditingBacklog && (
                                        <button 
                                            onClick={() => handleDeleteClick('task', task.id, task.title)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
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
                                {member.position}
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
                                <button
                                  onClick={() => setMembers(members.filter(m => m.id !== member.id))}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                      setRepoForm({ name: '', url: '', branch: 'main', assignedTo: '' });
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
                            onClick={() => deleteRepo(repo.id)}
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
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium">Assigned to:</span>
                          <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-semibold">
                            {repo.assignedTo || 'Unassigned'}
                          </span>
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
                        setRepoForm({ name: '', url: '', branch: 'main', assignedTo: '' });
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
                  Position
                </label>
                <select
                  value={inviteForm.position}
                  onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Select a position</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Scrum Master">Scrum Master</option>
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

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, name: e.target.value })
                  }
                  placeholder="Enter name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editingMember.email}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, email: e.target.value })
                  }
                  placeholder="Enter email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={editingMember.position}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, position: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Select a position</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="QA Engineer">QA Engineer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Scrum Master">Scrum Master</option>
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
                    setRepoForm({ name: '', url: '', branch: 'main', assignedTo: '' });
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
                  placeholder="https://github.com/username/repo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                />
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  value={repoForm.assignedTo}
                  onChange={(e) => setRepoForm({ ...repoForm, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                >
                  <option value="">Select a team member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} - {member.position}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowRepoModal(false);
                    setEditingRepo(null);
                    setRepoForm({ name: '', url: '', branch: 'main', assignedTo: '' });
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
    </div>
  );
}