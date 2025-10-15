import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebarLayout";
import TopNavbar from '../../components/topbarLayouot';
import { useTheme } from "../../components/themeContext"; // <-- import ThemeContext

const Projects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme(); // <-- use theme

  // Members data (example)
  const members = [
    { name: 'Alice', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Bob', avatar: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Charlie', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'David', avatar: 'https://i.pravatar.cc/150?img=4' },
    { name: 'Eve', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Frank', avatar: 'https://i.pravatar.cc/150?img=6' },
    { name: 'Grace', avatar: 'https://i.pravatar.cc/150?img=7' },
    { name: 'Henry', avatar: 'https://i.pravatar.cc/150?img=8' },
  ];

  // Members component
  const Members = ({ members }: { members: { name: string; avatar: string }[] }) => (
    <div className="flex items-center -space-x-3 mt-2">
      {members.slice(0, 4).map((member, index) => (
        <img
          key={index}
          className="w-8 h-8 rounded-full border-2 border-white"
          src={member.avatar}
          alt={member.name}
        />
      ))}
      {members.length > 4 && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-red-100 flex items-center justify-center text-xs font-medium text-red-500">
          +{members.length - 4}
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Projects</h2>
            <div className="flex items-center space-x-10">
              <button
                onClick={() => navigate("/create-project")}
                className={`px-14 py-3 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700 hover:bg-blue-600 hover:text-white" : "bg-white text-black border border-gray-300 hover:bg-blue-500 hover:text-white"} text-sm font-medium border rounded-lg shadow transition-colors`}
              >
                Create
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-6">
            <div className={`${theme === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200"} rounded-xl shadow-sm border p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2
                    className={`text-lg font-semibold cursor-pointer hover:text-blue-500 ${theme === "dark" ? "text-white" : "text-gray-800"}`}
                    onClick={() => navigate("/project-task")}
                  >
                    Adoddle
                  </h2>
                  <button
                    className={`transition-colors ${theme === "dark" ? "text-gray-400 hover:text-blue-400" : "text-gray-500 hover:text-blue-500"}`}
                    title="Edit Project"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 
                        1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 
                        1-1.897 1.13L6 18l.8-2.685a4.5 4.5 
                        0 0 1 1.13-1.897l8.932-8.931Zm0 
                        0L19.5 7.125M18 14v4.75A2.25 2.25 
                        0 0 1 15.75 21H5.25A2.25 2.25 
                        0 0 1 3 18.75V8.25A2.25 2.25 
                        0 0 1 5.25 6H10"
                      />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button className={`px-4 py-2 text-sm font-medium rounded-lg shadow transition-colors ${theme === "dark" ? "bg-gray-900 text-white border border-gray-700 hover:bg-red-600 hover:text-white" : "bg-white text-black border border-gray-300 hover:bg-red-200 hover:text-red-600"}`}>
                    Offtrack
                  </button>
                </div>
              </div>

              {/* Divider Line */}
              <hr className="border-t-1.7 border-black" />

              {/* Projects Wrapper */}
              <div className="rounded-xl p-4 bg-transparent">
                <div className="rounded-xl p-4 bg-transparent">
                  <p className={`${theme === "dark" ? "text-gray-300" : "text-black-600"} text-medium leading-relaxed`}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                    commodo consequat.
                  </p>
                  <div className="flex justify-between items-end mt-12">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {/* Hourglass End Icon with bottom filled */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                          >
                            {/* Outline of the hourglass */}
                            <path
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 4.5h10.5M6.75 19.5h10.5
                                M8.25 4.5v4.632c0 .466.186.913.517 1.244l1.866 1.866c.31.31.31.81 0 1.12l-1.866 
                                1.866a1.75 1.75 0 0 0-.517 1.244V19.5
                                m7.5-15v4.632c0 .466-.186.913-.517 1.244l-1.866 1.866c-.31.31-.31.81 
                                0 1.12l1.866 1.866c.331.331.517.778.517 1.244V19.5"
                            />

                            {/* Bottom "sand" triangle */}
                            <polygon
                              points="8.5,18 15.5,18 12,15"
                              className="fill-red-500"
                            />
                          </svg>

                        {/* Date */}
                        <p className="text-red-500 font-medium">05 APRIL 2023</p>
                      </div>

                      {/* Members below the date */}
                      <Members members={members} />
                    </div>
                    <Members members={members} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Projects;