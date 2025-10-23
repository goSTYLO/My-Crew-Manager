import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import SignIn from './view_pages/manager/signIn';
import SignUp from './view_pages/manager/signUp'; 

import MainFrame from './view_pages/manager/mainFrame'; 
import MainProjects from './view_pages/manager/projects_main'; 
import Projects from './view_pages/manager/monitorProjects'; 
import CreateTask from './view_pages/manager/createTask'; 
import Performance from './view_pages/manager/performance'; 
import Settings from './view_pages/manager/settings';
import WorkLogs from './view_pages/manager/workLogs';
import AccountSettings from './view_pages/manager/settings_account'; 
import Notifications from './view_pages/manager/settings_notification'; 
import GenerateProject from './view_pages/manager/generateProject'; 
import Chat from './view_pages/manager/chat'; 
import CreatedProject from './view_pages/manager/monitor_created'; 

{/* User Web Connections */}
import UserFrame from './view_pages/user/userFrame';
import ProjectUser from './view_pages/user/monitorProjects_user';
import ProjectInvitation from './view_pages/user/projectInvitation';
import PerformanceUser from './view_pages/user/performance_user';
import TaskUser from './view_pages/user/viewTask_user';
import KanbanUser from './view_pages/user/taskkanban_user';
import SecuritySettings from './view_pages/manager/settings_security';
import AppearanceSettings from './view_pages/manager/settings_appearance';
import TeamSettings from './view_pages/manager/settings_team';
import GeneralSettings from './view_pages/manager/settings';
import ProjectDetails from './view_pages/user/projectsDetails'; 
import SubTask from './view_pages/user/subTaskUser';
import WorklogsUser from './view_pages/user/worklogsUser';
import ChatUser from './view_pages/user/chatUser';
import UserSettings from './view_pages/user/settings_user';
import SmartSettings from './components/smartSettings'; 

{/* Components */}
import ForgotPassword from './components/forgotpassword'; 
import LandingPage from './components/landingpage'; 


const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
      <Routes>
        {/* Root path shows Sign In */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/landing-page" element={<LandingPage/> }/>
        
        {/* Fallback: redirect unknown paths to root */}
        <Route path="/main" element={<MainFrame />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/main-projects" element={<MainProjects />} />
        <Route path="/cprojects" element={<Projects />} />
        <Route path="/work-logs" element={<WorkLogs/>}/>
        <Route path="/leaderboard" element={<Performance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/security" element={<SecuritySettings/> }/>
        <Route path="/appearance" element={<AppearanceSettings/> }/>
        <Route path="/team" element={<TeamSettings/> }/>
        <Route path="/general" element={<GeneralSettings/> }/>
        <Route path="/create-project" element={<GenerateProject/> }/>
        <Route path="/chat" element={<Chat/> }/>
        <Route path="/projects" element={<CreatedProject/> }/>

        {/* Components */}
        <Route path="/forgot-password" element={<ForgotPassword/> }/>

         {/* User routes */}
         <Route path="/user" element={<UserFrame />} />
        <Route path="/projects-user" element={<ProjectUser />} />
        <Route path="/project-invitation" element={<ProjectInvitation />} />
        <Route path="/project-details/:projectId" element={<ProjectDetails />} />
        <Route path="/performance-user" element={<PerformanceUser />} />
        <Route path="/task-user" element={<TaskUser />} />
        <Route path="/subtask-user" element={<SubTask/>}/>
        <Route path="/kanban-user" element={<KanbanUser />} />
        <Route path="/worklogs-user" element={<WorklogsUser/>}/> 
        <Route path="/chat-user" element={<ChatUser/> }/>
        <Route path="/settings-user" element={<UserSettings />} />
        
        {/* User Settings Sub-pages (same components, but will show user sidebar) */}
        <Route path="/account-settings-user" element={<AccountSettings />} />
        <Route path="/notifications-user" element={<Notifications />} />
        <Route path="/security-user" element={<SecuritySettings />} />
        <Route path="/appearance-user" element={<AppearanceSettings />} />
        <Route path="/team-user" element={<TeamSettings />} />
        
        <Route path="*" element={<Navigate to="/landing-page" replace />} />
      </Routes>
    </Router>
    </ToastProvider>
  );
};

export default App;