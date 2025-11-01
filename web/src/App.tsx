import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { LoginController } from './services/LoginController';

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
import ContactSupportPage from './components/ContactSupportPage';
import FAQPage from './components/FAQPage';
import AboutUsPage from './components/AboutUsPage';

// Component to handle Remember Me session check
const RememberMeHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only check on initial load, not on route changes
    // Skip if already on login/signup pages
    const isAuthPage = ['/signin', '/sign-in', '/signup', '/signUp', '/', '/landing-page'].includes(location.pathname);
    
    if (!isAuthPage) {
      // Check for Remember Me session
      LoginController.checkRememberMeSession()
        .then((result) => {
          if (result.authenticated && result.user) {
            // User has valid Remember Me session - determine redirect based on role
            const role = sessionStorage.getItem('userRole') || '';
            const normalizedRole = role.trim().replace(/\s+/g, ' ').toLowerCase();
            
            let redirectPath = '/projects-user'; // Default
            if (normalizedRole.includes('project') && normalizedRole.includes('manager')) {
              redirectPath = '/main-projects';
            }
            
            // Only redirect if we're at root or landing page
            if (location.pathname === '/' || location.pathname === '/landing-page') {
              console.log('✅ Remember Me session restored, redirecting to:', redirectPath);
              navigate(redirectPath, { replace: true });
            }
          }
        })
        .catch((error) => {
          console.error('❌ Error checking Remember Me session:', error);
        })
        .finally(() => {
          setIsChecking(false);
        });
    } else {
      setIsChecking(false);
    }
  }, []); // Only run once on mount

  if (isChecking) {
    // Optional: Show loading spinner while checking
    return null; // Or return a loading component
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <WebSocketProvider>
        <Router>
          <RememberMeHandler>
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
            <Route path="/contact-support" element={<ContactSupportPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />

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
          </RememberMeHandler>
        </Router>
      </WebSocketProvider>
    </ToastProvider>
  );
};

export default App;