import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout"; // <-- import Sidebar
import SettingsNavigation from "../../components/sidebarNavLayout"; // <-- new import
import { Bell,Menu, Search, X } from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";

const ProjectSettings = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

   
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
                                onClick={() => console.log("Logging out...")}
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
                    <Sidebar onLogout={() => setShowLogoutConfirm(true)} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Navbar */}
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

                {/* Main Content Area */}
                <main className="flex p-6 overflow-auto">
                {/* Sidebar pinned to the left */}
                    <div className="w-64 ml-6">
                        <SettingsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProjectSettings;