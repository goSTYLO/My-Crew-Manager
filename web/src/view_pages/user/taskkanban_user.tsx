import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Paperclip, MessageSquareText, Clock } from "lucide-react";
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { useTheme } from "../../components/themeContext";

// ✅ Types
interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface TaskCard {
  id: string;
  title: string;
  description: string;
  days: number;
  clipCount: number;
  commentCount: number;
  members: Member[];
}

// ✅ Sample members
const SAMPLE_MEMBERS: Member[] = [
  { id: "1", name: "Alice", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "2", name: "Bob", avatar: "https://i.pravatar.cc/150?img=2" },
  { id: "3", name: "Charlie", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: "4", name: "David", avatar: "https://i.pravatar.cc/150?img=4" },
  { id: "5", name: "Eve", avatar: "https://i.pravatar.cc/150?img=5" },
];

// ✅ Sample tasks
const SAMPLE_TASKS: TaskCard[] = [
  {
    id: "1",
    title: "Food Research",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    days: 14,
    clipCount: 14,
    commentCount: 7,
    members: SAMPLE_MEMBERS,
  },
  {
    id: "2",
    title: "Food Research",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    days: 14,
    clipCount: 10,
    commentCount: 3,
    members: SAMPLE_MEMBERS,
  },
  {
    id: "3",
    title: "Food Research",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    days: 14,
    clipCount: 22,
    commentCount: 9,
    members: SAMPLE_MEMBERS,
  },
];

// ✅ Members component
const Members: React.FC<{ members: Member[] }> = ({ members }) => {
  const visible = members.slice(0, 4);
  const remaining = members.length - 4;

  return (
    <div className="flex items-center -space-x-3">
      {visible.map((m) => (
        <img
          key={m.id}
          src={m.avatar}
          alt={m.name}
          className="w-8 h-8 rounded-full border-2 border-white"
        />
      ))}
      {remaining > 0 && (
        <div className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 text-xs font-medium rounded-full border-2 border-white">
          +{remaining}
        </div>
      )}
    </div>
  );
};

// ✅ TaskCard UI
const TaskCardBox: React.FC<{ task: TaskCard; theme: string }> = ({ task, theme }) => (
  <div className={`${theme === 'dark' ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'} border rounded-lg p-4 mb-3`}>
    {/* Header */}
    <div className="flex items-center justify-between mb-2">
      <h3 className={`${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} text-lg font-semibold`}>{task.title}</h3>
      <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
        <Clock className="w-5 h-5" />
        <span className="text-sm font-medium">{task.days} days</span>
      </div>
    </div>

    {/* Description */}
    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-base leading-relaxed`}>{task.description}</p>

    {/* Footer */}
    <div className="flex justify-between items-end mt-10">
      {/* Left icons */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Paperclip className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{task.clipCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquareText className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
          <span className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{task.commentCount}</span>
        </div>
      </div>

      {/* Right members */}
      <div className="flex items-center gap-2">
        <button className={`w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed transition ${theme === 'dark' ? 'border-gray-500 text-gray-400 hover:bg-gray-700' : 'border-gray-400 text-gray-500 hover:bg-gray-200'}`}>
          <Plus className="w-4 h-4" />
        </button>
        <Members members={task.members} />
      </div>
    </div>
  </div>
);

// ✅ Main Component with full UI
const KanbanUser: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          {/* Header */}
          <div>
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} flex items-center justify-between`}>
              Tasks
              <button className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                <Plus className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </h2>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-base opacity-70 mt-1`}>
              Edit or modify all card as you want
            </p>
          </div>

          {/* Overview Section */}
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-5 rounded-lg shadow-sm`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Overview</h3>
            </div>
            <hr className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`} />

            {/* Search + Dropdown */}
            <div className="grid grid-cols-3 mt-8 ml-8 mr-6 gap-6">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search Projects"
                  className={`pl-10 pr-4 py-3 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-blue-100 text-gray-800'} rounded-md w-full text-sm`}
                />
              </div>
              <div className="relative">
                <select className={`pl-10 pr-4 py-3 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-blue-100 text-gray-800'} rounded-md w-full text-sm font-semibold`}>
                  <option>List View</option>
                  <option className="font-normal">Option One</option>
                  <option className="font-normal">Option Two</option>
                  <option className="font-normal">Option Three</option>
                </select>
              </div>
            </div>

            {/* Project Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                {/* Each card is one project */}
                <div className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-xl shadow-sm border`}>
                    <div className={`flex items-center justify-between px-7 py-4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-blue-100'} rounded-t-xl`}>
                        <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Adoddle</div>
                        
                        <button className={`px-1 py-0.5 bg-transparent text-sm font-medium rounded-lg transition-colors ${theme === 'dark' ? 'text-gray-200 hover:text-gray-100 hover:bg-gray-500' : 'text-black hover:text-black hover:bg-gray-300'}`}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-ellipsis"
                        >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="19" cy="12" r="1" />
                            <circle cx="5" cy="12" r="1" />
                        </svg>
                        </button>
                    </div>

                    <div className="px-6 pt-3">
                    <button
                        className={`w-full py-1.5 text-2xl font-medium border-2 border-dashed rounded-lg shadow transition ${theme === 'dark' ? 'bg-gray-700 text-gray-200 border-blue-500 hover:bg-gray-600' : 'bg-white text-black border-blue-400 hover:bg-blue-100'}`}
                        onClick={() => navigate("/task-user")}
                    >
                        +
                    </button>
                    </div>

                    <div className="p-6">
                    {SAMPLE_TASKS.map((task) => (
                        <TaskCardBox key={task.id} task={task} theme={theme} />
                    ))}
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-1 mt-6">
              <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
                Previous
              </button>
              <button className={`px-3 py-1 text-sm rounded-md ${theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>
                1
              </button>
              <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
                2
              </button>
              <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
                3
              </button>
              <button className={`px-3 py-1 text-sm transition hover:rounded-md ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-blue-200'}`}>
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default KanbanUser;