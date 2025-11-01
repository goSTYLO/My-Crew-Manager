import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './sidebarLayout';
import TopNavbar from './topbarLayouot';
import SidebarUser from './sidebarUser';
import TopNavbarUser from './topbarLayout_user';
import { useTheme } from './themeContext';
import AboutUs from './AboutUs';

const AboutUsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const role = sessionStorage.getItem('userRole') || '';
    const normalizedRole = role.trim().replace(/\s+/g, ' ').toLowerCase();
    const managerRole = normalizedRole.includes('project') && normalizedRole.includes('manager');
    setIsManager(managerRole);
    
    // If no token, redirect to sign in
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/sign-in');
    }
  }, [navigate]);

  // Show loading state while determining role
  if (isManager === null) {
    return null;
  }

  if (isManager) {
    return (
      <div className={`flex min-h-screen w-full overflow-x-hidden ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto overflow-x-hidden pt-20">
            <AboutUs />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen w-full overflow-x-hidden ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <SidebarUser sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <TopNavbarUser onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto overflow-x-hidden pt-20">
          <AboutUs />
        </main>
      </div>
    </div>
  );
};

export default AboutUsPage;

