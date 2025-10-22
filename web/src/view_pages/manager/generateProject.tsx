import React, { useState } from 'react';
import { Upload, Users, Target, FileText, Plus, X, Sparkles, Check, ArrowRight, Calendar, Mail, RefreshCw, Send, ArrowLeft } from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";
import Sidebar from "../../components/sidebarLayout";
import { useTheme } from "../../components/themeContext"; // <-- import ThemeContext
import LoadingSpinner from "../../components/LoadingSpinner";

// Types based on Django models
interface Member {
  id: string;
  role: string;
  user_name?: string;
  user_email?: string;
  ai: boolean;
}

interface Feature {
  id: string;
  title: string;
  ai: boolean;
}

interface Goal {
  id: string;
  title: string;
  role: string;
  ai: boolean;
}

interface TimelineWeek {
  id: string;
  week_number: number;
  goals: string[];
  ai: boolean;
}

interface Epic {
  id: string;
  title: string;
  description: string;
  ai: boolean;
}

interface SubEpic {
  id: string;
  epic_id: string;
  title: string;
  ai: boolean;
}

interface UserStory {
  id: string;
  sub_epic_id: string;
  title: string;
  ai: boolean;
}

interface Task {
  id: string;
  user_story_id: string;
  title: string;
  status: string;
  ai: boolean;
  assignee?: {
    id: string;
    user_name: string;
    user_email: string;
  } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  sent: boolean;
}

type Step = 'create' | 'upload' | 'analyze' | 'review' | 'backlog' | 'invite';

