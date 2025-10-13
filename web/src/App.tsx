import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './view_pages/manager/signIn';
import SignUp from './view_pages/manager/signUp'; 
import MainFrame from './view_pages/manager/mainFrame'; 
import MainProjects from './view_pages/manager/projects_main'; 
import Projects from './view_pages/manager/monitorProjects'; 
import CreateProject from './view_pages/manager/createProjects'; 
import CreateTask from './view_pages/manager/createTask'; 
import Performance from './view_pages/manager/performance'; 
import Settings from './view_pages/manager/settings';
import WorkLogs from './view_pages/manager/workLogs';
import AccountSettings from './view_pages/manager/accountSettings'; 
import Notifications from './view_pages/manager/notifications'; 

{/* User Web Connections */}
import UserFrame from './view_pages/user/userFrame';
import ProjectUser from './view_pages/user/monitorProjects_user';
import PerformanceUser from './view_pages/user/performance_user';
import TaskUser from './view_pages/user/viewTask_user';
import KanbanUser from './view_pages/user/taskkanban_user';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Root path shows Sign In */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/sign-in" element={<SignIn />} />
        
        {/* Fallback: redirect unknown paths to root */}
        <Route path="/main" element={<MainFrame />} />
        <Route path="/signUp" element={<SignUp />} />
        <Route path="/create" element={<CreateTask />} />
        <Route path="/main-projects" element={<MainProjects />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/create-project" element={<CreateProject />} />
        <Route path="/work-logs" element={<WorkLogs/>}/>
        <Route path="/performance" element={<Performance />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/notifications" element={<Notifications />} />

         {/* User routes */}
         <Route path="/user" element={<UserFrame />} />
        <Route path="/projects-user" element={<ProjectUser />} />
        <Route path="/performance-user" element={<PerformanceUser />} />
        <Route path="/task-user" element={<TaskUser />} />
        <Route path="/kanban-user" element={<KanbanUser />} />
        
        <Route path="*" element={<Navigate to="/signIn" replace />} />
      </Routes>
    </Router>
  );
};

export default App;