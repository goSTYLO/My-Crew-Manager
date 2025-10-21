import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Paperclip, MessageSquareText, Clock } from "lucide-react";
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";

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
const TaskCardBox: React.FC<{ task: TaskCard }> = ({ task }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
    {/* Header */}
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-gray-800 text-lg font-semibold">{task.title}</h3>
      <div className="flex items-center gap-2 text-gray-600">
        <Clock className="w-5 h-5" />
        <span className="text-sm font-medium">{task.days} days</span>
      </div>
    </div>

    {/* Description */}
    <p className="text-gray-600 text-base leading-relaxed">{task.description}</p>

    {/* Footer */}
    <div className="flex justify-between items-end mt-10">
      {/* Left icons */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{task.clipCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{task.commentCount}</span>
        </div>
      </div>

      {/* Right members */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 transition">
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center justify-between">
              Tasks
              <button className="p-1 rounded hover:bg-gray-200">
                <Plus className="w-6 h-6 text-gray-600" />
              </button>
            </h2>
            <p className="text-gray-600 text-base opacity-70 mt-1">
              Edit or modify all card as you want
            </p>
          </div>

          {/* Overview Section */}
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
            </div>
            <hr className="border-t border-gray-300" />

            {/* Search + Dropdown */}
            <div className="grid grid-cols-3 mt-8 ml-8 mr-6 gap-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search Projects"
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-md w-full text-sm bg-blue-100"
                />
              </div>
              <div className="relative">
                <select className="pl-10 pr-4 py-3 border border-gray-300 rounded-md w-full text-sm bg-blue-100 font-semibold text-gray-800">
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
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between px-7 py-4 bg-blue-100 rounded-t-xl">
                        <div className="text-lg font-semibold">Adoddle</div>
                        
                        <button className="px-1 py-0.5 bg-transparent text-black text-sm font-medium rounded-lg hover:text-black hover:bg-gray-300 transition-colors">
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
                        className="w-full py-1.5 bg-white text-black text-2xl font-medium border-2 border-dashed border-blue-400 rounded-lg shadow hover:bg-blue-100 transition"
                        onClick={() => navigate("/task-user")}
                    >
                        +
                    </button>
                    </div>

                    <div className="p-6">
                    {SAMPLE_TASKS.map((task) => (
                        <TaskCardBox key={task.id} task={task} />
                    ))}
                    </div>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center space-x-1 mt-6">
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
                Previous
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md">
                1
              </button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
                2
              </button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
                3
              </button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-blue-200 hover:rounded-md">
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