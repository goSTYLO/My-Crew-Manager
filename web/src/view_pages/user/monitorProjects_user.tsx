import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar
import { 
  Search, 
  Bell, 
  Menu,
  X,
} from 'lucide-react';

   
const Projects = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  

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
      {/* Show up to 3 member avatars */}
      {members.slice(0, 4).map((member, index) => (
        <img
          key={index}
          className="w-8 h-8 rounded-full border-2 border-white"
          src={member.avatar}
          alt={member.name}
        />
      ))}

      {/* If there are more than 3 members, show a circle with "+N" */}
      {members.length > 4 && (
        <div className="w-8 h-8 rounded-full border-2 border-white bg-red-100 flex items-center justify-center text-xs font-medium text-red-500">
          +{members.length - 4}
        </div>
      )}
    </div>
  );


  return (
    <div className="flex h-screen bg-gray-50">
        {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]">
                <div className="bg-white rounded-xl shadow-lg p-6 w-96">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Are you sure you want to logout?
                    </h2>
                    <div className="flex justify-end space-x-3">
                    <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => navigate('/signIn')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        Logout
                    </button>
                    </div>
                </div>
                </div>
            )}
      

      {/* Sidebar Overlay (works for all screen sizes) */}
        <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
            sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        >
        {/* Background overlay */}
        <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar panel */}
        <div
            className={`relative flex flex-col w-64 bg-white transform transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            <div className="absolute top-4 right-4">
            <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500"
            >
                <X className="w-6 h-6" />
            </button>
            </div>
            <Sidebar onLogout={() => setShowLogoutConfirm(true)}/>
        </div>
        </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Menu button (always visible now) */}
            <button 
              className="p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">MyCrewManager</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for anything..."
                className="pl-10 pr-4 py-2 w-[500px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Notifications */}
            <button className="p-2 text-gray-500 hover:text-gray-700 relative -ml-2" title="Notifications">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="sm:block">
                <p className="text-sm font-medium text-gray-800">Kitkat</p>
                <p className="text-xs text-gray-500">Philippines</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                KK
              </div>
            </div>
          </div>
        </div>
      </header>

        {/* Projects Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Projects</h2>
            {/* Right side: files info */}
              <div className="relative w-[400px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for anything..."
                className="pl-10 pr-4 py-2 w-[400px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              </div>
        </div>
          {/* Row 1: Projects + Tasks */}
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-6">
            
           {/* Projects Card 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-gray-800">Adoddle</div>
                </div>

                {/* Right side: offtrack */}
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 bg-white text-black text-sm font-medium border border-gray-300 rounded-lg shadow hover:text-green-600 hover:bg-green-100 transition-colors">
                    Completed
                  </button>
                </div>
              </div>

              {/* Divider Line */}
              <hr className="border-t-1.7 border-black" />

              {/* Projects Wrapper */}
              <div className="rounded-xl p-4 bg-transparent">
                {/* Project Description Only */}
                <div className="rounded-xl p-4 bg-transparent">
                  <p className="text-black-600 text-medium leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                    commodo consequat.
                  </p>

                  {/* Footer: Date + Members (left) and Issues (right) */}
                  <div className="flex justify-between items-end mt-12">
                    {/* Left side */}
                    <div className="flex flex-col gap-2">

                      {/* Hourglass + Date on the same row */}
                      <div className="flex items-center gap-2">

                        {/* Date */}
                        <p className="text-red-500 font-medium">Deadline : 05 APRIL 2023</p>
                      </div>

                      {/* Members below the date */}
                      <Members members={members} />
                    </div>

                     {/* Right side */}
                    <div className="flex flex-col items-start gap-1">
                      {/* Row: Icon + text */}
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                          />
                        </svg>
                        <p className="font-medium">14 issues</p>
                      </div>

                      {/* Row: Button below */}
                      <button className="px-8 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
                        View
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Projects Card 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-gray-800">Adoddle</div>
                </div>

                {/* Right side: offtrack */}
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 bg-white text-black text-sm font-medium border border-gray-300 rounded-lg shadow hover:text-green-600 hover:bg-green-100 transition-colors">
                    Completed
                  </button>
                </div>
              </div>

              {/* Divider Line */}
              <hr className="border-t-1.7 border-black" />

              {/* Projects Wrapper */}
              <div className="rounded-xl p-4 bg-transparent">
                {/* Project Description Only */}
                <div className="rounded-xl p-4 bg-transparent">
                  <p className="text-black-600 text-medium leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                    commodo consequat.
                  </p>

                  {/* Footer: Date + Members (left) and Issues (right) */}
                  <div className="flex justify-between items-end mt-12">
                    {/* Left side */}
                    <div className="flex flex-col gap-2">

                      {/* Hourglass + Date on the same row */}
                      <div className="flex items-center gap-2">

                        {/* Date */}
                        <p className="text-red-500 font-medium">Deadline : 05 APRIL 2023</p>
                      </div>

                      {/* Members below the date */}
                      <Members members={members} />
                    </div>

                    {/* Right side */}
                    <div className="flex flex-col items-start gap-1">
                      {/* Row: Icon + text */}
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                          />
                        </svg>
                        <p className="font-medium">14 issues</p>
                      </div>

                      {/* Row: Button below */}
                      <button className="px-8 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
                        View
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Projects Card 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-gray-800">Adoddle</div>
                </div>

                {/* Right side: offtrack */}
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 bg-white text-black text-sm font-medium border border-gray-300 rounded-lg shadow hover:text-green-600 hover:bg-green-100 transition-colors">
                    Completed
                  </button>
                </div>
              </div>

              {/* Divider Line */}
              <hr className="border-t-1.7 border-black" />

              {/* Projects Wrapper */}
              <div className="rounded-xl p-4 bg-transparent">
                {/* Project Description Only */}
                <div className="rounded-xl p-4 bg-transparent">
                  <p className="text-black-600 text-medium leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                    veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                    commodo consequat.
                  </p>

                  {/* Footer: Date + Members (left) and Issues (right) */}
                  <div className="flex justify-between items-end mt-12">
                    {/* Left side */}
                    <div className="flex flex-col gap-2">

                      {/* Hourglass + Date on the same row */}
                      <div className="flex items-center gap-2">

                        {/* Date */}
                        <p className="text-red-500 font-medium">Deadline : 05 APRIL 2023</p>
                      </div>

                      {/* Members below the date */}
                      <Members members={members} />
                    </div>

                   {/* Right side */}
                    <div className="flex flex-col items-start gap-1">
                      {/* Row: Icon + text */}
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
                          />
                        </svg>
                        <p className="font-medium">14 issues</p>
                      </div>

                      {/* Row: Button below */}
                      <button className="px-8 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
                        View
                      </button>
                    </div>

                  </div>
                </div>
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
        </main>
      </div>
    </div>
  );
};

export default Projects;