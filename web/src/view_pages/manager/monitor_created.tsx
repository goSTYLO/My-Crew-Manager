import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Send, X, BarChart3, Users, FileText, Target, CheckCircle, Clock, RefreshCw, ArrowLeft, GitBranch, Save, Camera } from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";
import Sidebar from "../../components/sidebarLayout";
import { useTheme } from "../../components/themeContext";

export default function ProjectDetailsUI() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('monitoring');
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  const [projectData, setProjectData] = useState({
    id: 1,
    title: 'Finder 4 — Lost & Found Tracker',
    aiSummary: 'A comprehensive mobile application project focused on creating an intuitive user experience with modern design principles and seamless functionality.',
    roles: ['UI/UX Designer', 'Frontend Developer', 'Backend Developer', 'QA Engineer'],
    features: ['User Authentication', 'Dashboard Analytics', 'Real-time Notifications', 'Data Visualization'],
    goals: ['Launch MVP by Q2 2025', 'Achieve 10k+ active users', 'Maintain 99.9% uptime', 'Implement AI-powered features'],
    timeline: [
      { week: 'Week 1', tasks: ['Project kickoff', 'Requirements gathering', 'Initial wireframes', 'Tech stack selection'] },
      { week: 'Week 2', tasks: ['Database design', 'API architecture', 'UI mockups', 'Development environment setup'] }
    ]
  });

  const [backlog, setBacklog] = useState({
    epics: [
      {
        id: 1,
        name: 'User Management System',
        subEpics: [
          {
            id: 1,
            name: 'Authentication',
            userStories: [
              {
                id: 1,
                story: 'As a user, I want to register with email',
                tasks: ['Create registration form', 'Setup email validation', 'Database integration']
              }
            ]
          }
        ]
      }
    ]
  });

  const [members, setMembers] = useState([
    { id: 1, name: 'Randal Phuta', email: 'randal@example.com', position: 'Project Manager' },
    { id: 2, name: 'Sarah Chen', email: 'sarah@example.com', position: 'Frontend Developer' }
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
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You are not authenticated. Please log in.');
          return;
        }
  
        const response = await fetch('http://localhost:8000/api/ai/invitations/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_id: projectData.id,
            invitee_email: inviteForm.email,
            position: inviteForm.position,
            message: `You have been invited to join the project "${projectData.title}" as ${inviteForm.position}.`,
          }),
        });
  
        if (response.ok) {
          const data = await response.json();
          alert('Invitation sent successfully!');
          setInviteForm({ email: '', position: '' });
          setShowInviteModal(false);
        } else {
          const errorData = await response.json();
          alert(`Failed to send invitation: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error sending invitation:', error);
        alert('An error occurred while sending the invitation. Please try again.');
      }
    } else {
      alert('Please fill out both email and position fields.');
    }
  };

  const handleEditMember = (updatedMember) => {
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

  const openEditMember = (member) => {
    setEditingMember({ ...member });
    setShowEditMemberModal(true);
  };

  const handleAddRepo = () => {
    if (repoForm.name && repoForm.url) {
      if (editingRepo) {
        setRepositories(repositories.map(r => r.id === editingRepo.id ? { ...repoForm, id: editingRepo.id } : r));
      } else {
        setRepositories([...repositories, { ...repoForm, id: Date.now() }]);
      }
      setRepoForm({ name: '', url: '', branch: 'main', assignedTo: '' });
      setShowRepoModal(false);
      setEditingRepo(null);
    }
  };

  const openEditRepo = (repo) => {
    setEditingRepo(repo);
    setRepoForm({ name: repo.name, url: repo.url, branch: repo.branch, assignedTo: repo.assignedTo });
    setShowRepoModal(true);
  };

  const deleteRepo = (repoId) => {
    setRepositories(repositories.filter(r => r.id !== repoId));
  };

  const addNewEpic = () => {
    const newEpic = {
      id: Date.now(),
      name: 'New Epic',
      subEpics: []
    };
    setBacklog({ ...backlog, epics: [...backlog.epics, newEpic] });
  };

  const addSubEpic = (epicId) => {
    const updatedEpics = backlog.epics.map(epic => {
      if (epic.id === epicId) {
        return {
          ...epic,
          subEpics: [...epic.subEpics, { id: Date.now(), name: 'New Sub-Epic', userStories: [] }]
        };
      }
      return epic;
    });
    setBacklog({ ...backlog, epics: updatedEpics });
  };

  const addUserStory = (epicId, subEpicId) => {
    const updatedEpics = backlog.epics.map(epic => {
      if (epic.id === epicId) {
        return {
          ...epic,
          subEpics: epic.subEpics.map(subEpic => {
            if (subEpic.id === subEpicId) {
              return {
                ...subEpic,
                userStories: [...subEpic.userStories, { id: Date.now(), story: 'New User Story', tasks: [] }]
              };
            }
            return subEpic;
          })
        };
      }
      return epic;
    });
    setBacklog({ ...backlog, epics: updatedEpics });
  };

  const addTask = (epicId, subEpicId, storyId) => {
    const updatedEpics = backlog.epics.map(epic => {
      if (epic.id === epicId) {
        return {
          ...epic,
          subEpics: epic.subEpics.map(subEpic => {
            if (subEpic.id === subEpicId) {
              return {
                ...subEpic,
                userStories: subEpic.userStories.map(story => {
                  if (story.id === storyId) {
                    return { ...story, tasks: [...story.tasks, 'New Task'] };
                  }
                  return story;
                })
              };
            }
            return subEpic;
          })
        };
      }
      return epic;
    });
    setBacklog({ ...backlog, epics: updatedEpics });
  };

  const addRole = () => {
    setProjectData({ ...projectData, roles: [...projectData.roles, 'New Role'] });
  };

  const addFeature = () => {
    setProjectData({ ...projectData, features: [...projectData.features, 'New Feature'] });
  };

  const addGoal = () => {
    setProjectData({ ...projectData, goals: [...projectData.goals, 'New Goal'] });
  };

  const addWeek = () => {
    const newWeekNumber = projectData.timeline.length + 1;
    setProjectData({
      ...projectData,
      timeline: [...projectData.timeline, { week: `Week ${newWeekNumber}`, tasks: [] }]
    });
  };

  const addTimelineTask = (weekIndex) => {
    const updatedTimeline = projectData.timeline.map((week, idx) => {
      if (idx === weekIndex) {
        return { ...week, tasks: [...week.tasks, 'New Task'] };
      }
      return week;
    });
    setProjectData({ ...projectData, timeline: updatedTimeline });
  };

  const deleteEpic = (epicId) => {
    setBacklog({ ...backlog, epics: backlog.epics.filter(e => e.id !== epicId) });
  };

  const deleteSubEpic = (epicId, subEpicId) => {
    const updatedEpics = backlog.epics.map(epic => {
      if (epic.id === epicId) {
        return { ...epic, subEpics: epic.subEpics.filter(se => se.id !== subEpicId) };
      }
      return epic;
    });
    setBacklog({ ...backlog, epics: updatedEpics });
  };

  const deleteUserStory = (epicId, subEpicId, storyId) => {
    const updatedEpics = backlog.epics.map(epic => {
      if (epic.id === epicId) {
        return {
          ...epic,
          subEpics: epic.subEpics.map(subEpic => {
            if (subEpic.id === subEpicId) {
              return { ...subEpic, userStories: subEpic.userStories.filter(s => s.id !== storyId) };
            }
            return subEpic;
          })
        };
      }
      return epic;
    });
    setBacklog({ ...backlog, epics: updatedEpics });
  };

  const deleteTask = (epicId, subEpicId, storyId, taskIndex) => {
    const updatedEpics = backlog.epics.map(epic => {
      if (epic.id === epicId) {
        return {
          ...epic,
          subEpics: epic.subEpics.map(subEpic => {
            if (subEpic.id === subEpicId) {
              return {
                ...subEpic,
                userStories: subEpic.userStories.map(story => {
                  if (story.id === storyId) {
                    return { ...story, tasks: story.tasks.filter((_, idx) => idx !== taskIndex) };
                  }
                  return story;
                })
              };
            }
            return subEpic;
          })
        };
      }
      return epic;
    });
    setBacklog({ ...backlog, epics: updatedEpics });
  };

  const deleteRole = (index) => {
    setProjectData({ ...projectData, roles: projectData.roles.filter((_, idx) => idx !== index) });
  };

  const deleteFeature = (index) => {
    setProjectData({ ...projectData, features: projectData.features.filter((_, idx) => idx !== index) });
  };

  const deleteGoal = (index) => {
    setProjectData({ ...projectData, goals: projectData.goals.filter((_, idx) => idx !== index) });
  };

  const deleteTimelineTask = (weekIndex, taskIndex) => {
    const updatedTimeline = projectData.timeline.map((week, wIdx) => {
      if (wIdx === weekIndex) {
        return { ...week, tasks: week.tasks.filter((_, tIdx) => tIdx !== taskIndex) };
      }
      return week;
    });
    setProjectData({ ...projectData, timeline: updatedTimeline });
  };

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
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-xl shadow-sm p-6 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-300 mb-1">Total Completed</p>
                        <p className="text-4xl font-bold text-green-700 dark:text-green-200">45</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">+8 from last week</p>
                      </div>
                      <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl shadow-sm p-6 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-300 mb-1">In Progress</p>
                        <p className="text-4xl font-bold text-blue-700 dark:text-blue-200">10</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Active tasks</p>
                      </div>
                      <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <RefreshCw className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-xl shadow-sm p-6 border border-orange-200 dark:border-orange-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-300 mb-1">Pending</p>
                        <p className="text-4xl font-bold text-orange-700 dark:text-orange-200">2</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Awaiting start</p>
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
                    <button
                      onClick={() => setIsEditingOverview(!isEditingOverview)}
                      className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center font-medium"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {isEditingOverview ? 'Done Editing' : 'Edit'}
                    </button>
                  </div>

                  <div className="p-6 space-y-8">
                    {/* AI Summary */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center`}>
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </div>
                        AI Summary
                      </h3>
                      {isEditingOverview ? (
                        <textarea
                          value={projectData.aiSummary}
                          onChange={(e) => setProjectData({ ...projectData, aiSummary: e.target.value })}
                          className={`w-full p-4 border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow`}
                          rows="3"
                        />
                      ) : (
                        <p className={`${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-50'} leading-relaxed p-4 rounded-lg`}>{projectData.aiSummary}</p>
                      )}
                    </div>

                    {/* Project Roles */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                        </div>
                        Project Roles
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projectData.roles.map((role, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme === 'dark' ? 'from-blue-900 to-indigo-900 border-blue-800' : 'from-blue-50 to-indigo-50 border-blue-100'} rounded-lg border hover:shadow-md transition-shadow`}>
                            {isEditingOverview ? (
                              <input
                                type="text"
                                value={role}
                                onChange={(e) => {
                                  const newRoles = [...projectData.roles];
                                  newRoles[idx] = e.target.value;
                                  setProjectData({ ...projectData, roles: newRoles });
                                }}
                                className={`${theme === 'dark' ? 'text-gray-200 border-blue-400' : 'text-gray-700 border-blue-300'} font-medium bg-transparent border-b focus:outline-none focus:border-blue-500 flex-1`}
                              />
                            ) : (
                              <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{role}</span>
                            )}
                            {isEditingOverview && (
                              <button 
                                onClick={() => deleteRole(idx)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={addRole} className={`p-4 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'} rounded-lg transition-all`}>
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Top Features */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3">
                          <Target className="w-4 h-4 text-green-600 dark:text-green-300" />
                        </div>
                        Top Features
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projectData.features.map((feature, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme === 'dark' ? 'from-green-900 to-emerald-900 border-green-800' : 'from-green-50 to-emerald-50 border-green-100'} rounded-lg border hover:shadow-md transition-shadow`}>
                            {isEditingOverview ? (
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => {
                                  const newFeatures = [...projectData.features];
                                  newFeatures[idx] = e.target.value;
                                  setProjectData({ ...projectData, features: newFeatures });
                                }}
                                className={`${theme === 'dark' ? 'text-gray-200 border-green-400' : 'text-gray-700 border-green-300'} font-medium bg-transparent border-b focus:outline-none focus:border-green-500 flex-1`}
                              />
                            ) : (
                              <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{feature}</span>
                            )}
                            {isEditingOverview && (
                              <button 
                                onClick={() => deleteFeature(idx)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={addFeature} className={`p-4 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-400 hover:bg-green-900' : 'border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 hover:bg-green-50'} rounded-lg transition-all`}>
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project Goals */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="w-4 h-4 text-orange-600 dark:text-orange-300" />
                        </div>
                        Project Goals
                      </h3>
                      <div className="space-y-3">
                        {projectData.goals.map((goal, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-4 bg-gradient-to-r ${theme === 'dark' ? 'from-purple-900 to-pink-900 border-purple-800' : 'from-purple-50 to-pink-50 border-purple-100'} rounded-lg border hover:shadow-md transition-shadow`}>
                            <div className="flex items-center flex-1">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {idx + 1}
                              </div>
                              {isEditingOverview ? (
                                <input
                                  type="text"
                                  value={goal}
                                  onChange={(e) => {
                                    const newGoals = [...projectData.goals];
                                    newGoals[idx] = e.target.value;
                                    setProjectData({ ...projectData, goals: newGoals });
                                  }}
                                  className={`${theme === 'dark' ? 'text-gray-200 border-purple-400' : 'text-gray-700 border-purple-300'} font-medium bg-transparent border-b focus:outline-none focus:border-purple-500 flex-1`}
                                />
                              ) : (
                                <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium`}>{goal}</span>
                              )}
                            </div>
                            {isEditingOverview && (
                              <button 
                                onClick={() => deleteGoal(idx)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={addGoal} className={`w-full p-4 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400 hover:bg-purple-900' : 'border-gray-300 text-gray-500 hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50'} rounded-lg transition-all`}>
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project Timeline */}
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3">
                          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        </div>
                        Project Timeline
                      </h3>
                      <div className="space-y-4">
                        {projectData.timeline.map((week, idx) => (
                          <div key={idx} className={`border ${theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white'} rounded-xl p-5 hover:shadow-md transition-shadow`}>
                            <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 flex items-center`}>
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                {idx + 1}
                              </div>
                              {week.week}
                            </h4>
                            <div className="space-y-2 ml-8">
                              {week.tasks.map((task, taskIdx) => (
                                <div key={taskIdx} className={`flex items-center justify-between p-3 ${theme === 'dark' ? 'bg-gray-600 border-gray-500 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'} rounded-lg border transition-colors`}>
                                  {isEditingOverview ? (
                                    <input
                                      type="text"
                                      value={task}
                                      onChange={(e) => {
                                        const updatedTimeline = projectData.timeline.map((w, wIdx) => {
                                          if (wIdx === idx) {
                                            const newTasks = [...w.tasks];
                                            newTasks[taskIdx] = e.target.value;
                                            return { ...w, tasks: newTasks };
                                          }
                                          return w;
                                        });
                                        setProjectData({ ...projectData, timeline: updatedTimeline });
                                      }}
                                      className={`${theme === 'dark' ? 'text-gray-200 border-blue-400' : 'text-gray-700 border-blue-300'} bg-transparent border-b focus:outline-none focus:border-blue-500 flex-1`}
                                    />
                                  ) : (
                                    <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{task}</span>
                                  )}
                                  {isEditingOverview && (
                                    <button 
                                      onClick={() => deleteTimelineTask(idx, taskIdx)}
                                      className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-2"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {isEditingOverview && (
                                <button onClick={() => addTimelineTask(idx)} className={`w-full p-3 border border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'} rounded-lg text-sm transition-all`}>
                                  + Add Task
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button onClick={addWeek} className={`w-full p-5 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'} rounded-xl transition-all`}>
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
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Generated Backlog</h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Manage epics, user stories, and tasks</p>
                  </div>
                  <button
                    onClick={addNewEpic}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Epic
                  </button>
                </div>

                {backlog.epics.map((epic) => (
                  <div key={epic.id} className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border overflow-hidden`}>
                    <div className={`bg-gradient-to-r from-red-50 to-pink-50 ${theme === 'dark' ? 'dark:from-red-900 dark:to-pink-900' : ''} px-6 py-4 border-b border-red-100 dark:border-red-800`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="px-4 py-1.5 bg-red-500 text-white rounded-full text-sm font-semibold mr-4 shadow-sm">
                            Epic
                          </span>
                          <input
                            type="text"
                            value={epic.name}
                            className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} bg-transparent border-b-2 border-transparent hover:border-red-300 focus:border-red-500 focus:outline-none transition-colors flex-1`}
                            onChange={(e) => {
                              const updatedEpics = backlog.epics.map(e => 
                                e.id === epic.id ? { ...e, name: e.target.value } : e
                              );
                              setBacklog({ ...backlog, epics: updatedEpics });
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => deleteEpic(epic.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Sub-Epics */}
                      <div className="space-y-6">
                        {epic.subEpics.map((subEpic) => (
                          <div key={subEpic.id} className="border-l-4 border-orange-400 pl-6 py-2">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center flex-1">
                                <span className="px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-semibold mr-3 shadow-sm">
                                  Sub-Epic
                                </span>
                                <input
                                  type="text"
                                  value={subEpic.name}
                                  onChange={(e) => {
                                    const updatedEpics = backlog.epics.map(ep => {
                                      if (ep.id === epic.id) {
                                        return {
                                          ...ep,
                                          subEpics: ep.subEpics.map(se =>
                                            se.id === subEpic.id ? { ...se, name: e.target.value } : se
                                          )
                                        };
                                      }
                                      return ep;
                                    });
                                    setBacklog({ ...backlog, epics: updatedEpics });
                                  }}
                                  className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} bg-transparent border-b-2 border-transparent hover:border-orange-300 focus:border-orange-500 focus:outline-none transition-colors flex-1`}
                                />
                              </div>
                              <button 
                                onClick={() => deleteSubEpic(epic.id, subEpic.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* User Stories */}
                            <div className="space-y-4 ml-6">
                              {subEpic.userStories.map((story) => (
                                <div key={story.id} className="border-l-4 border-blue-400 pl-6 py-2">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center flex-1">
                                      <span className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-semibold mr-3 shadow-sm">
                                        User Story
                                      </span>
                                      <input
                                        type="text"
                                        value={story.story}
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
                                                        us.id === story.id ? { ...us, story: e.target.value } : us
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
                                        className={`flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'} bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none transition-colors`}
                                      />
                                    </div>
                                    <button 
                                      onClick={() => deleteUserStory(epic.id, subEpic.id, story.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Tasks */}
                                  <div className="space-y-2 ml-6">
                                    {story.tasks.map((task, taskIdx) => (
                                      <div key={taskIdx} className={`flex items-center justify-between p-3 bg-gradient-to-r ${theme === 'dark' ? 'from-green-900 to-emerald-900 border-green-800' : 'from-green-50 to-emerald-50 border-green-200'} rounded-lg border hover:shadow-md transition-shadow`}>
                                        <div className="flex items-center flex-1">
                                          <span className="px-2.5 py-1 bg-green-600 text-white rounded-md text-xs font-semibold mr-3 shadow-sm">
                                            Task
                                          </span>
                                          <input
                                            type="text"
                                            value={task}
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
                                                              const newTasks = [...us.tasks];
                                                              newTasks[taskIdx] = e.target.value;
                                                              return { ...us, tasks: newTasks };
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
                                            className={`bg-transparent ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} border-b-2 border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none flex-1 transition-colors`}
                                          />
                                        </div>
                                        <button 
                                          onClick={() => deleteTask(epic.id, subEpic.id, story.id, taskIdx)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 p-1.5 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                    <button onClick={() => addTask(epic.id, subEpic.id, story.id)} className={`w-full p-3 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-400 hover:bg-green-900' : 'border-gray-300 text-gray-500 hover:border-green-500 hover:text-green-500 hover:bg-green-50'} rounded-lg text-sm font-medium transition-all`}>
                                      + Add Task
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => addUserStory(epic.id, subEpic.id)} className={`px-4 py-2.5 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-900' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50'} rounded-lg text-sm font-medium transition-all`}>
                                + Add User Story
                              </button>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addSubEpic(epic.id)} className={`px-4 py-2.5 border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400 hover:border-orange-500 hover:text-orange-400 hover:bg-orange-900' : 'border-gray-300 text-gray-500 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50'} rounded-lg text-sm font-medium transition-all`}>
                          + Add Sub-Epic
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team Members Tab */}
            {activeTab === 'members' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Team Members
                    </h2>
                    <p
                      className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      } mt-1`}
                    >
                      {members.length} member{members.length !== 1 ? 's' : ''} in total
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Invite Member
                  </button>
                </div>

                {/* Members Table */}
                <div
                  className={`rounded-2xl border overflow-hidden backdrop-blur-md ${
                    theme === 'dark'
                      ? 'bg-gray-800/70 border-gray-700 shadow-xl'
                      : 'bg-white/70 border-gray-200 shadow-md'
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      {/* Table Header */}
                      <thead
                        className={`bg-gradient-to-r ${
                          theme === 'dark'
                            ? 'from-gray-700 to-gray-800'
                            : 'from-blue-50 to-indigo-50'
                        }`}
                      >
                        <tr>
                          {['Member', 'Email', 'Position', 'Actions'].map((head) => (
                            <th
                              key={head}
                              className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}
                            >
                              {head}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      {/* Table Body */}
                      <tbody
                        className={`divide-y ${
                          theme === 'dark'
                            ? 'bg-gray-800 divide-gray-700'
                            : 'bg-white divide-gray-200'
                        }`}
                      >
                        {members.map((member) => (
                          <tr
                            key={member.id}
                            className={`transition-all duration-200 ${
                              theme === 'dark'
                                ? 'hover:bg-gray-700/70'
                                : 'hover:bg-blue-50/50'
                            }`}
                          >
                            {/* Member Info */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div
                                  className={`w-11 h-11 rounded-full overflow-hidden mr-3 flex items-center justify-center shadow-md ring-2 ${
                                    theme === 'dark'
                                      ? 'bg-gray-700 ring-gray-600'
                                      : 'bg-gray-100 ring-blue-100'
                                  }`}
                                >
                                  {member.image ? (
                                    <img
                                      src={member.image}
                                      alt={member.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span
                                      className={`font-semibold text-base ${
                                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                      }`}
                                    >
                                      {member.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-sm font-semibold ${
                                    theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                                  }`}
                                >
                                  {member.name}
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div
                                className={`text-sm ${
                                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                {member.email}
                              </div>
                            </td>

                            {/* Position */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1.5 inline-flex text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900 dark:to-indigo-900 dark:text-blue-200">
                                {member.position}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => openEditMember(member)}
                                  className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all dark:bg-blue-900/40 dark:hover:bg-blue-800"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setMembers(members.filter((m) => m.id !== member.id))
                                  }
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all dark:bg-red-900/40 dark:hover:bg-red-800"
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
                    <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Git Repositories
                    </h2>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                      Manage project repositories and assignments
                    </p>
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
                    <div
                      key={repo.id}
                      className={`rounded-xl shadow-sm border p-6 transition-shadow hover:shadow-md ${
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-200'
                      }`}
                    >
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditRepo(repo)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900 p-2 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRepo(repo.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div
                          className={`flex items-center text-sm p-3 rounded-lg ${
                            theme === 'dark'
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-50 text-gray-600'
                          }`}
                        >
                          <span className="font-medium mr-2">URL:</span>
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate"
                          >
                            {repo.url}
                          </a>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                            Assigned to:
                          </span>
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              theme === 'dark'
                                ? 'bg-green-900 text-green-200'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {repo.assignedTo || 'Unassigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {repositories.length === 0 && (
                  <div
                    className={`rounded-xl shadow-sm border p-12 text-center ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700 text-gray-300'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No repositories yet</h3>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md transform transition-all scale-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={inviteForm.position}
                  onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white/70 transition-all shadow-sm"
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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg transition-all flex items-center justify-center"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md transform transition-all scale-100">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Edit Team Member</h3>
              <button
                onClick={() => {
                  setShowEditMemberModal(false);
                  setEditingMember(null);
                }}
                className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Image Upload */}
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
                        const file = e.target.files[0];
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
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 bg-white/70 transition-all shadow-sm"
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
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  placeholder="Enter email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 bg-white/70 transition-all shadow-sm"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={editingMember.position}
                  onChange={(e) => setEditingMember({ ...editingMember, position: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 bg-white/70 transition-all shadow-sm"
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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowEditMemberModal(false);
                    setEditingMember(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditMember(editingMember)}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 font-medium shadow-lg transition-all flex items-center justify-center"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md transform transition-all scale-100">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-5 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                {editingRepo ? "Edit Repository" : "Add Repository"}
              </h3>
              <button
                onClick={() => {
                  setShowRepoModal(false);
                  setEditingRepo(null);
                  setRepoForm({ name: "", url: "", branch: "main", assignedTo: "" });
                }}
                className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 bg-white/70 transition-all shadow-sm"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 bg-white/70 transition-all shadow-sm"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 bg-white/70 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assign To
                </label>
                <select
                  value={repoForm.assignedTo}
                  onChange={(e) => setRepoForm({ ...repoForm, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 bg-white/70 transition-all shadow-sm"
                >
                  <option value="">Select a team member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} - {member.position}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowRepoModal(false);
                    setEditingRepo(null);
                    setRepoForm({ name: "", url: "", branch: "main", assignedTo: "" });
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRepo}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 font-medium shadow-lg transition-all flex items-center justify-center"
                >
                  {editingRepo ? (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Update
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" /> Add Repository
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}