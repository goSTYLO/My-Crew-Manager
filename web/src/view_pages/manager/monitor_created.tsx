import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Send, X, BarChart3, Users, FileText, Target, CheckCircle, Clock, RefreshCw, ArrowLeft, Menu } from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";
import Sidebar from "../../components/sidebarLayout";

export default function ProjectDetailsUI() {
  const [activeTab, setActiveTab] = useState('monitoring');
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [projectData, setProjectData] = useState({
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

  const [inviteForm, setInviteForm] = useState({ email: '', position: '' });

  const [monitoringData] = useState({
    weeks: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    completed: [12, 18, 25, 32, 38, 45],
    inProgress: [5, 8, 6, 9, 7, 10],
    pending: [8, 6, 4, 3, 5, 2]
  });

  const handleInvite = () => {
    if (inviteForm.email && inviteForm.position) {
      setMembers([...members, { 
        id: Date.now(), 
        name: inviteForm.email.split('@')[0], 
        email: inviteForm.email, 
        position: inviteForm.position 
      }]);
      setInviteForm({ email: '', position: '' });
      setShowInviteModal(false);
    }
  };

  const addNewEpic = () => {
    const newEpic = {
      id: Date.now(),
      name: 'New Epic',
      subEpics: []
    };
    setBacklog({ ...backlog, epics: [...backlog.epics, newEpic] });
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
    <div className="flex min-h-screen w-full bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto mt-20">
          {/* Header Section */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <div className="w-full mx-auto">
              <button
                onClick={() => window.history.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4 group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to Projects</span>
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{projectData.title}</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage your project details, team, and progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-8 overflow-x-auto">
                {[
                  { id: 'monitoring', icon: BarChart3, label: 'Monitoring' },
                  { id: 'overview', icon: FileText, label: 'Overview' },
                  { id: 'backlog', icon: Target, label: 'Backlog' },
                  { id: 'members', icon: Users, label: 'Team' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 mb-1">Total Completed</p>
                        <p className="text-4xl font-bold text-green-700">45</p>
                        <p className="text-xs text-green-600 mt-1">+8 from last week</p>
                      </div>
                      <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">In Progress</p>
                        <p className="text-4xl font-bold text-blue-700">10</p>
                        <p className="text-xs text-blue-600 mt-1">Active tasks</p>
                      </div>
                      <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <RefreshCw className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm p-6 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-1">Pending</p>
                        <p className="text-4xl font-bold text-orange-700">2</p>
                        <p className="text-xs text-orange-600 mt-1">Awaiting start</p>
                      </div>
                      <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Clock className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Task Progress Over Time</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Completed</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">In Progress</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Pending</span>
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
                      
                      <line x1="50" y1="20" x2="50" y2="260" stroke="#d1d5db" strokeWidth="2" />
                      <line x1="50" y1="260" x2="750" y2="260" stroke="#d1d5db" strokeWidth="2" />
                      
                      {[0, 10, 20, 30, 40, 50].map((val, i) => (
                        <g key={i}>
                          <text x="30" y={260 - (i * 48) + 4} fontSize="12" fill="#6b7280" textAnchor="end" fontWeight="500">
                            {val}
                          </text>
                          <line
                            x1="50"
                            y1={260 - (i * 48)}
                            x2="750"
                            y2={260 - (i * 48)}
                            stroke="#f3f4f6"
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
                              fill="#6b7280"
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">{projectData.title}</h2>
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
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        AI Summary
                      </h3>
                      {isEditingOverview ? (
                        <textarea
                          value={projectData.aiSummary}
                          onChange={(e) => setProjectData({ ...projectData, aiSummary: e.target.value })}
                          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                          rows="3"
                        />
                      ) : (
                        <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg">{projectData.aiSummary}</p>
                      )}
                    </div>

                    {/* Project Roles */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        Project Roles
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {projectData.roles.map((role, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                            <span className="text-gray-700 font-medium">{role}</span>
                            {isEditingOverview && (
                              <button 
                                onClick={() => deleteRole(idx)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Top Features */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <Target className="w-4 h-4 text-green-600" />
                        </div>
                        Top Features
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projectData.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                            <span className="text-gray-700 font-medium">{feature}</span>
                            {isEditingOverview && (
                              <button 
                                onClick={() => deleteFeature(idx)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all">
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project Goals */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                          <CheckCircle className="w-4 h-4 text-orange-600" />
                        </div>
                        Project Goals
                      </h3>
                      <div className="space-y-3">
                        {projectData.goals.map((goal, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                                {idx + 1}
                              </div>
                              <span className="text-gray-700 font-medium">{goal}</span>
                            </div>
                            {isEditingOverview && (
                              <button 
                                onClick={() => deleteGoal(idx)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-500 hover:bg-purple-50 transition-all">
                            <Plus className="w-5 h-5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Project Timeline */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        Project Timeline
                      </h3>
                      <div className="space-y-4">
                        {projectData.timeline.map((week, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                {idx + 1}
                              </div>
                              {week.week}
                            </h4>
                            <div className="space-y-2 ml-8">
                              {week.tasks.map((task, taskIdx) => (
                                <div key={taskIdx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                  <span className="text-gray-700">{task}</span>
                                  {isEditingOverview && (
                                    <button 
                                      onClick={() => deleteTimelineTask(idx, taskIdx)}
                                      className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {isEditingOverview && (
                                <button className="w-full p-3 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 text-sm transition-all">
                                  + Add Task
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {isEditingOverview && (
                          <button className="w-full p-5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all">
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
                  <button
                    onClick={addNewEpic}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Epic
                  </button>
                </div>

                {backlog.epics.map((epic) => (
                  <div key={epic.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="px-4 py-1.5 bg-red-500 text-white rounded-full text-sm font-semibold mr-4 shadow-sm">
                            Epic
                          </span>
                          <input
                            type="text"
                            value={epic.name}
                            className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-red-300 focus:border-red-500 focus:outline-none transition-colors flex-1"
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"
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
                                  className="text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-orange-300 focus:border-orange-500 focus:outline-none transition-colors flex-1"
                                />
                              </div>
                              <button 
                                onClick={() => deleteSubEpic(epic.id, subEpic.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
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
                                        className="flex-1 text-gray-900 bg-transparent border-b-2 border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none transition-colors"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => deleteUserStory(epic.id, subEpic.id, story.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  {/* Tasks */}
                                  <div className="space-y-2 ml-6">
                                    {story.tasks.map((task, taskIdx) => (
                                      <div key={taskIdx} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                                        <div className="flex items-center flex-1">
                                          <span className="px-2.5 py-1 bg-green-600 text-white rounded-md text-xs font-semibold mr-3 shadow-sm">
                                            Task
                                          </span>
                                          <input
                                            type="text"
                                            value={task}
                                            className="bg-transparent text-gray-700 border-b-2 border-transparent hover:border-green-300 focus:border-green-500 focus:outline-none flex-1 transition-colors"
                                          />
                                        </div>
                                        <button 
                                          onClick={() => deleteTask(epic.id, subEpic.id, story.id, taskIdx)}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                    <button className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-500 hover:bg-green-50 text-sm font-medium transition-all">
                                      + Add Task
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button className="px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 text-sm font-medium transition-all">
                                + Add User Story
                              </button>
                            </div>
                          </div>
                        ))}
                        <button className="px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 hover:bg-orange-50 text-sm font-medium transition-all">
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
                                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                                  <span className="text-white font-bold text-base">
                                    {member.name.charAt(0).toUpperCase()}
                                  </span>
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
                                <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors">
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
                  placeholder="colleague@example.com"
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
    </div>
  );
}