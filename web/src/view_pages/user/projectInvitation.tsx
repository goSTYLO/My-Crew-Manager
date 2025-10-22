// Project Invitation
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar
import TopNavbar from "../../components/topbarLayout_user";
import { Bell, CheckCircle, XCircle, Users, FolderOpen, Calendar, ArrowLeft } from 'lucide-react';
import { useTheme } from "../../components/themeContext";

// API functions
const API_BASE_URL = 'http://localhost:8000/api';

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const apiHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in again.');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  };
};

const invitationAPI = {
  getMyInvitations: async () => {
    const response = await fetch(`${API_BASE_URL}/ai/invitations/my-invitations/`, {
      headers: apiHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch invitations: ${response.statusText}`);
    }
    return response.json();
  },

  acceptInvitation: async (invitationId: number) => {
    const response = await fetch(`${API_BASE_URL}/ai/invitations/${invitationId}/accept/`, {
      method: 'POST',
      headers: apiHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to accept invitation: ${response.statusText}`);
    }
  },

  declineInvitation: async (invitationId: number) => {
    const response = await fetch(`${API_BASE_URL}/ai/invitations/${invitationId}/decline/`, {
      method: 'POST',
      headers: apiHeaders()
    });
    if (!response.ok) {
      throw new Error(`Failed to decline invitation: ${response.statusText}`);
    }
  }
};

// Types based on models.py
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: number;
  title: string;
  summary: string;
  created_by: User;
  created_at: string;
  member_count: number;
  task_count: number;
}

interface ProjectInvitation {
  id: number;
  project: Project;
  invitee: User;
  invited_by: User;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor?: User;
  related_invitation?: ProjectInvitation;
}