const App: React.FC = () => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<Step>('create');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectSummary, setProjectSummary] = useState('');
  const [aiGeneratedSummary, setAiGeneratedSummary] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [timeline, setTimeline] = useState<TimelineWeek[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [uploadedProposalId, setUploadedProposalId] = useState<string | null>(null);
  const [authFormat, setAuthFormat] = useState<'Bearer' | 'Token'>('Bearer');

  // New states for Epic, Sub Epic, User Story, Tasks
  const [epics, setEpics] = useState<Epic[]>([]);
  const [subEpics, setSubEpics] = useState<SubEpic[]>([]);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedSubEpics, setExpandedSubEpics] = useState<Set<string>>(new Set());

  // New states for invitations
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newInvitation, setNewInvitation] = useState({ email: '', role: '' });

  const [newMember, setNewMember] = useState({ role: '', user_name: '', user_email: '' });
  const [newFeature, setNewFeature] = useState({ title: '' });
  const [newGoal, setNewGoal] = useState({ title: '', role: '' });
  const [newTimelineWeek, setNewTimelineWeek] = useState({ week_number: 1, goal: '' });

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Helper function to get the access token
  const getAuthToken = (): string | null => {
    return localStorage.getItem('access') || localStorage.getItem('token');
  };

  // Helper function to handle API responses
  const handleApiResponse = async (response: Response, actionName: string) => {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error(`Non-JSON response for ${actionName}:`, textResponse);
      throw new Error(`Server error: Expected JSON but got ${contentType}. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error(`Error response for ${actionName}:`, data);
      const errorMessage = data.error || data.detail || data.message || JSON.stringify(data) || `Failed to ${actionName}`;
      throw new Error(errorMessage);
    }

    return data;
  };

  // Test API connection on component mount
  React.useEffect(() => {
    const testConnection = async () => {
      try {
        const token = getAuthToken();
        
        const sessionTest = await fetch(`${API_BASE_URL}/api/ai/projects/`, {
          credentials: 'include',
        });
        
        if (sessionTest.ok) {
          console.log('✅ Using session/cookie authentication');
          setAuthFormat('Bearer');
          return;
        }
        
        if (!token) {
          console.warn('⚠️ No authentication token found and session auth failed');
          return;
        }
        
        const bearerTest = await fetch(`${API_BASE_URL}/api/ai/projects/`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });
        
        if (bearerTest.ok) {
          console.log('✅ Using Bearer token authentication');
          setAuthFormat('Bearer');
          return;
        }
        
        const tokenTest = await fetch(`${API_BASE_URL}/api/ai/projects/`, {
          headers: { 'Authorization': `Token ${token}` },
          credentials: 'include',
        });
        
        if (tokenTest.ok) {
          console.log('✅ Using Token authentication');
          setAuthFormat('Token');
          return;
        }
        
        console.warn('⚠️ All authentication methods failed');
      } catch (error) {
        console.error('❌ API connection test failed:', error);
      }
    };
    
    testConnection();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed.');
        return;
      }
      setUploadedFile(file);
    }
  };
  
  // Handle drag-and-drop
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
      alert('Only PDF files are allowed.');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadedProposalId(null);
  };

  // STEP 1: Create Project
  const createProject = async () => {
    if (!projectTitle) {
      alert('Please fill in project title');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      const projectData = {
        title: projectTitle,
        summary: projectSummary || 'No summary provided',
      };

      const projectResponse = await fetch(`${API_BASE_URL}/api/ai/projects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(projectData),
      });

      const project = await handleApiResponse(projectResponse, 'create project');
      console.log('Project created:', project);
      setCreatedProjectId(project.id);
      setCurrentStep('upload');
    } catch (error) {
      console.error('Error creating project:', error);
      alert(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip Create Project
  const skipCreateProject = () => {
    if (!projectTitle) {
      alert('Project Title is required before skipping');
      return;
    }
    // Create a minimal project and skip to upload
    createProject();
  };

  // STEP 2: Upload Proposal
  const uploadProposal = async () => {
    if (!uploadedFile || !createdProjectId) {
      alert('Please upload a proposal file');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('project_id', createdProjectId);

      const response = await fetch(`${API_BASE_URL}/api/ai/proposals/`, {
        method: 'POST',
        headers: {
          'Authorization': `${authFormat} ${token}`,
        },
        body: formData,
      });

      const data = await handleApiResponse(response, 'upload proposal');
      console.log('Proposal uploaded:', data);
      setUploadedProposalId(data.proposal_id);
      setCurrentStep('analyze');
    } catch (error) {
      console.error('Error uploading proposal:', error);
      alert(`Failed to upload proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip Upload Proposal
  const skipUploadProposal = () => {
    setCurrentStep('analyze');
  };

  // STEP 3: Analyze with LLM (Ingest Proposal)
  const analyzeProposal = async () => {
    if (!createdProjectId || !uploadedProposalId) {
      alert('Missing project or proposal data');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/projects/${createdProjectId}/ingest-proposal/${uploadedProposalId}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${authFormat} ${token}`,
          },
          body: JSON.stringify({
            title: projectTitle,
          }),
        }
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || data.detail || 'Analysis failed';
        const details = data.details || '';
        throw new Error(`${errorMsg}${details ? '\n\n' + details : ''}`);
      }

      console.log('Proposal analyzed:', data);

      // Extract LLM output
      const llmOutput = data.llm;
      
      // Set AI-generated summary
      if (llmOutput.summary) {
        setAiGeneratedSummary(llmOutput.summary);
      }

      // Set AI-generated roles/members
      if (llmOutput.roles && Array.isArray(llmOutput.roles)) {
        const aiMembers = llmOutput.roles.map((role: string) => ({
          id: crypto.randomUUID(),
          role: role,
          ai: true,
        }));
        setMembers(aiMembers);
      }

      // Set AI-generated features
      if (llmOutput.features && Array.isArray(llmOutput.features)) {
        const aiFeatures = llmOutput.features.map((feature: string) => ({
          id: crypto.randomUUID(),
          title: feature,
          ai: true,
        }));
        setFeatures(aiFeatures);
      }

      // Set AI-generated goals
      if (llmOutput.goals && Array.isArray(llmOutput.goals)) {
        const aiGoals = llmOutput.goals.map((goal: any) => ({
          id: crypto.randomUUID(),
          title: goal.title || goal,
          role: goal.role || '',
          ai: true,
        }));
        setGoals(aiGoals);
      }

      // Set AI-generated timeline
      if (llmOutput.timeline && Array.isArray(llmOutput.timeline)) {
        const aiTimeline = llmOutput.timeline.map((week: any) => ({
          id: crypto.randomUUID(),
          week_number: week.week_number || 0,
          goals: Array.isArray(week.goals) ? week.goals : [],
          ai: true,
        }));
        setTimeline(aiTimeline);
      }

      setCurrentStep('review');
    } catch (error) {
      console.error('Error analyzing proposal:', error);
      alert(`Failed to analyze proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip AI Analysis
  const skipAnalyzeProposal = () => {
    setCurrentStep('review');
  };

  // Skip Review and Edit
  const skipReviewEdit = () => {
    setCurrentStep('backlog');
    generateMockBacklog();
  };

  // Generate Mock Backlog (for demo purposes)
  const generateMockBacklog = () => {
    const mockEpics: Epic[] = [
      {
        id: crypto.randomUUID(),
        title: 'User Authentication System',
        description: 'Implement complete user authentication and authorization',
        ai: true,
      },
      {
        id: crypto.randomUUID(),
        title: 'Dashboard Development',
        description: 'Create admin and user dashboards',
        ai: true,
      },
    ];

    const mockSubEpics: SubEpic[] = [
      {
        id: crypto.randomUUID(),
        epic_id: mockEpics[0].id,
        title: 'Login System',
        ai: true,
      },
      {
        id: crypto.randomUUID(),
        epic_id: mockEpics[0].id,
        title: 'Registration System',
        ai: true,
      },
      {
        id: crypto.randomUUID(),
        epic_id: mockEpics[1].id,
        title: 'Admin Dashboard',
        ai: true,
      },
    ];

    const mockUserStories: UserStory[] = [
      {
        id: crypto.randomUUID(),
        sub_epic_id: mockSubEpics[0].id,
        title: 'As a user, I want to login with email and password',
        ai: true,
      },
      {
        id: crypto.randomUUID(),
        sub_epic_id: mockSubEpics[0].id,
        title: 'As a user, I want to reset my password',
        ai: true,
      },
      {
        id: crypto.randomUUID(),
        sub_epic_id: mockSubEpics[1].id,
        title: 'As a new user, I want to create an account',
        ai: true,
      },
      {
        id: crypto.randomUUID(),
        sub_epic_id: mockSubEpics[2].id,
        title: 'As an admin, I want to see system statistics',
        ai: true,
      },
    ];

    setEpics(mockEpics);
    setSubEpics(mockSubEpics);
    setUserStories(mockUserStories);
  };

  // STEP 4: Generate Backlog and Save
  const generateBacklogAndSave = async () => {
    if (!createdProjectId) {
      alert('Missing project data');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/projects/${createdProjectId}/generate-backlog/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${authFormat} ${token}`,
          },
        }
      );

      const data = await handleApiResponse(response, 'generate backlog');
      console.log('Backlog generated:', data);

      // Fetch the complete backlog structure after generation
      await fetchBacklog();
      setCurrentStep('backlog');
    } catch (error) {
      console.error('Error generating backlog:', error);
      alert(`Failed to generate backlog: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Generate mock backlog for demo
      generateMockBacklog();
      setCurrentStep('backlog');
    } finally {
      setIsLoading(false);
    }
  };


  // Fetch Backlog Data
  const fetchBacklog = async () => {
    if (!createdProjectId) {
      console.error('No project ID available');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ai/projects/${createdProjectId}/backlog/`,
        {
          headers: { 'Authorization': `${authFormat} ${token}` },
          credentials: 'include',
        }
      );

      const data = await handleApiResponse(response, 'fetch backlog');
      console.log('Backlog fetched:', data);

      // Transform backend response to frontend state
      setEpics(data.epics);
      
      // Flatten sub_epics with epic_id
      const flattenedSubEpics = data.epics.flatMap((epic: any) => 
        epic.sub_epics.map((subEpic: any) => ({
          ...subEpic,
          epic_id: epic.id
        }))
      );
      setSubEpics(flattenedSubEpics);

      // Flatten user_stories with sub_epic_id
      const flattenedUserStories = data.epics.flatMap((epic: any) => 
        epic.sub_epics.flatMap((subEpic: any) => 
          subEpic.user_stories.map((userStory: any) => ({
            ...userStory,
            sub_epic_id: subEpic.id
          }))
        )
      );
      setUserStories(flattenedUserStories);

      // Flatten tasks with user_story_id
      const flattenedTasks = data.epics.flatMap((epic: any) => 
        epic.sub_epics.flatMap((subEpic: any) => 
          subEpic.user_stories.flatMap((userStory: any) => 
            userStory.tasks.map((task: any) => ({
              ...task,
              user_story_id: userStory.id
            }))
          )
        )
      );
      setTasks(flattenedTasks);
      
      // Auto-expand all epics and sub-epics
      const allEpicIds = new Set<string>(data.epics.map((epic: any) => String(epic.id)));
      setExpandedEpics(allEpicIds);
      
      const allSubEpicIds = new Set<string>(
        data.epics.flatMap((epic: any) => 
          epic.sub_epics.map((subEpic: any) => String(subEpic.id))
        )
      );
      setExpandedSubEpics(allSubEpicIds);

    } catch (error) {
      console.error('Error fetching backlog:', error);
      alert(`Failed to fetch backlog: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Epic CRUD Functions
  const createEpic = async (epicData: { title: string; description: string }) => {
    const token = getAuthToken();
    if (!token || !createdProjectId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/epics/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify({
          project: createdProjectId,
          title: epicData.title,
          description: epicData.description || '',
          ai: false
        }),
      });

      await handleApiResponse(response, 'create epic');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error creating epic:', error);
      alert(`Failed to create epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateEpic = async (epicId: string, epicData: { title?: string; description?: string }) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/epics/${epicId}/`, {
        method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${authFormat} ${token}`,
          },
        body: JSON.stringify(epicData),
      });

      await handleApiResponse(response, 'update epic');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error updating epic:', error);
      alert(`Failed to update epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteEpic = async (epicId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/epics/${epicId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `${authFormat} ${token}` },
      });

      await handleApiResponse(response, 'delete epic');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error deleting epic:', error);
      alert(`Failed to delete epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // SubEpic CRUD Functions
  const createSubEpic = async (subEpicData: { epic_id: string; title: string }) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/sub-epics/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify({
          epic: subEpicData.epic_id,
          title: subEpicData.title,
          ai: false
        }),
      });

      await handleApiResponse(response, 'create sub-epic');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error creating sub-epic:', error);
      alert(`Failed to create sub-epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateSubEpic = async (subEpicId: string, subEpicData: { title?: string }) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/sub-epics/${subEpicId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify(subEpicData),
      });

      await handleApiResponse(response, 'update sub-epic');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error updating sub-epic:', error);
      alert(`Failed to update sub-epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteSubEpic = async (subEpicId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/sub-epics/${subEpicId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `${authFormat} ${token}` },
      });

      await handleApiResponse(response, 'delete sub-epic');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error deleting sub-epic:', error);
      alert(`Failed to delete sub-epic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // UserStory CRUD Functions
  const createUserStory = async (userStoryData: { sub_epic_id: string; title: string }) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/user-stories/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify({
          sub_epic: userStoryData.sub_epic_id,
          title: userStoryData.title,
          ai: false
        }),
      });

      await handleApiResponse(response, 'create user story');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error creating user story:', error);
      alert(`Failed to create user story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateUserStory = async (userStoryId: string, userStoryData: { title?: string }) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/user-stories/${userStoryId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify(userStoryData),
      });

      await handleApiResponse(response, 'update user story');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error updating user story:', error);
      alert(`Failed to update user story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteUserStory = async (userStoryId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/user-stories/${userStoryId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `${authFormat} ${token}` },
      });

      await handleApiResponse(response, 'delete user story');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error deleting user story:', error);
      alert(`Failed to delete user story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Task CRUD Functions
  const createTask = async (taskData: { user_story_id: string; title: string; status?: string; assignee_id?: string }) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/story-tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify({
          user_story: taskData.user_story_id,
          title: taskData.title,
          status: taskData.status || 'pending',
          ai: false,
          assignee: taskData.assignee_id || null
        }),
      });

      await handleApiResponse(response, 'create task');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateTask = async (taskId: string, taskData: { title?: string; status?: string; assignee_id?: string }) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify({
          ...taskData,
          assignee: taskData.assignee_id || null
        }),
      });

      await handleApiResponse(response, 'update task');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/story-tasks/${taskId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `${authFormat} ${token}` },
      });

      await handleApiResponse(response, 'delete task');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateTaskAssignment = async (taskId: string, assigneeId: string | null) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/story-tasks/${taskId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${authFormat} ${token}`,
        },
        body: JSON.stringify({ assignee: assigneeId }),
      });

      await handleApiResponse(response, 'update task assignment');
      await fetchBacklog(); // Refresh the backlog
    } catch (error) {
      console.error('Error updating task assignment:', error);
      alert(`Failed to update task assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Refresh Backlog
  const refreshBacklog = () => {
    generateBacklogAndSave();
  };

  // Skip Generate Backlog
  const skipGenerateBacklog = () => {
    generateMockBacklog();
    setCurrentStep('invite');
  };

  // Add Invitation
  const addInvitation = () => {
    if (newInvitation.email && newInvitation.role) {
      const invitation: Invitation = {
        id: crypto.randomUUID(),
        email: newInvitation.email,
        role: newInvitation.role,
        sent: false,
      };
      setInvitations([...invitations, invitation]);
      setNewInvitation({ email: '', role: '' });
    }
  };

  // Remove Invitation
  const removeInvitation = (id: string) => {
    setInvitations(invitations.filter(inv => inv.id !== id));
  };

  // Send Invitations
  const sendInvitations = async () => {
    if (invitations.length === 0) {
      alert('Please add at least one invitation');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const invitation of invitations) {
        try {
          // Look up user by email first
          const usersResponse = await fetch(
            `${API_BASE_URL}/api/user/?email=${encodeURIComponent(invitation.email)}`,
            {
              headers: { 'Authorization': `${authFormat} ${token}` },
              credentials: 'include',
            }
          );

          if (!usersResponse.ok) {
            console.warn(`Failed to lookup user with email ${invitation.email}`);
            errorCount++;
            continue;
          }

          const users = await usersResponse.json();
          
          if (users.length === 0) {
            console.warn(`User with email ${invitation.email} not found`);
            errorCount++;
            continue;
          }
          
          const user = users[0];
          
          // Create invitation with user ID
          const response = await fetch(`${API_BASE_URL}/api/ai/invitations/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `${authFormat} ${token}`,
          },
            body: JSON.stringify({
              project: parseInt(createdProjectId!),
              invitee: parseInt(user.user_id),
              message: `You've been invited as ${invitation.role}`
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            console.warn(`Failed to send invitation to ${invitation.email}:`, errorData);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error sending invitation to ${invitation.email}:`, error);
          errorCount++;
        }
      }

      // Mark successful invitations as sent
      setInvitations(invitations.map(inv => ({ ...inv, sent: true })));
      
      if (successCount > 0) {
        alert(`Successfully sent ${successCount} invitation(s)${errorCount > 0 ? `. ${errorCount} failed.` : '!'}`);
      } else {
        alert('Failed to send any invitations. Please check the email addresses.');
      }
      
      // Reset after success
      if (successCount > 0) {
      setTimeout(() => {
        resetForm();
      }, 2000);
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      alert(`Failed to send invitations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setProjectTitle('');
    setProjectSummary('');
    setAiGeneratedSummary('');
    setMembers([]);
    setFeatures([]);
    setGoals([]);
    setTimeline([]);
    setUploadedFile(null);
    setCreatedProjectId(null);
    setUploadedProposalId(null);
    setEpics([]);
    setSubEpics([]);
    setUserStories([]);
    setTasks([]);
    setInvitations([]);
    setCurrentStep('create');
  };

  const addMember = () => {
    if (newMember.role) {
      const newEntry: Member = { 
        id: crypto.randomUUID(), 
        role: newMember.role,
        user_name: newMember.user_name || undefined,
        user_email: newMember.user_email || undefined,
        ai: false 
      };
      setMembers([...members, newEntry]);
      setNewMember({ role: '', user_name: '', user_email: '' });
    }
  };

  const addFeature = () => {
    if (newFeature.title) {
      const newEntry: Feature = { id: crypto.randomUUID(), title: newFeature.title, ai: false };
      setFeatures([...features, newEntry]);
      setNewFeature({ title: '' });
    }
  };

  const addGoal = () => {
    if (newGoal.title) {
      const newEntry: Goal = { id: crypto.randomUUID(), ...newGoal, ai: false };
      setGoals([...goals, newEntry]);
      setNewGoal({ title: '', role: '' });
    }
  };

  const addTimelineWeek = () => {
    if (newTimelineWeek.goal) {
      const existingWeek = timeline.find(w => w.week_number === newTimelineWeek.week_number);
      
      if (existingWeek) {
        const updatedTimeline = timeline.map(w => 
          w.week_number === newTimelineWeek.week_number
            ? { ...w, goals: [...w.goals, newTimelineWeek.goal] }
            : w
        );
        setTimeline(updatedTimeline);
      } else {
        const newWeek: TimelineWeek = {
          id: crypto.randomUUID(),
          week_number: newTimelineWeek.week_number,
          goals: [newTimelineWeek.goal],
          ai: false,
        };
        setTimeline([...timeline, newWeek].sort((a, b) => a.week_number - b.week_number));
      }
      
      setNewTimelineWeek({ week_number: newTimelineWeek.week_number + 1, goal: '' });
    }
  };

  const removeTimelineGoal = (weekId: string, goalIndex: number) => {
    const updatedTimeline = timeline.map(week => {
      if (week.id === weekId) {
        const newGoals = week.goals.filter((_, idx) => idx !== goalIndex);
        return { ...week, goals: newGoals };
      }
      return week;
    }).filter(week => week.goals.length > 0);
    
    setTimeline(updatedTimeline);
  };

  const removeMember = (id: string) => setMembers(members.filter(m => m.id !== id));
  const removeFeature = (id: string) => setFeatures(features.filter(f => f.id !== id));
  const removeGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  // Toggle Epic Expansion
  const toggleEpic = (epicId: string) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(epicId)) {
      newExpanded.delete(epicId);
    } else {
      newExpanded.add(epicId);
    }
    setExpandedEpics(newExpanded);
  };

  // Toggle Sub Epic Expansion
  const toggleSubEpic = (subEpicId: string) => {
    const newExpanded = new Set(expandedSubEpics);
    if (newExpanded.has(subEpicId)) {
      newExpanded.delete(subEpicId);
    } else {
      newExpanded.add(subEpicId);
    }
    setExpandedSubEpics(newExpanded);
  };


  // Step indicator component
  const StepIndicator = () => {
    const steps = [
      { key: 'create', label: 'Create Project', completed: ['upload', 'analyze', 'review', 'backlog', 'invite'].includes(currentStep) },
      { key: 'upload', label: 'Upload Proposal', completed: ['analyze', 'review', 'backlog', 'invite'].includes(currentStep) },
      { key: 'analyze', label: 'AI Analysis', completed: ['review', 'backlog', 'invite'].includes(currentStep) },
      { key: 'review', label: 'Review & Edit', completed: ['backlog', 'invite'].includes(currentStep) },
      { key: 'backlog', label: 'Generate Backlog', completed: currentStep === 'invite' },
      { key: 'invite', label: 'Invite Team', completed: false },
    ];

    return (
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex items-center flex-shrink-0">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step.completed ? 'bg-green-500' : currentStep === step.key ? 'bg-blue-500' : theme === "dark" ? 'bg-gray-600' : 'bg-gray-300'
              } text-white font-semibold text-sm`}>
                {step.completed ? <Check size={16} /> : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium whitespace-nowrap ${
                currentStep === step.key ? 'text-blue-600' : theme === "dark" ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 min-w-[20px] ${
                step.completed ? 'bg-green-500' : theme === "dark" ? 'bg-gray-600' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
     <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

    <div className="flex-1 flex flex-col">
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        

      <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
        <button
            onClick={() => window.history.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4 group">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Projects</span>
          </button>
      <div className="max-w-6xl mx-auto">
        <div className={`rounded-lg border p-6 shadow-sm ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <h1 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Create New Project</h1>
          
          <StepIndicator />

          {/* STEP 1: Create Project */}
          {currentStep === 'create' && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Project Title *</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                  }`}
                  placeholder="Enter project name"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Project Summary</label>
                <textarea
                  value={projectSummary}
                  onChange={(e) => setProjectSummary(e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                  }`}
                  placeholder="Describe your project (optional)"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={skipCreateProject}
                  disabled={!projectTitle || isLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip
                </button>
                <button
                  onClick={createProject}
                  disabled={!projectTitle || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Project
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Upload Proposal */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Project created successfully! ID: {createdProjectId}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Upload Proposal (PDF)</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                    dragActive ? 'border-blue-400 bg-blue-50' : theme === "dark" ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                  } cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => !isLoading && document.getElementById('fileInput')?.click()}
                >
                  <Upload size={32} className={`mx-auto mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`} />
                  <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                    {uploadedFile
                      ? `Selected File: ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(2)} KB)`
                      : 'Click to upload or drag and drop'}
                  </p>
                  <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>PDF files only</p>

                  <input
                    id="fileInput"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>

                {uploadedFile && (
                  <div className={`mt-3 flex items-center justify-between border p-3 rounded-lg ${
                    theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
                  }`}>
                    <span className={`text-sm truncate ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{uploadedFile.name}</span>
                    <button
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                      disabled={isLoading}
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={skipUploadProposal}
                  disabled={isLoading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip
                </button>
                <button
                  onClick={uploadProposal}
                  disabled={!uploadedFile || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      Upload Proposal
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Analyze */}
          {currentStep === 'analyze' && (
            <div className="space-y-6">
              {uploadedProposalId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm flex items-center gap-2">
                    <Check size={16} className="text-green-600" />
                    Proposal uploaded successfully! Ready for AI analysis.
                  </p>
                </div>
              )}

              <div className="text-center py-8">
                <Sparkles size={48} className="mx-auto text-blue-500 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Ready to Analyze</h3>
                <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Our AI will analyze your proposal and generate project roles, features, goals, and timeline.
                </p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={skipAnalyzeProposal}
                    disabled={isLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip
                  </button>
                  <button
                    onClick={analyzeProposal}
                    disabled={isLoading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <LoadingSpinner className="text-white" />
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Analyze with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Edit */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  AI analysis complete! Review and edit the results below.
                </p>
              </div>

              {/* AI Summary */}
              {aiGeneratedSummary && (
                <div>
                  <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                    <Sparkles size={16} className="text-purple-500" />
                    AI Generated Summary
                  </label>
                  <textarea
                    value={aiGeneratedSummary}
                    onChange={(e) => setAiGeneratedSummary(e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      theme === "dark" ? "bg-purple-900 border-purple-700 text-white" : "bg-purple-50 border-gray-300"
                    }`}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Project Roles */}
              {members.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      <Users size={20} />
                      Project Roles
                    </h3>
                  </div>
                  
                  <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                    {members.map(member => (
                      <div key={member.id} className={`flex items-center justify-between p-3 rounded-lg ${
                        member.ai ? 'bg-purple-50 border border-purple-200' : theme === "dark" ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <div>
                          <span className={`font-medium ${theme === "dark" && !member.ai ? "text-white" : "text-gray-800"}`}>{member.role}</span>
                          {member.ai && (
                            <span className="ml-2 text-xs text-purple-600 inline-flex items-center gap-1">
                              <Sparkles size={12} /> AI Generated
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => removeMember(member.id)} 
                          className="text-red-500 hover:text-red-700"
                          disabled={isLoading}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMember.role}
                      onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                      placeholder="Role (e.g., Developer)"
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                        theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                      }`}
                      disabled={isLoading}
                    />
                    <button 
                      onClick={addMember} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Top Features/Tasks */}
              {features.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      <FileText size={20} />
                      Top Tasks / Features
                    </h3>
                  </div>
                  
                  <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                    {features.map(feature => (
                      <div key={feature.id} className={`p-3 rounded-lg ${
                        feature.ai ? 'bg-purple-50 border border-purple-200' : theme === "dark" ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className={`font-medium mb-1 ${theme === "dark" && !feature.ai ? "text-white" : "text-gray-800"}`}>
                              {feature.title}
                              {feature.ai && (
                                <span className="ml-2 text-xs text-purple-600 inline-flex items-center gap-1">
                                  <Sparkles size={12} /> AI Generated
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={() => removeFeature(feature.id)} 
                            className="text-red-500 hover:text-red-700 ml-2"
                            disabled={isLoading}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature.title}
                      onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                      placeholder="Feature title"
                      className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                        theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                      }`}
                      disabled={isLoading}
                    />
                    <button 
                      onClick={addFeature} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Project Goals */}
              {goals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      <Target size={20} />
                      Project Goals
                    </h3>
                  </div>
                  
                  <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                    {goals.map(goal => (
                      <div key={goal.id} className={`p-3 rounded-lg ${
                        goal.ai ? 'bg-purple-50 border border-purple-200' : theme === "dark" ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className={`font-medium ${theme === "dark" && !goal.ai ? "text-white" : "text-gray-800"}`}>
                              {goal.title}
                              {goal.ai && (
                                <span className="ml-2 text-xs text-purple-600 inline-flex items-center gap-1">
                                  <Sparkles size={12} /> AI Generated
                                </span>
                              )}
                            </div>
                            {goal.role && (
                              <div className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                Role: {goal.role}
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={() => removeGoal(goal.id)} 
                            className="text-red-500 hover:text-red-700 ml-2"
                            disabled={isLoading}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      placeholder="Goal title"
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${
                        theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                      }`}
                      disabled={isLoading}
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGoal.role}
                        onChange={(e) => setNewGoal({ ...newGoal, role: e.target.value })}
                        placeholder="Assigned role (optional)"
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                          theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                        }`}
                        disabled={isLoading}
                      />
                      <button 
                        onClick={addGoal} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {timeline.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      <Calendar size={20} />
                      Project Timeline
                    </h3>
                  </div>
                  
                  <div className="space-y-3 mb-3 max-h-80 overflow-y-auto">
                    {timeline.map(week => (
                      <div key={week.id} className={`p-4 rounded-lg ${
                        week.ai ? 'bg-purple-50 border border-purple-200' : theme === "dark" ? 'bg-gray-900' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`font-semibold flex items-center gap-2 ${theme === "dark" && !week.ai ? "text-white" : "text-gray-800"}`}>
                            Week {week.week_number}
                            {week.ai && (
                              <span className="text-xs text-purple-600 inline-flex items-center gap-1">
                                <Sparkles size={12} /> AI Generated
                              </span>
                            )}
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {week.goals.map((goal, idx) => (
                            <div key={idx} className={`flex items-start justify-between p-2 rounded ${
                              theme === "dark" ? "bg-gray-800" : "bg-white"
                            }`}>
                              <span className={`text-sm flex-1 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{goal}</span>
                              <button
                                onClick={() => removeTimelineGoal(week.id, idx)}
                                className="text-red-500 hover:text-red-700 ml-2"
                                disabled={isLoading}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`space-y-2 border-t pt-4 ${theme === "dark" ? "border-gray-700" : ""}`}>
                    <div className="flex gap-2 items-center">
                      <label className={`text-sm font-medium w-20 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Week:</label>
                      <input
                        type="number"
                        min="1"
                        value={newTimelineWeek.week_number}
                        onChange={(e) => setNewTimelineWeek({ ...newTimelineWeek, week_number: parseInt(e.target.value) || 1 })}
                        className={`w-24 px-3 py-2 border rounded-lg text-sm ${
                          theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTimelineWeek.goal}
                        onChange={(e) => setNewTimelineWeek({ ...newTimelineWeek, goal: e.target.value })}
                        placeholder="Goal/Task for this week"
                        className={`flex-1 px-3 py-2 border rounded-lg text-sm ${
                          theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                        }`}
                        disabled={isLoading}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTimelineWeek();
                          }
                        }}
                      />
                      <button 
                        onClick={addTimelineWeek} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={`flex justify-between pt-4 border-t ${theme === "dark" ? "border-gray-700" : ""}`}>
                <button
                  onClick={skipReviewEdit}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip
                </button>
                <button
                  onClick={generateBacklogAndSave}
                  disabled={isLoading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <LoadingSpinner className="text-white" />
                  ) : (
                    <>
                      Generate Backlog
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Backlog (Epic, Sub Epic, User Story) */}
          {currentStep === 'backlog' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Backlog generated successfully! Review and assign user stories.
                </p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Project Backlog</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const title = prompt('Enter epic title:');
                      const description = prompt('Enter epic description:');
                      if (title) {
                        createEpic({ title, description: description || '' });
                      }
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Epic
                  </button>
                <button
                  onClick={refreshBacklog}
                  disabled={isLoading}
                  className="px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                </div>
              </div>

              {/* Epics, Sub Epics, and User Stories */}
              <div className="space-y-4">
                {epics.map(epic => (
                  <div key={epic.id} className={`border rounded-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                    {/* Epic Header */}
                    <div
                      onClick={() => toggleEpic(epic.id)}
                      className={`p-4 cursor-pointer hover:bg-opacity-80 transition-colors ${
                        epic.ai ? 'bg-purple-50' : theme === "dark" ? 'bg-gray-800' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">EPIC</span>
                            <h3 className={`font-bold text-lg ${theme === "dark" && !epic.ai ? "text-white" : "text-gray-800"}`}>
                              {epic.title}
                            </h3>
                            {epic.ai && (
                              <span className="text-xs text-purple-600 inline-flex items-center gap-1">
                                <Sparkles size={12} /> AI
                              </span>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            {epic.description}
                          </p>
                        </div>
                        <div className={`text-2xl ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                          {expandedEpics.has(epic.id) ? '−' : '+'}
                        </div>
                      </div>
                    </div>

                    {/* Sub Epics */}
                    {expandedEpics.has(epic.id) && (
                      <div className={`p-4 space-y-3 ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
                        {subEpics.filter(se => se.epic_id === epic.id).map(subEpic => (
                          <div key={subEpic.id} className={`border rounded-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                            {/* Sub Epic Header */}
                            <div
                              onClick={() => toggleSubEpic(subEpic.id)}
                              className={`p-3 cursor-pointer hover:bg-opacity-80 transition-colors ${
                                subEpic.ai ? 'bg-purple-50' : theme === "dark" ? 'bg-gray-800' : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">SUB-EPIC</span>
                                    <h4 className={`font-semibold ${theme === "dark" && !subEpic.ai ? "text-white" : "text-gray-800"}`}>
                                      {subEpic.title}
                                    </h4>
                                    {subEpic.ai && (
                                      <span className="text-xs text-purple-600 inline-flex items-center gap-1">
                                        <Sparkles size={12} /> AI
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className={`text-xl ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                  {expandedSubEpics.has(subEpic.id) ? '−' : '+'}
                                </div>
                              </div>
                            </div>

                            {/* User Stories */}
                            {expandedSubEpics.has(subEpic.id) && (
                              <div className={`p-3 space-y-2 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                                {userStories.filter(us => us.sub_epic_id === subEpic.id).map(story => (
                                  <div key={story.id} className={`border rounded-lg p-3 ${
                                    story.ai ? 'bg-purple-50 border-purple-200' : theme === "dark" ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                  }`}>
                                    <div className="flex items-start gap-2 mb-2">
                                      <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded whitespace-nowrap">USER STORY</span>
                                      <div className="flex-1">
                                        <p className={`font-medium ${theme === "dark" && !story.ai ? "text-white" : "text-gray-800"}`}>
                                          {story.title}
                                        </p>
                                        {story.ai && (
                                          <span className="text-xs text-purple-600 inline-flex items-center gap-1 mt-1">
                                            <Sparkles size={12} /> AI Generated
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Tasks under this user story */}
                                    <div className="mt-3 space-y-2">
                                      {tasks.filter(task => task.user_story_id === story.id).map(task => (
                                        <div key={task.id} className={`border rounded-lg p-2 ${
                                          task.ai ? 'bg-blue-50 border-blue-200' : theme === "dark" ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                                        }`}>
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">TASK</span>
                                                <p className={`text-sm font-medium ${theme === "dark" && !task.ai ? "text-white" : "text-gray-800"}`}>
                                                  {task.title}
                                                </p>
                                                {task.ai && (
                                                  <span className="text-xs text-blue-600 inline-flex items-center gap-1">
                                                    <Sparkles size={10} /> AI
                                                  </span>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                  Status: {task.status}
                                                </span>
                                                {task.assignee && (
                                                  <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                                    Assigned to: {task.assignee.user_name}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                      <select
                                                value={task.assignee?.id || ''}
                                                onChange={(e) => updateTaskAssignment(task.id, e.target.value || null)}
                                                className={`text-xs px-2 py-1 border rounded ${
                                                  theme === "dark" ? "bg-gray-800 border-gray-600 text-white" : "border-gray-300"
                                        }`}
                                        disabled={isLoading}
                                      >
                                        <option value="">Unassigned</option>
                                        {members.map(member => (
                                                  <option key={member.id} value={member.id}>
                                            {member.role}
                                          </option>
                                        ))}
                                      </select>
                                              <button
                                                onClick={() => deleteTask(task.id)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                                disabled={isLoading}
                                              >
                                                <X size={12} />
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                      
                                      {/* Add new task button */}
                                      <button
                                        onClick={() => {
                                          const taskTitle = prompt('Enter task title:');
                                          if (taskTitle) {
                                            createTask({
                                              user_story_id: story.id,
                                              title: taskTitle,
                                              status: 'pending'
                                            });
                                          }
                                        }}
                                        className={`w-full text-xs px-3 py-2 border-2 border-dashed rounded-lg ${
                                          theme === "dark" ? "border-gray-600 text-gray-400 hover:border-gray-500" : "border-gray-300 text-gray-600 hover:border-gray-400"
                                        }`}
                                        disabled={isLoading}
                                      >
                                        + Add Task
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {userStories.filter(us => us.sub_epic_id === subEpic.id).length === 0 && (
                                  <p className={`text-sm text-center py-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                    No user stories in this sub-epic
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {subEpics.filter(se => se.epic_id === epic.id).length === 0 && (
                          <p className={`text-sm text-center py-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            No sub-epics in this epic
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {epics.length === 0 && (
                  <div className={`text-center py-8 border rounded-lg ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                    <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      No backlog items generated yet. Click "Refresh" to generate the backlog.
                    </p>
                  </div>
                )}
              </div>

              <div className={`flex justify-between pt-4 border-t ${theme === "dark" ? "border-gray-700" : ""}`}>
                <button
                  onClick={skipGenerateBacklog}
                  disabled={isLoading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip
                  </button>
                  <button
                    onClick={() => setCurrentStep('invite')}
                    disabled={isLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next: Invite Team
                    <ArrowRight size={20} />
                  </button>
              </div>
            </div>
          )}

          {/* STEP 6: Invite Developers */}
          {currentStep === 'invite' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <Mail size={16} className="text-blue-600" />
                  Invite team members to collaborate on this project
                </p>
              </div>

              <div>
                <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                  <Users size={24} />
                  Invite Team Members
                </h2>

                {/* Invitation List */}
                <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                  {invitations.map(invitation => (
                    <div key={invitation.id} className={`flex items-center justify-between p-4 rounded-lg border ${
                      invitation.sent 
                        ? 'bg-green-50 border-green-200' 
                        : theme === "dark" ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className={invitation.sent ? "text-green-600" : theme === "dark" ? "text-gray-400" : "text-gray-600"} />
                          <span className={`font-medium ${theme === "dark" && !invitation.sent ? "text-white" : "text-gray-800"}`}>
                            {invitation.email}
                          </span>
                        </div>
                        <div className={`text-sm mt-1 flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          <span className="font-semibold">Role:</span>
                          <span>{invitation.role}</span>
                        </div>
                        {invitation.sent && (
                          <span className="text-xs text-green-600 mt-1 inline-flex items-center gap-1">
                            <Check size={12} /> Invitation Sent
                          </span>
                        )}
                      </div>
                      {!invitation.sent && (
                        <button
                          onClick={() => removeInvitation(invitation.id)}
                          className="text-red-500 hover:text-red-700 ml-4"
                          disabled={isLoading}
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  ))}

                  {invitations.length === 0 && (
                    <div className={`text-center py-8 border-2 border-dashed rounded-lg ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}>
                      <Mail size={48} className={`mx-auto mb-2 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
                      <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        No invitations added yet
                      </p>
                    </div>
                  )}
                </div>

                {/* Add Invitation Form */}
                <div className={`border-t pt-4 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                    Add New Invitation
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={newInvitation.email}
                        onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                        placeholder="developer@example.com"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                        Role *
                      </label>
                      <select
                        value={newInvitation.role}
                        onChange={(e) => setNewInvitation({ ...newInvitation, role: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                        }`}
                        disabled={isLoading}
                      >
                        <option value="">Select a role</option>
                        {members.map(member => (
                          <option key={member.id} value={member.role}>
                            {member.role}
                          </option>
                        ))}
                        <option value="Frontend Developer">Frontend Developer</option>
                        <option value="Backend Developer">Backend Developer</option>
                        <option value="Full Stack Developer">Full Stack Developer</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="QA Engineer">QA Engineer</option>
                        <option value="DevOps Engineer">DevOps Engineer</option>
                      </select>
                    </div>
                    <button
                      onClick={addInvitation}
                      disabled={!newInvitation.email || !newInvitation.role || isLoading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add Invitation
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex justify-between pt-4 border-t ${theme === "dark" ? "border-gray-700" : ""}`}>
                <button
                  onClick={() => {
                    alert('Project created successfully!');
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Skip & Finish
                </button>
                <button
                  onClick={sendInvitations}
                  disabled={invitations.length === 0 || isLoading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Save & Send Invitations
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
    </div>
    </div>
  );
};

export default App;