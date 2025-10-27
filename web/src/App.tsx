import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

import SignIn from './view_pages/manager/signIn';
import SignUp from './view_pages/manager/signUp';

/* ---------------- Manager Web Routes ---------------- */
import MainProjects from './view_pages/manager/projects_main';
import Projects from './view_pages/manager/monitorProjects';
import Performance from './view_pages/manager/performance';
import AccountSettings from './view_pages/manager/settings_account';
import Notifications from './view_pages/manager/settings_notification';
import GenerateProject from './view_pages/manager/generateProject';
import Chat from './view_pages/manager/chat';
import CreatedProject from './view_pages/manager/monitor_created';
import SecuritySettings from './view_pages/manager/settings_security';
import AppearanceSettings from './view_pages/manager/settings_appearance';

/* ---------------- User Web Routes ---------------- */
import ProjectUser from './view_pages/user/monitorProjects_user';
import ProjectDetails from './view_pages/user/projectsDetails';
import ProjectInvitation from './view_pages/user/projectInvitation';
import Leader from './view_pages/user/leader';
import Chat2 from './view_pages/user/chat2.0';
import UserAccountSettings from './view_pages/user/user_settings_account';
import UserNotifications from './view_pages/user/user_settings_notification';
import UserSecuritySettings from './view_pages/user/user_settings_security';
import UserSettingsApperance from './view_pages/user/user_settings_apperance';

/* ---------------- Components ---------------- */
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
            <Route path="/landing-page" element={<LandingPage />} />

            {/* Fallback: redirect unknown paths to root */}
            <Route path="/main" element={<Navigate to="/main-projects" replace />} />

            {/* Manager Routes */}
            <Route path="/signUp" element={<SignUp />} />
            <Route path="/main-projects" element={<MainProjects />} />
            <Route path="/cprojects" element={<Projects />} />
            <Route path="/leaderboard" element={<Performance />} />
            <Route path="/manager-settings" element={<AccountSettings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/security" element={<SecuritySettings />} />
            <Route path="/appearance" element={<AppearanceSettings />} />
            <Route path="/create-project" element={<GenerateProject />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/user-chat" element={<Chat2 />} />
            <Route path="/projects" element={<CreatedProject />} />

            {/* Components */}
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* User Routes */}
            <Route path="/projects-user" element={<ProjectUser />} />
            <Route path="/project-details/:id" element={<CreatedProject />} />
            <Route path="/user-project/:id" element={<ProjectDetails />} />
            <Route path="/project-invitation" element={<ProjectInvitation />} />
            <Route path="/user-leaderboards" element={<Leader />} />
            <Route path="/user-settings" element={<UserAccountSettings />} />
            <Route path="/user-notifications" element={<UserNotifications />} />
            <Route path="/user-security" element={<UserSecuritySettings />} />
            <Route path="/user-appearance" element={<UserSettingsApperance />} />

            {/* Default Fallback */}
            <Route path="*" element={<Navigate to="/landing-page" replace />} />

          </Routes>
        </Router>
      </WebSocketProvider>
    </ToastProvider>
  );
};

export default App;