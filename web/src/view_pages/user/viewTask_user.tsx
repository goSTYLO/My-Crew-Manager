import React, { useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from "../../components/sidebarUser"; // <-- import Sidebar

import { 
  Search, 
  Bell,
  Menu,
  X,
  MessageSquareText
} from 'lucide-react';



// Main Performance Component
const TaskUser = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const navigate = useNavigate();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileClick = () => {
    fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFiles([...files, ...Array.from(e.target.files)]);
        }
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
                    onClick={() => navigate('/signIn')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    Logout
                </button>
                </div>
            </div>
            </div>
        )}

        {/* ✨ Edit Project/Task Modal */}
        {showEditModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]">
                <div className="bg-white rounded-xl shadow-lg w-[800px] max-w-2xl p-8">
                
                    <div className="flex justify-between items-center mb-4">
                        {/* Project/Task ID */}
                        <p className="text-sm text-gray-500">
                            Project / Task ID-1234
                        </p>
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="text-gray-500 hover:text-black mb-4 text-xl"
                            >
                            ✕
                        </button>
                    </div>

                    {/* Header with title + X button */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                        Make a Suitable form
                        </h2>
                        <div className="flex items-center justify-between bg-green-100 text-gray-600 rounded-full px-4 py-2 w-[140px]">
                            {/* Timer */}
                            <span className="flex-1 text-center text-s font-semibold">00:00</span>

                            {/* Play button */}
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-200">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="w-4 h-4 text-green-600"
                                >
                                <path d="M8 5v14l11-7z" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-tags w-5 h-5 rotate-90"
                        >
                            <path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z"/>
                            <path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193"/>
                            <circle cx="10.5" cy="6.5" r=".5" fill="currentColor"/>
                        </svg>
                        <h1 className="text-sm text-gray-500 font-semibold w-[80px]">Priority</h1>

                        <div className="flex items-center gap-2">
                            <span className="w-[100px] text-center px-4 py-1.5 text-xs font-medium bg-green-500 text-white rounded-full">
                                Completed
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
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
                            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                        </svg>

                        <h1 className="text-sm text-gray-500 font-semibold w-[80px]">Status</h1>

                        <div className="flex items-center gap-2">
                            <span className="w-[100px] text-center px-4 py-1.5 text-xs font-medium bg-red-500 text-white rounded-full">
                                High
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
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
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                        />
                        </svg>

                        <h1 className="text-sm text-gray-500 font-semibold w-[80px]">Owner</h1>

                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden">
                                <img
                                src="https://i.pravatar.cc/40?img=2"
                                alt="user"
                                className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm text-gray-600 font-semibold">UI Sharks</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
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
                            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                        </svg>
                        <h1 className="text-sm text-gray-500 font-semibold w-[80px]">Assigned</h1>

                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full overflow-hidden">
                                <img
                                src="https://i.pravatar.cc/40?img=2"
                                alt="user"
                                className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm text-gray-600 font-semibold">Coder Bhai</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
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
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                        </svg>
                        <h1 className="text-sm text-gray-500 font-semibold w-[80px]">Due Date</h1>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-semibold">March 24th 2023</span>
                        </div>
                    </div>

                    {/* Divider Line */}
                    <hr className="border-t-1.7 border-gray-300 my-4" />

                    {/* Header with title + X button */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-s font-semibold text-gray-800">
                        Attachment
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2 my-4">
                        {/* Document Links */}
                        <div className="flex items-center gap-2">
                            <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6"
                            >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
                            />
                            </svg>

                            <h1
                            className="text-sm text-gray-500 font-semibold w-[130px] cursor-pointer hover:text-blue-400"
                            onClick={handleFileClick}
                            >
                            Document Links
                            </h1>

                            <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            />
                        </div>

                        {/* Uploaded File + Clear */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-start gap-2">
                            {/* SVG + Clear in vertical */}
                            <div className="flex flex-col items-start gap-1">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6"
                                >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                                </svg>

                                {files.length > 0 && (
                                <button
                                    className="text-xs text-red-500 hover:text-red-700"
                                    onClick={() => {
                                    setFiles([]);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                    }}
                                >
                                    Clear
                                </button>
                                )}
                            </div>

                            {/* File Name always on same line */}
                            <h1 className="text-sm text-gray-500 font-semibold truncate w-[200px]">
                                {files[0]?.name || "Add Attachment"}
                            </h1>
                            </div>
                        </div>
                    </div>

                    {/* Divider Line */}
                    <hr className="border-t-1.7 border-gray-300 my-4" />

                    {/* Header with title */}
                    <div className="flex justify-between items-center">
                        <h2 className="text-s font-semibold text-gray-800">
                        Description
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <div className="w-7 h-7 rounded-full overflow-hidden">
                            <img
                            src="https://i.pravatar.cc/40?img=2"
                            alt="user"
                            className="w-full h-full object-cover"
                            />
                        </div>
                        <input
                        type="text"
                        placeholder="Add Attachment"
                        className="w-full bg-gray-200 p-2 border text-black rounded-lg mb-4 mt-4 placeholder:text-sm placeholder:font-serif placeholder:font-medium"
                        />
                    </div>

                    <div className="ml-10 flex gap-2">
                        {/* Avatar */}
                        <div className="w-7 h-7 aspect-square rounded-full overflow-hidden">
                            <img
                            src="https://i.pravatar.cc/40?img=2"
                            alt="user"
                            className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Comment content */}
                        <div>
                            <p className="font-semibold text-black">
                            Yash Ghori <span className="font-normal">commented</span> 1d 24 March 2023 <span className="font-normal">at</span> 18:59
                            </p>

                            <ul className="list-disc list-inside text-black">
                            <li>Technical training - life cycle hook, viewEncapsulation, Data sharing</li>
                            <li>Product training</li>
                            <li>Work on project common component integration (Navbar-Sidebar & Profile Section)</li>
                            <li>Work on Local setup issue on Github</li>
                            </ul>

                            {/* Buttons row */}
                            <div className="flex gap-4 mt-2">
                            <button className="text-sm text-black hover:text-blue-700">Edit</button>
                            <button className="text-sm text-black hover:text-red-700">Delete</button>
                            </div>
                        </div>
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
                    <Sidebar onLogout={()=> setShowLogoutConfirm(true)}/>
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

                {/* Main Content Area */}
                <main className="flex-1 p-6 overflow-auto">
                    
                    {/* Task Section */}
                    {/* Additional Section: Automatic Payment System */}
                    <div className="grid grid-cols-1 gap-6 mt-8">

                        {/* Task 1 */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-gray-800">
                                Make an Automatic Payment System that enable the design
                                </h4>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        #A32236 • Opened 10 days ago by Yash Ghel
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 ml-5 text-xs font-medium bg-green-100 text-green-600 rounded-full">
                                        Completed
                                        </span>
                                        <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                                        High
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <span
                                className="flex items-center gap-2 px-7 py-2 text-sm font-semibold bg-red-100 text-red-600 rounded-lg" >
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
                                00 : 15 : 00
                                </span>

                                
                                <div className="flex items-center space-x-3">

                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                        <img
                                        src="https://i.pravatar.cc/40?img=2"
                                        alt="user"
                                        className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Edit Project/Task */}
                                    <button onClick={() => setShowEditModal(true)} className="bg-transparent flex items-center space-x-1">
                                        <span className="text-s font-bold text-gray-600">2</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="25"
                                            height="25"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide text-gray-500 lucide-list-todo cursor-pointer hover:text-black transition-colors"
                                        >
                                            <path d="M13 5h8" />
                                            <path d="M13 12h8" />
                                            <path d="M13 19h8" />
                                            <path d="m3 17 2 2 4-4" />
                                            <rect x="3" y="4" width="6" height="6" rx="1" />
                                        </svg>
                                    </button>
                                
                                <MessageSquareText className="w-5.5 h-5.5 text-gray-500 cursor-pointer hover:text-gray-700" />
                                </div>
                            </div>
                        </div>


                        {/* Task 2 */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-medium text-gray-800">
                                Make an Automatic Payment System that enable the design
                                </h4>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        #A32236 • Opened 10 days ago by Yash Ghel
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <span className="px-3 py-1 ml-5 text-xs font-medium bg-green-100 text-green-600 rounded-full">
                                        Completed
                                        </span>
                                        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-600 rounded-full">
                                        Low
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">

                                <span
                                className="flex items-center gap-2 px-7 py-2 text-sm font-semibold bg-green-100 text-green-600 rounded-lg" >
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
                                00 : 15 : 00
                                </span>

                                <div className="flex items-center space-x-3">

                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                        <img
                                        src="https://i.pravatar.cc/150?img=3"
                                        alt="user"
                                        className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <button className="bg-transparent flex items-center space-x-1">
                                        <span className="text-s font-bold text-gray-600">2</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="25"
                                            height="25"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide text-gray-500 lucide-list-todo cursor-pointer hover:text-black transition-colors"
                                        >
                                            <path d="M13 5h8" />
                                            <path d="M13 12h8" />
                                            <path d="M13 19h8" />
                                            <path d="m3 17 2 2 4-4" />
                                            <rect x="3" y="4" width="6" height="6" rx="1" />
                                        </svg>
                                    </button>
                                
                                <MessageSquareText className="w-5.5 h-5.5 text-gray-500 cursor-pointer hover:text-gray-700" />
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

export default TaskUser;