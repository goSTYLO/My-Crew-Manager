import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import SignIn from './view_pages/manager/signIn';
import SignUp from './view_pages/manager/signUp'; 

import MainProjects from './view_pages/manager/projects_main'; 
import Projects from './view_pages/manager/monitorProjects'; 
import CreateTask from './view_pages/manager/createTask'; 
import Performance from './view_pages/manager/performance'; 
import Leader from './view_pages/user/leader'; 
import Settings from './view_pages/manager/settings';
import AccountSettings from './view_pages/manager/settings_account'; 
import Notifications from './view_pages/manager/settings_notification'; 
import GenerateProject from './view_pages/manager/generateProject'; 
import Chat from './view_pages/manager/chat'; 
import Chat2 from './view_pages/user/chat2.0'; 
import CreatedProject from './view_pages/manager/monitor_created'; 

{/* User Web Connections */}
import UserFrame from './view_pages/user/userFrame';
import ProjectUser from './view_pages/user/monitorProjects_user';
import PerformanceUser from './view_pages/user/performance_user';
import TaskUser from './view_pages/user/viewTask_user';
import KanbanUser from './view_pages/user/taskkanban_user';
import SecuritySettings from './view_pages/manager/settings_security';
import AppearanceSettings from './view_pages/manager/settings_appearance';
import TeamSettings from './view_pages/manager/settings_team';
import GeneralSettings from './view_pages/manager/settings';
import ProjectDetails from './view_pages/user/projectsDetails'; 
import ProjectInvitation from './view_pages/user/projectInvitation'; 
import SubTask from './view_pages/user/subTaskUser';
import WorklogsUser from './view_pages/user/worklogsUser';

{/* Components */}
import ForgotPassword from './components/forgotpassword'; 
import LandingPage from './components/landingpage'; 


const App: React.FC = () => {
  return (
    <ToastProvider>
      <WebSocketProvider>
        <Router>
      <Routes>
        {/* Root path shows Sign In */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/landing-page" element={<LandingPage/> }/>
        
        {/* Fallback: redirect unknown paths to root */}
        <Route path="/main" element={<Navigate to="/main-projects" replace />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/main-projects" element={<MainProjects />} />
        <Route path="/cprojects" element={<Projects />} />
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
        <Route path="/user-chat" element={<Chat2/> }/>
        <Route path="/projects" element={<CreatedProject/> }/>

        {/* Components */}
        <Route path="/forgot-password" element={<ForgotPassword/> }/>

         {/* User routes */}
         <Route path="/user" element={<UserFrame />} />
        <Route path="/projects-user" element={<ProjectUser />} />
        <Route path="/project-details/:id" element={<CreatedProject />} />
        <Route path="/user-project" element={<ProjectDetails />} />
        <Route path="/project-invitation" element={<ProjectInvitation />} />
        <Route path="/performance-user" element={<PerformanceUser />} />
        <Route path="/task-user" element={<TaskUser />} />
        <Route path="/subtask-user" element={<SubTask/>}/>
        <Route path="/kanban-user" element={<KanbanUser />} />
        <Route path="/worklogs-user" element={<WorklogsUser/>}/>
        <Route path="/user-leaderboards" element={<Leader/>}/> 
        
        <Route path="*" element={<Navigate to="/landing-page" replace />} />
      </Routes>
        </Router>
      </WebSocketProvider>
    </ToastProvider>
  );
};

export default App;