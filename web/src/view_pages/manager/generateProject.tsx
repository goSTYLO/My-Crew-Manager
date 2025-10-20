import React, { useState } from 'react';
import { Upload, Users, Target, FileText, Plus, X, Sparkles, Check, ArrowRight, Calendar } from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";
import Sidebar from "../../components/sidebarLayout";
import { useTheme } from "../../components/themeContext"; // <-- import ThemeContext

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

type Step = 'create' | 'upload' | 'analyze' | 'review' | 'backlog';

const App: React.FC = () => {
  const { theme } = useTheme(); // <-- use theme
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
        
        // Test 1: Try with credentials (session/cookie auth)
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
        
        // Test 2: Try Bearer token
        const bearerTest = await fetch(`${API_BASE_URL}/api/ai/projects/`, {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include',
        });
        
        if (bearerTest.ok) {
          console.log('✅ Using Bearer token authentication');
          setAuthFormat('Bearer');
          return;
        }
        
        // Test 3: Try Token auth
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
    if (!projectTitle || !projectSummary) {
      alert('Please fill in project title and summary');
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
        summary: projectSummary,
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

      alert('Project created successfully with backlog!');
      setCurrentStep('backlog');
      
      // Reset form after success
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Error generating backlog:', error);
      alert(`Failed to generate backlog: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      // Check if week already exists
      const existingWeek = timeline.find(w => w.week_number === newTimelineWeek.week_number);
      
      if (existingWeek) {
        // Add goal to existing week
        const updatedTimeline = timeline.map(w => 
          w.week_number === newTimelineWeek.week_number
            ? { ...w, goals: [...w.goals, newTimelineWeek.goal] }
            : w
        );
        setTimeline(updatedTimeline);
      } else {
        // Create new week
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
    }).filter(week => week.goals.length > 0); // Remove empty weeks
    
    setTimeline(updatedTimeline);
  };

  const removeMember = (id: string) => setMembers(members.filter(m => m.id !== id));
  const removeFeature = (id: string) => setFeatures(features.filter(f => f.id !== id));
  const removeGoal = (id: string) => setGoals(goals.filter(g => g.id !== id));

  // Step indicator component
  const StepIndicator = () => {
    const steps = [
      { key: 'create', label: 'Create Project', completed: ['upload', 'analyze', 'review', 'backlog'].includes(currentStep) },
      { key: 'upload', label: 'Upload Proposal', completed: ['analyze', 'review', 'backlog'].includes(currentStep) },
      { key: 'analyze', label: 'AI Analysis', completed: ['review', 'backlog'].includes(currentStep) },
      { key: 'review', label: 'Review & Edit', completed: currentStep === 'backlog' },
      { key: 'backlog', label: 'Generate Backlog', completed: false },
    ];

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.key}>
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step.completed ? 'bg-green-500' : currentStep === step.key ? 'bg-blue-500' : theme === "dark" ? 'bg-gray-600' : 'bg-gray-300'
              } text-white font-semibold text-sm`}>
                {step.completed ? <Check size={16} /> : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step.key ? 'text-blue-600' : theme === "dark" ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
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
     {/* Sidebar */}
     <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

    {/* Main Content Area */}
    <div className="flex-1 flex flex-col">
      {/* Top Navbar */}
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
      <div className="max-w-4xl mx-auto">
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
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Project Summary *</label>
                <textarea
                  value={projectSummary}
                  onChange={(e) => setProjectSummary(e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"
                  }`}
                  placeholder="Describe your project"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={createProject}
                  disabled={!projectTitle || !projectSummary || isLoading}
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
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Upload Proposal (PDF) *</label>
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

              <div className="flex justify-end">
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 text-sm flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  Proposal uploaded successfully! Ready for AI analysis.
                </p>
              </div>

              <div className="text-center py-8">
                <Sparkles size={48} className="mx-auto text-blue-500 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Ready to Analyze</h3>
                <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Our AI will analyze your proposal and generate project roles, features, goals, and timeline.
                </p>

                <button
                  onClick={analyzeProposal}
                  disabled={isLoading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Analyze with AI
                    </>
                  )}
                </button>
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

              {/* Project Roles */}
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

              {/* Top Features/Tasks */}
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

              {/* Project Goals */}
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

              {/* Timeline */}
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

              <div className={`flex justify-end pt-4 border-t ${theme === "dark" ? "border-gray-700" : ""}`}>
                <button
                  onClick={generateBacklogAndSave}
                  disabled={isLoading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Generating Backlog...
                    </>
                  ) : (
                    <>
                      Generate Backlog & Save
                      <Check size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success */}
          {currentStep === 'backlog' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Success!</h3>
              <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Your project has been created with a complete backlog.
              </p>
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Another Project
              </button>
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