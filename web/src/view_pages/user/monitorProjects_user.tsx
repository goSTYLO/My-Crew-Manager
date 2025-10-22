import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { Search } from "lucide-react";
import { useTheme } from "../../components/themeContext";

// ✅ Member & Project Types
interface Member {
  name: string;
  avatar: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: "Completed" | "Ongoing" | "Offtrack";
  issues: number;
  members: Member[];
}

// ✅ Sample Members
const members: Member[] = [
  { name: "Alice", avatar: "https://i.pravatar.cc/150?img=1" },
  { name: "Bob", avatar: "https://i.pravatar.cc/150?img=2" },
  { name: "Charlie", avatar: "https://i.pravatar.cc/150?img=3" },
  { name: "David", avatar: "https://i.pravatar.cc/150?img=4" },
  { name: "Eve", avatar: "https://i.pravatar.cc/150?img=5" },
  { name: "Frank", avatar: "https://i.pravatar.cc/150?img=6" },
  { name: "Grace", avatar: "https://i.pravatar.cc/150?img=7" },
  { name: "Henry", avatar: "https://i.pravatar.cc/150?img=8" },
];

// ✅ Sample Projects (instead of repeating JSX)
const projects: Project[] = [
  {
    id: 1,
    title: "Adoddle",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    deadline: "05 APRIL 2023",
    status: "Completed",
    issues: 14,
    members,
  },
  {
    id: 2,
    title: "Adoddle",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    deadline: "05 APRIL 2023",
    status: "Completed",
    issues: 14,
    members,
  },
  {
    id: 3,
    title: "Adoddle",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    deadline: "05 APRIL 2023",
    status: "Completed",
    issues: 14,
    members,
  },
];

// ✅ Members Component
const Members = ({ members, theme }: { members: Member[]; theme: string }) => (
  <div className="flex items-center -space-x-3 mt-2">
    {members.slice(0, 4).map((member, index) => (
      <img
        key={index}
        className={`w-8 h-8 rounded-full border-2 ${theme === 'dark' ? 'border-gray-700' : 'border-white'}`}
        src={member.avatar}
        alt={member.name}
      />
    ))}

    {members.length > 4 && (
      <div className={`w-8 h-8 rounded-full border-2 ${theme === 'dark' ? 'border-gray-700 bg-red-900 text-red-400' : 'border-white bg-red-100 text-red-500'} flex items-center justify-center text-xs font-medium`}>
        +{members.length - 4}
      </div>
    )}
  </div>
);

// ✅ Project Card Component
const ProjectCard = ({ project, theme }: { project: Project; theme: string }) => {
  const navigate = useNavigate();

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          {project.title}
        </div>
        <button className={`px-4 py-2 text-sm font-medium border rounded-lg shadow transition-colors ${theme === 'dark' ? 'bg-gray-700 text-gray-200 border-gray-600 hover:text-green-400 hover:bg-green-900' : 'bg-white text-black border-gray-300 hover:text-green-600 hover:bg-green-100'}`}>
          {project.status}
        </button>
      </div>

      <hr className={`border-t-1.7 ${theme === 'dark' ? 'border-gray-600' : 'border-black'}`} />

      {/* Content */}
      <div className="rounded-xl p-4 bg-transparent">
        <p className={`text-medium leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-black-600'}`}>
          {project.description}
        </p>

        <div className="flex justify-between items-end mt-12">
          {/* Left side */}
          <div className="flex flex-col gap-2">
            <p className={`font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>
              Deadline : {project.deadline}
            </p>
            <Members members={project.members} theme={theme} />
          </div>

          {/* Right side */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                />
              </svg>
              <p className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{project.issues} issues</p>
            </div>
            <button
              className={`px-8 py-1 text-sm rounded-lg transition ${theme === 'dark' ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
              onClick={() => navigate("/project-details")}
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Main Component
const Projects = () => {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          {/* Header with search */}
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Projects</h2>
            <div className="relative w-[400px]">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search for anything..."
                className={`pl-10 pr-4 py-2 w-[400px] border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${theme === 'dark' ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400' : 'border-gray-300 bg-white text-gray-800'}`}
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} theme={theme} />
            ))}
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
        </main>
      </div>
    </div>
  );
};

export default Projects;