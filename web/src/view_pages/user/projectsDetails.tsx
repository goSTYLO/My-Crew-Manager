import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Clock, MessageSquareText, Lightbulb, File, Calendar } from 'lucide-react';
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar
import TopNavbar from "../../components/topbarLayout_user";

// Type definitions for better type safety
interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  isOnline?: boolean;
}

interface Task {
  id: string;
  title: string;
  taskNumber: string;
  openedDays: number;
  assignee: string;
  status: 'Canceled' | 'Completed';
  stats: 'Canceled' | 'Completed';
  timeSpent: string;
  avatar: string;
  start_date: Date;
  end_date: Date;
}

interface ProjectStats {
  totalTasks: number;
  totalFiles: number;
}

// Sample data - in a real app, this would come from an API or state management
const SAMPLE_TEAM_MEMBERS: TeamMember[] = [
  { id: '1', name: 'John Doe', avatar: '👨‍💼', isOnline: true },
  { id: '2', name: 'Jane Smith', avatar: '👩‍💼', isOnline: true },
  { id: '3', name: 'Mike Johnson', avatar: '👨‍💻', isOnline: false },
  { id: '4', name: 'Sarah Wilson', avatar: '👩‍💻', isOnline: true },
  { id: '5', name: 'Alex Brown', avatar: '👨‍🎨', isOnline: false }
];

const SAMPLE_TASKS: Task[] = [
  {
    id: '1',
    title: 'Make an Automatic Payment System that enable the design',
    taskNumber: '#402235',
    openedDays: 10,
    assignee: 'Yaoh Ghori',
    status: 'Canceled',
    stats: 'Completed',
    timeSpent: '00:30:00',
    avatar: '👨‍💼',
    start_date: new Date('2025-09-01'),
    end_date: new Date('2025-09-15')
  },
  {
    id: '2',
    title: 'Make an Automatic Payment System that enable the design',
    taskNumber: '#402235',
    openedDays: 10,
    assignee: 'Yaoh Ghori',
    status: 'Canceled',
    stats: 'Completed',
    timeSpent: '00:30:00',
    avatar: '👨‍💼',
    start_date: new Date('2025-09-01'),
    end_date: new Date('2025-09-15')
  },
  {
    id: '3',
    title: 'Make an Automatic Payment System that enable the design',
    taskNumber: '#402235',
    openedDays: 10,
    assignee: 'Yaoh Ghori',
    status: 'Completed',
    stats: 'Canceled',
    timeSpent: '00:30:00',
    avatar: '👨‍💼',
    start_date: new Date('2025-09-01'),
    end_date: new Date('2025-09-15')
  },
  {
    id: '4',
    title: 'Make an Automatic Payment System that enable the design',
    taskNumber: '#402235',
    openedDays: 10,
    assignee: 'Yaoh Ghori',
    status: 'Completed',
    stats: 'Completed',
    timeSpent: '00:30:00',
    avatar: '👨‍💼',
    start_date: new Date('2025-09-01'),
    end_date: new Date('2025-09-15')
  }
];

const SAMPLE_STATS: ProjectStats = {
  totalTasks: 50,
  totalFiles: 15
};

