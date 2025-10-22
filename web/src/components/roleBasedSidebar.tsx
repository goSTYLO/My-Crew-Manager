import type { ReactNode } from "react";
import Sidebar from "./sidebarLayout";
import SidebarUser from "./sidebarUser";

interface RoleBasedSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  children?: ReactNode;
}

const RoleBasedSidebar = ({ sidebarOpen, setSidebarOpen }: RoleBasedSidebarProps) => {
  // Get user role from localStorage
  const userRole = localStorage.getItem("userRole");
  
  // Normalize the role for comparison
  const normalizedRole = userRole ? userRole.trim().toLowerCase() : "";
  
  // Determine which sidebar to show based on role
  const isProjectManager = 
    normalizedRole === "project manager" || 
    normalizedRole.includes("project") && normalizedRole.includes("manager") ||
    normalizedRole === "projectmanager" ||
    normalizedRole === "pm";

  // Return appropriate sidebar component
  if (isProjectManager) {
    return (
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
    );
  } else {
    return (
      <SidebarUser 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
    );
  }
};

export default RoleBasedSidebar;