import React, { useState } from "react";
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Bell, 
  Menu,
  X,
  Plus, 
} from 'lucide-react';



// Task Kaban Performance Component
const KanbanUser = () => {
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
    <div className="flex items-center -space-x-3">
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

    
    
    // FIXED: Replaced useNavigate with simple console.log for demo purposes
    const handleNavigation = (route: string) => {
        console.log(`Navigating to: ${route}`);
    };


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
                    onClick={() => handleNavigation("/signIn")}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                    Logout
                    </button>
                </div>
                </div>
            </div>
            )}

            {/* Sidebar Overlay */}
            <div
            className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
                sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
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
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="absolute top-4 right-4">
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-gray-500"
                    aria-label="Close sidebar"
                >
                    <X className="w-6 h-6" />
                </button>
                </div>
                <Sidebar onLogout={() => setShowLogoutConfirm(true)} />
            </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
            {/* Top Navbar */}
            <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar"
                    >
                    <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-semibold text-gray-800">
                    MyCrewManager
                    </h1>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Search Bar */}
                    <div className="block relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search for anything..."
                        className="pl-10 pr-4 py-2 w-[300px] md:w-[500px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>

                    {/* Notifications */}
                    <button
                    className="p-2 text-gray-500 hover:text-gray-700 relative -ml-2"
                    aria-label="Notifications"
                    >
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

                {/* Task Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-auto space-y-6">
                    <div className="mb-6">
                    {/* Title */}
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center justify-between">
                        Tasks
                        <button
                            className="p-1 rounded hover:bg-gray-200"
                        >
                            <Plus className="w-6 h-6 text-gray-600" />
                        </button>
                    </h2>

                    {/* Subtitle under the task */}
                    <p className="text-gray-600 text-base leading-relaxed opacity-70 mt-1">
                        Edit or modify all card as you want
                    </p>
                </div>

                    {/* UI Developers Section - Full width below */}
                    <div className="mt-6 bg-white p-5 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
                    </div>

                    {/* Divider Line */}
                    <hr className="border-t border-gray-300" />

                    <div className="grid grid-cols-3 mt-8 ml-8 mr-6 gap-6" >
                        {/* 1st Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                            <input
                            type="text"
                            placeholder="Search Projects"
                            className="pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full text-sm bg-blue-100"
                            />
                        </div>

                        {/* 2nd Dropdown instead of Search */}
                        <div className="relative">
                            <select className="pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full text-sm bg-blue-100 font-semibold text-gray-800"
                            >
                                <option value="">List View</option>
                                <option value="option1" className="font-normal">Option One</option>
                                <option value="option2" className="font-normal">Option Two</option>
                                <option value="option3" className="font-normal">Option Three</option>
                            </select>


                            {/* Dropdown icon instead of search */}
                            <svg
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                        </div>
                    </div>


                    <div className="grid grid-cols-3 p-8 lg:grid-cols-3 gap-6">

                        {/* Projects Card 1 */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            {/* Header with only blue background */}
                            <div className="flex items-center justify-between px-7 py-4 bg-blue-100 text-black rounded-t-xl">
                                <div className="text-lg font-semibold">Adoddle</div>

                                {/* Right side: status */}
                                <button className="px-1 py-.5 bg-transparent text-black text-sm font-medium rounded-lg hover:text-black hover:bg-gray-300 transition-colors" onClick={() => navigate("/task-user")}>
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
                                className="lucide lucide-ellipsis-icon lucide-ellipsis"
                                >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                                </svg>
                                </button>
                            </div>

                            <div className="px-6 pt-3">
                                <button className="w-full py-1.5 bg-white text-black text-2xl font-medium border-2 border-dashed border-blue-400 rounded-lg shadow hover:text-black hover:bg-blue-100 transition-colors">
                                    +
                                </button>
                            </div>


                        <div className="p-6">
                                {/* Paragraph in its own box 1*/}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>

                                {/* Paragraph in its own box 2 */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>

                                {/* Paragraph in its own box 3 */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                            {/* Projects Card 2 */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            {/* Header with only blue background */}
                            <div className="flex items-center justify-between px-7 py-4 bg-blue-100 text-black rounded-t-xl">
                                <div className="text-lg font-semibold">Adoddle</div>

                                {/* Right side: status */}
                                <button className="px-1 py-.5 bg-transparent text-black text-sm font-medium rounded-lg hover:text-black hover:bg-gray-300 transition-colors"
                                >
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
                                className="lucide lucide-ellipsis-icon lucide-ellipsis"
                                >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                                </svg>
                                </button>
                            </div>

                            <div className="px-6 pt-3">
                                <button className="w-full py-1.5 bg-white text-black text-2xl font-medium border-2 border-dashed border-blue-400 rounded-lg shadow hover:text-black hover:bg-blue-100 transition-colors">
                                    +
                                </button>
                            </div>


                        <div className="p-6">
                                {/* Paragraph in its own box 1*/}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>

                                {/* Paragraph in its own box 2 */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>

                                {/* Paragraph in its own box 3 */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                            {/* Projects Card 3 */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            {/* Header with only blue background */}
                            <div className="flex items-center justify-between px-7 py-4 bg-blue-100 text-black rounded-t-xl">
                                <div className="text-lg font-semibold">Adoddle</div>

                                {/* Right side: status */}
                                <button className="px-1 py-.5 bg-transparent text-black text-sm font-medium rounded-lg hover:text-black hover:bg-gray-300 transition-colors">
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
                                className="lucide lucide-ellipsis-icon lucide-ellipsis"
                                >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                                </svg>
                                </button>
                            </div>

                            <div className="px-6 pt-3">
                                <button className="w-full py-1.5 bg-white text-black text-2xl font-medium border-2 border-dashed border-blue-400 rounded-lg shadow hover:text-black hover:bg-blue-100 transition-colors">
                                    +
                                </button>
                            </div>


                        <div className="p-6">
                                {/* Paragraph in its own box 1*/}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>

                                {/* Paragraph in its own box 2 */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
                                        </div>
                                    </div>
                                </div>

                                {/* Paragraph in its own box 3 */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">

                                    {/* Title with clock + days */}
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-gray-800 text-lg font-semibold">
                                            Food Research
                                        </h3>

                                        {/* Clock + 14 days */}
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                            </svg>
                                            <span className="text-sm font-medium">14 days</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 text-base leading-relaxed">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                                    eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    </p>

                                    {/* Footer: comment + clip (left) and Members (right) */}
                                    <div className="flex justify-between items-end mt-10">

                                        {/* Left side: Comment + Clip */}
                                        <div className="flex items-center gap-4">
                                            
                                            {/* Clip Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth="1.5"
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                                                />
                                            </svg>
                                            <p className="font-medium">14</p>
                                            </div>

                                            {/* Comments Notification */}
                                            <div className="flex items-center gap-2">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="size-6"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                                />
                                            </svg>
                                            <p className="font-medium">7</p>
                                            </div>
                                            
                                        </div>

                                        {/* Right side: + button + members */}
                                        <div className="flex items-center gap-2">
                                            <button className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-gray-500 hover:bg-gray-200 hover:text-black transition">
                                            <Plus className="w-4 h-4" />
                                            </button>
                                            <Members members={members} />
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
                    </div>
                </main>
            </div>
        </div>
    );
};

export default KanbanUser;