// Avatar Component
const Avatar: React.FC<{ member: TeamMember; size?: 'sm' | 'md' }> = ({ 
  member, 
  size = 'md' 
}) => {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10';
  
  return (
    <div className="relative">
      <div className={`${sizeClasses} bg-gray-200 rounded-full flex items-center justify-center font-medium border-2 border-white shadow-sm`}>
        {member.avatar}
      </div>
      {member.isOnline && (
        <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};

// Team Avatars Component
const TeamAvatars: React.FC<{ members: TeamMember[] }> = ({ members }) => {
  const displayMembers = members.slice(0, 4);
  const remainingCount = Math.max(0, members.length - 4);

  return (
    <div className="flex items-center">
      {displayMembers.map((member, index) => (
        <div key={member.id} className={`relative ${index > 0 ? '-ml-2' : ''}`}>
          <Avatar member={member} size="sm" />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="relative -ml-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: 'Canceled' | 'Completed' }> = ({ status }) => {
  const isCompleted = status === 'Completed';
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${
      isCompleted 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {status}
    </span>
  );
};
const StatusBadges: React.FC<{ stats: 'Canceled' | 'Completed' }> = ({ stats }) => {
  const isCompleted = stats === 'Completed';
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${
      isCompleted 
        ? 'bg-green-100 text-green-700' 
        : 'bg-red-100 text-red-700'
    }`}>
      {stats}
    </span>
  );
};

// Task Row Component
const TaskRow: React.FC<{ 
  task: Task; 
  onTaskClick?: (taskId: string) => void;
}> = ({ task, onTaskClick }) => {

  return (
    <div 
       className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onTaskClick?.(task.id)}
    >
      {/* Left section */}
    <div className="flex items-center gap-3 flex-1">
        {/* Left section */}
        <div className="w-8 h-8 flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-gray-500" />
        </div>

        <div className="flex-1">
          {/* Task Title */}
          <h3 className="font-medium text-gray-900 text-sm mb-1">
            {task.title}
          </h3>

          {/* Task Details */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>{task.taskNumber}</span>
            <span>
              Opened {task.openedDays} days ago by {task.assignee}
            </span>
            <StatusBadge status={task.status} />
            <StatusBadges stats={task.stats} />
          </div>
        </div>
      </div>

      {/* Center section for Dates */}
      <div className="flex-1 flex">
        <div className="flex items-center gap-12">
          {/* Start Date */}
          <div className="flex flex-col items-center text-gray-700">
            <span className="text-sm font-medium">Start Date</span>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{task.start_date.toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col items-center text-gray-700">
            <span className="text-sm font-medium">End Date</span>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{task.end_date.toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>  
      </div>


      {/* Right section */}
      <div className="flex items-center gap-4 relative">
        {(() => {
              // Convert HH:MM:SS to total seconds
              const [h, m, s] = task.timeSpent.split(":").map(Number);
              const totalSeconds = h * 3600 + m * 60 + s;

              // Choose color
              const isLow = totalSeconds <= 600; // 10 minutes
              const bgClass = isLow ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600";

              return (
                <span
                  className={`flex items-center gap-2 px-7 py-2 text-sm font-semibold rounded-lg ${bgClass}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-clock3-icon lucide-clock-3"
                  >
                    <path d="M12 6v6h4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  {task.timeSpent}
                </span>
              );
            })()}

        <Avatar 
          member={{ 
            id: task.assignee, 
            name: task.assignee, 
            avatar: task.avatar 
          }} 
          size="sm" 
        />
        <button className="bg-transparent flex items-center space-x-1">
            <MessageSquareText className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
        </button>
        <div className="relative group">
          
          {/* The 3-dot SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-gray-600 cursor-pointer hover:text-gray-800"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
            />
          </svg>

        {/* 📌 Hidden by default → shows on hover */}
          <div className="absolute right-0 mt-2 w-auto max-w-xs bg-gray-700 border border-gray-200 rounded-lg shadow-lg p-4 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 z-50">
            <div className="flex flex-col gap-2 text-gray-700">
              <div className="text-center mb-2">
                <span className="text-white text-sm font-semibold">
                  TITTLE(X-AXIS)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-sm"></div>
                <span className="text-white text-sm whitespace-nowrap">
                  Data-point name:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                <span className="text-white text-sm whitespace-nowrap">
                  Data-point name:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-white text-sm whitespace-nowrap">
                  Data-point name:
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Main Project Management Component
const ProjectManager: React.FC = () => {
  const [tasks] = useState<Task[]>(SAMPLE_TASKS);
  const [teamMembers] = useState<TeamMember[]>(SAMPLE_TEAM_MEMBERS);
  const [stats] = useState<ProjectStats>(SAMPLE_STATS);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();


  const handleTaskClick = (taskId: string) => {
    console.log('Task clicked:', taskId);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
  
      {/* Top Navbar and content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 overflow-auto">
        {/* Header Section */}
        <header className="mb-8">
          <nav className="text-sm text-gray-500 mb-4">
            <h2 className="mt-5 text-2xl font-semibold text-gray-800"><span>Projects</span> / <span>Addodle</span></h2>
          </nav>
  
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">Addodle</h1>
              <TeamAvatars members={teamMembers} />
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                OnTrack
              </span>
            </div>
  
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Time spent</span>
                  <div className="flex items-center gap-1 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-md">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span>2M : 0W : 0D</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Deadline</span>
                  <div className="flex items-center gap-1 text-sm text-green-700 bg-green-100 px-3 py-1 rounded-md">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span>6M : 0W : 0D</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
  
        {/* Tasks List */}
        <div>
          <div className="w-full space-y-3"> 
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} onTaskClick={handleTaskClick} />
            ))}
          </div>
  
          {/* Footer Stats */}
          <footer className="mt-8 flex items-center justify-end gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" />
              <span>{stats.totalTasks} tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-gray-500" />
              <span>{stats.totalFiles} files</span>
            </div>
          </footer>
        </div>
      </main>
      </div>
    </div>
  );
};

export default ProjectManager;