const App: React.FC = () => {
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const { theme } = useTheme();
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);

   // Load invitations from Django API
   useEffect(() => {
      const loadInvitations = async () => {
         setLoading(true);
         setError(null);
         
         try {
            const response = await invitationAPI.getMyInvitations();
            setInvitations(response.invitations || []);
            console.log('Loaded invitations:', response.invitations);
         } catch (err) {
            console.error('Error loading invitations:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load invitations';
            setError(errorMessage);
         } finally {
            setLoading(false);
         }
      };
      
      loadInvitations();
   }, []);

   // Convert API invitations to notification format for display
   const notifications: Notification[] = invitations.map((invitation, index) => ({
      id: index + 1,
      notification_type: 'project_invitation',
      title: `Project Invitation: ${invitation.project.title}`,
      message: `You have been invited to join "${invitation.project.title}"`,
      is_read: invitation.status !== 'pending',
      created_at: invitation.created_at,
      actor: invitation.invited_by,
      related_invitation: invitation
   }));

   const [currentUser] = useState<User>({
      id: 1,
      name: 'Kitkat',
      email: 'kitkat@example.com',
      avatar: 'KK'
   });

   const [showNotifications, setShowNotifications] = useState(false);
   const [activeTab, setActiveTab] = useState<'all' | 'invitations'>('invitations');

   const handleInvitationResponse = async (notificationId: number, invitationId: number, response: 'accepted' | 'declined') => {
      try {
         // Call the API
         if (response === 'accepted') {
            await invitationAPI.acceptInvitation(invitationId);
         } else {
            await invitationAPI.declineInvitation(invitationId);
         }
         
         // Update local state
         setInvitations(prev =>
            prev.map(inv => {
               if (inv.id === invitationId) {
                  return {
                     ...inv,
                     status: response,
                     updated_at: new Date().toISOString()
                  };
               }
               return inv;
            })
         );
         
      } catch (err) {
         console.error('Error responding to invitation:', err);
         setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
      }
   };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const invitationNotifications = notifications.filter(n => n.notification_type === 'project_invitation');
  const displayedNotifications = activeTab === 'invitations' ? invitationNotifications : notifications;
  const navigate = useNavigate(); 

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
   };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
  
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </header>
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
         <div className="mb-6 flex items-center gap-2">
            <button
               onClick={() => navigate('/projects-user')}
               className="flex items-center gap-2 text-2xl font-semibold"
            >
              <ArrowLeft
                  className={`w-5 h-5 transition-colors duration-200 
                     ${theme === "dark" ? "text-white hover:text-blue-400" : "text-black hover:text-blue-600"}
                  `}
                  />
                  <span className={theme === "dark" ? "text-white" : "text-black"}>
                  Project Invitations
                  </span>
            </button>
         </div>


         {/* Loading State */}
         {loading && (
            <div className={`rounded-lg border p-12 text-center ${
               theme === "dark"
               ? "bg-gray-800 border-gray-700"
               : "bg-white border-gray-200"
            }`}>
               <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <h3 className={`text-lg font-medium mb-2 ${
               theme === "dark" ? "text-white" : "text-gray-900"
               }`}>Loading invitations...</h3>
               <p className={`${
               theme === "dark" ? "text-gray-400" : "text-gray-600"
               }`}>Fetching your project invitations from the server.</p>
            </div>
         )}

         {/* Error State */}
         {error && !loading && (
            <div className={`rounded-lg border p-6 ${
               theme === "dark"
               ? "bg-red-900 border-red-700"
               : "bg-red-50 border-red-200"
            }`}>
               <h3 className={`text-lg font-medium mb-2 ${
               theme === "dark" ? "text-red-200" : "text-red-800"
               }`}>Error Loading Invitations</h3>
               <p className={`mb-3 ${
               theme === "dark" ? "text-red-300" : "text-red-700"
               }`}>{error}</p>
               <button 
               onClick={() => window.location.reload()} 
               className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  theme === "dark" 
                     ? "bg-red-800 hover:bg-red-700 text-red-200" 
                     : "bg-red-100 hover:bg-red-200 text-red-800"
               }`}
               >
               Retry
               </button>
            </div>
         )}

         {/* Content */}
         {!loading && !error && (
            <div className="space-y-4">
            {invitationNotifications.map(notif => {
               if (!notif.related_invitation) return null;
               const invitation = notif.related_invitation;

               return (
               <div
                  key={notif.id}
                  className={`rounded-lg border p-6 hover:shadow-md transition-shadow ${
                     theme === "dark"
                     ? "bg-gray-800 border-gray-700"
                     : "bg-white border-gray-200"
                  }`}
               >
                  <div className="flex items-start justify-between mb-4">
                     <div className="flex items-center space-x-3">
                     <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-lg font-medium">
                        {invitation.invited_by.avatar || invitation.invited_by.name.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <h3 className={`text-lg font-semibold ${
                           theme === "dark" ? "text-white" : "text-gray-900"
                        }`}>{invitation.project.title}</h3>
                        <p className={`text-sm ${
                           theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}>
                           Invited by <span className="font-medium">{invitation.invited_by.name}</span> •{' '}
                           {formatDate(invitation.created_at)}
                        </p>
                     </div>
                     </div>
                     {invitation.status === 'pending' && !notif.is_read && (
                     <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">New</span>
                     )}
                  </div>

                  <p className={`mb-4 ${
                     theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>{invitation.project.summary}</p>

                  {invitation.message && (
                  <div className={`mb-4 p-3 rounded-lg border-l-4 border-blue-500 ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}>
                     <p className={`text-sm italic ${
                     theme === "dark" ? "text-gray-300" : "text-gray-700"
                     }`}>"{invitation.message}"</p>
                  </div>
                  )}

                  <div className={`flex items-center space-x-6 mb-4 text-sm ${
                     theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>
                     <div className="flex items-center space-x-2">
                     <Users className="w-4 h-4" />
                     <span>{invitation.project.member_count} team members</span>
                     </div>
                     <div className="flex items-center space-x-2">
                     <FolderOpen className="w-4 h-4" />
                     <span>{invitation.project.task_count} active tasks</span>
                     </div>
                     <div className="flex items-center space-x-2">
                     <Calendar className="w-4 h-4" />
                     <span>Created {formatDate(invitation.project.created_at)}</span>
                     </div>
                  </div>

                     {invitation.status === 'pending' ? (
                        <div className="flex space-x-3">
                        <button
                           onClick={() => handleInvitationResponse(notif.id, invitation.id, 'accepted')}
                           className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                           <CheckCircle className="w-5 h-5" />
                           <span>Accept Invitation</span>
                        </button>
                        <button
                           onClick={() => handleInvitationResponse(notif.id, invitation.id, 'declined')}
                           className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                           <XCircle className="w-5 h-5" />
                           <span>Decline Invitation</span>
                        </button>
                        </div>
                     ) : (
                     <div
                        className={`px-4 py-3 rounded-lg text-center font-medium ${
                           invitation.status === 'accepted'
                              ? theme === "dark" 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-green-100 text-green-700'
                              : theme === "dark"
                              ? 'bg-red-900 text-red-300'
                              : 'bg-red-100 text-red-700'
                        }`}
                     >
                        {invitation.status === 'accepted' ? (
                           <span className="flex items-center justify-center space-x-2">
                              <CheckCircle className="w-5 h-5" />
                              <span>You accepted this invitation</span>
                           </span>
                        ) : (
                           <span className="flex items-center justify-center space-x-2">
                              <XCircle className="w-5 h-5" />
                              <span>You declined this invitation</span>
                           </span>
                        )}
                     </div>
                  )}
               </div>
               );
            })}

               {invitationNotifications.length === 0 && (
               <div className={`rounded-lg border p-12 text-center ${
                  theme === "dark"
                     ? "bg-gray-800 border-gray-700"
                     : "bg-white border-gray-200"
               }`}>
                  <Bell className={`w-16 h-16 mx-auto mb-4 ${
                     theme === "dark" ? "text-gray-600" : "text-gray-300"
                  }`} />
                  <h3 className={`text-lg font-medium mb-2 ${
                     theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>No pending invitations</h3>
                  <p className={`${
                     theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}>You're all caught up! New project invitations will appear here.</p>
               </div>
               )}
            </div>
         )}
      </main>
    </div>
   );
};

export default App;