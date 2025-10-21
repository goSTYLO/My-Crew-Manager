// Project Invitation
import React, { useState } from 'react';
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar
import TopNavbar from "../../components/topbarLayout_user";
import { Bell, CheckCircle, XCircle, Users, FolderOpen, Calendar, User, ChevronDown } from 'lucide-react';

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
   const [currentUser] = useState<User>({
      id: 1,
      name: 'Kitkat',
      email: 'kitkat@example.com',
      avatar: 'KK'
   });

   const [notifications, setNotifications] = useState<Notification[]>([
      {
         id: 1,
         notification_type: 'project_invitation',
         title: 'New Project Invitation',
         message: 'You have been invited to join "E-Commerce Platform Redesign"',
         is_read: false,
         created_at: '2025-10-20T10:30:00Z',
         actor: {
         id: 2,
         name: 'Sarah Johnson',
         email: 'sarah@example.com',
         avatar: 'SJ'
         },
         related_invitation: {
         id: 1,
         project: {
            id: 1,
            title: 'E-Commerce Platform Redesign',
            summary: 'Complete redesign of our e-commerce platform with modern UI/UX principles and improved performance.',
            created_by: {
               id: 2,
               name: 'Sarah Johnson',
               email: 'sarah@example.com'
            },
            created_at: '2025-10-15T08:00:00Z',
            member_count: 5,
            task_count: 24
         },
         invitee: currentUser,
         invited_by: {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            avatar: 'SJ'
         },
         status: 'pending',
         message: 'We would love to have you join our team! Your expertise in frontend development would be invaluable.',
         created_at: '2025-10-20T10:30:00Z',
         updated_at: '2025-10-20T10:30:00Z'
         }
      },
      {
         id: 2,
         notification_type: 'project_invitation',
         title: 'New Project Invitation',
         message: 'You have been invited to join "Mobile App Development"',
         is_read: false,
         created_at: '2025-10-19T14:20:00Z',
         actor: {
         id: 3,
         name: 'Michael Chen',
         email: 'michael@example.com',
         avatar: 'MC'
         },
         related_invitation: {
         id: 2,
         project: {
            id: 2,
            title: 'Mobile App Development',
            summary: 'Building a cross-platform mobile application for our startup. React Native expertise needed.',
            created_by: {
               id: 3,
               name: 'Michael Chen',
               email: 'michael@example.com'
            },
            created_at: '2025-10-10T09:00:00Z',
            member_count: 3,
            task_count: 18
         },
         invitee: currentUser,
         invited_by: {
            id: 3,
            name: 'Michael Chen',
            email: 'michael@example.com',
            avatar: 'MC'
         },
         status: 'pending',
         message: 'Join us in building something amazing! Looking forward to collaborating with you.',
         created_at: '2025-10-19T14:20:00Z',
         updated_at: '2025-10-19T14:20:00Z'
         }
      },
      {
         id: 3,
         notification_type: 'task_assigned',
         title: 'New Task Assigned',
         message: 'You have been assigned to "Implement user authentication"',
         is_read: true,
         created_at: '2025-10-18T11:15:00Z',
         actor: {
         id: 4,
         name: 'Emma Davis',
         email: 'emma@example.com',
         avatar: 'ED'
         }
      }
   ]);

   const [showNotifications, setShowNotifications] = useState(false);
   const [activeTab, setActiveTab] = useState<'all' | 'invitations'>('invitations');

   const handleInvitationResponse = (notificationId: number, invitationId: number, response: 'accepted' | 'declined') => {
      setNotifications(prev =>
         prev.map(notif => {
         if (notif.id === notificationId && notif.related_invitation) {
            return {
               ...notif,
               is_read: true,
               related_invitation: {
               ...notif.related_invitation,
               status: response,
               updated_at: new Date().toISOString()
               }
            };
         }
         return notif;
         })
      );
   };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const invitationNotifications = notifications.filter(n => n.notification_type === 'project_invitation');
  const displayedNotifications = activeTab === 'invitations' ? invitationNotifications : notifications;

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
  
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        </div>
      </header>
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]   ">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Project Invitations</h2>
          <p className="text-gray-600">Review and respond to project invitations</p>
        </div>

        <div className="space-y-4">
          {invitationNotifications.map(notif => {
            if (!notif.related_invitation) return null;
            const invitation = notif.related_invitation;

            return (
              <div
                key={notif.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-lg font-medium">
                      {invitation.invited_by.avatar || invitation.invited_by.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{invitation.project.title}</h3>
                      <p className="text-sm text-gray-600">
                        Invited by <span className="font-medium">{invitation.invited_by.name}</span> •{' '}
                        {formatDate(invitation.created_at)}
                      </p>
                    </div>
                  </div>
                  {invitation.status === 'pending' && !notif.is_read && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">New</span>
                  )}
                </div>

                <p className="text-gray-700 mb-4">{invitation.project.summary}</p>

               {invitation.message && (
               <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-700 italic">"{invitation.message}"</p>
               </div>
               )}

                <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
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
                           ? 'bg-green-100 text-green-700'
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
        </div>

        {invitationNotifications.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
            <p className="text-gray-600">You're all caught up! New project invitations will appear here.</p>
          </div>
        )}
      </main>
    </div>
   );
};

export default App;

// import React, { useState } from 'react';
// import Sidebar from "../../components/sidebarUser";
// import TopNavbar from "../../components/topbarLayout_user";
// import { Bell, CheckCircle, XCircle, Users, FolderOpen, Calendar } from 'lucide-react';

// // Types
// interface User {
//   id: number;
//   name: string;
//   email: string;
//   avatar?: string;
// }

// interface Project {
//   id: number;
//   title: string;
//   summary: string;
//   created_by: User;
//   created_at: string;
//   member_count: number;
//   task_count: number;
// }

// interface ProjectInvitation {
//   id: number;
//   project: Project;
//   invitee: User;
//   invited_by: User;
//   status: 'pending' | 'accepted' | 'declined' | 'expired';
//   message: string;
//   created_at: string;
//   updated_at: string;
// }

// interface Notification {
//   id: number;
//   notification_type: string;
//   title: string;
//   message: string;
//   is_read: boolean;
//   created_at: string;
//   actor?: User;
//   related_invitation?: ProjectInvitation;
// }

// const App: React.FC = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const [currentUser] = useState<User>({
//     id: 1,
//     name: 'Kitkat',
//     email: 'kitkat@example.com',
//     avatar: 'KK'
//   });

//   const [notifications, setNotifications] = useState<Notification[]>([
//     // ... your notifications array (unchanged for brevity)
//   ]);

//   const [activeTab, setActiveTab] = useState<'all' | 'invitations'>('invitations');

//   const invitationNotifications = notifications.filter(n => n.notification_type === 'project_invitation');
//   const displayedNotifications = activeTab === 'invitations' ? invitationNotifications : notifications;

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffMs = now.getTime() - date.getTime();
//     const diffMins = Math.floor(diffMs / 60000);
//     const diffHours = Math.floor(diffMs / 3600000);
//     const diffDays = Math.floor(diffMs / 86400000);

//     if (diffMins < 60) return `${diffMins}m ago`;
//     if (diffHours < 24) return `${diffHours}h ago`;
//     if (diffDays < 7) return `${diffDays}d ago`;
//     return date.toLocaleDateString();
//   };

//   const handleInvitationResponse = (notificationId: number, invitationId: number, response: 'accepted' | 'declined') => {
//     setNotifications(prev =>
//       prev.map(notif => {
//         if (notif.id === notificationId && notif.related_invitation) {
//           return {
//             ...notif,
//             is_read: true,
//             related_invitation: {
//               ...notif.related_invitation,
//               status: response,
//               updated_at: new Date().toISOString()
//             }
//           };
//         }
//         return notif;
//       })
//     );
//   };

//   const InvitationCard: React.FC<{ notif: Notification }> = ({ notif }) => {
//     if (!notif.related_invitation) return null;
//     const invitation = notif.related_invitation;

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
//         <div className="flex items-start justify-between mb-4">
//           <div className="flex items-center space-x-3">
//             <div className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-lg font-medium">
//               {invitation.invited_by.avatar || invitation.invited_by.name.substring(0, 2).toUpperCase()}
//             </div>
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900">{invitation.project.title}</h3>
//               <p className="text-sm text-gray-600">
//                 Invited by <span className="font-medium">{invitation.invited_by.name}</span> • {formatDate(invitation.created_at)}
//               </p>
//             </div>
//           </div>

//           {invitation.status === 'pending' && !notif.is_read && (
//             <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">New</span>
//           )}
//         </div>

//         <p className="text-gray-700 mb-4">{invitation.project.summary}</p>

//         {invitation.message && (
//           <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
//             <p className="text-sm text-gray-700 italic">"{invitation.message}"</p>
//           </div>
//         )}

//         <div className="flex items-center space-x-6 mb-4 text-sm text-gray-600">
//           <div className="flex items-center space-x-2">
//             <Users className="w-4 h-4" />
//             <span>{invitation.project.member_count} team members</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <FolderOpen className="w-4 h-4" />
//             <span>{invitation.project.task_count} active tasks</span>
//           </div>
//           <div className="flex items-center space-x-2">
//             <Calendar className="w-4 h-4" />
//             <span>Created {formatDate(invitation.project.created_at)}</span>
//           </div>
//         </div>

//         {invitation.status === 'pending' ? (
//           <div className="flex space-x-3">
//             <button
//               onClick={() => handleInvitationResponse(notif.id, invitation.id, 'accepted')}
//               className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
//             >
//               <CheckCircle className="w-5 h-5" />
//               <span>Accept Invitation</span>
//             </button>
//             <button
//               onClick={() => handleInvitationResponse(notif.id, invitation.id, 'declined')}
//               className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
//             >
//               <XCircle className="w-5 h-5" />
//               <span>Decline Invitation</span>
//             </button>
//           </div>
//         ) : (
//           <div className={`px-4 py-3 rounded-lg text-center font-medium ${
//             invitation.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//           }`}>
//             <span className="flex items-center justify-center space-x-2">
//               {invitation.status === 'accepted' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
//               <span>{invitation.status === 'accepted' ? 'You accepted this invitation' : 'You declined this invitation'}</span>
//             </span>
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
//       <div className="flex-1 flex flex-col min-w-0">
//         <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

//         <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="mb-6">
//             <h2 className="text-2xl font-semibold text-gray-900 mb-2">Project Invitations</h2>
//             <p className="text-gray-600">Review and respond to project invitations</p>
//           </div>

//           <div className="space-y-4">
//             {invitationNotifications.length === 0 ? (
//               <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//                 <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
//                 <p className="text-gray-600">You're all caught up! New project invitations will appear here.</p>
//               </div>
//             ) : (
//               invitationNotifications.map(notif => <InvitationCard key={notif.id} notif={notif} />)
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default App;
