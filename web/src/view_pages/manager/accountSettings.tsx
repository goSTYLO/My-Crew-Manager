import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout"; // <-- import Sidebar
import SettingsNavigation from "../../components/sidebarNavLayout"; // <-- new import
import TopNavbar from "../../components/topbarLayouot";
import {
    Search,
    Bell,
    Menu,
    X,
} from "lucide-react";



// Main CreateProject Component
const AccountSettings = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


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
                <main className="flex-1 p-6">
                {/* ✅ Top Section: Settings Nav + Edit Profile + Profile Card Side by Side */}
                <div className="grid grid-cols-12 gap-6 mb-6">
                    {/* Settings Sidebar Navigation */}
                    <div className="col-span-2">
                    <SettingsNavigation/>
                    </div>

                    {/* Edit Profile Form */}
                    <div className="col-span-7">
                    <div className="bg-white p-6 rounded-xl shadow border h-full">
                        <h2 className="text-3xl font-medium mb-12 mt-3 text-start ">Edit Profile</h2>
                        <form className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="First Name" className="p-4 border rounded" defaultValue="Yash" />
                        <input type="text" placeholder="Last Name" className="p-4 border rounded" defaultValue="Ghori" />
                        <input type="email" placeholder="Email" className="p-4 border rounded col-span-2" defaultValue="yghori@asite.com" />
                        <input type="password" placeholder="Change Password" className="p-4 border rounded col-span-2" />
                        <select className="p-4 border rounded">
                            <option>Filipino</option>
                        </select>
                        <div className="flex">
                            <span className="p-4 border rounded-l bg-gray-100">+63</span>
                            <input type="text" placeholder="Phone Number" className="p-2 border rounded-r flex-1" defaultValue="981567839" />
                        </div>
                        <select className="p-4 border rounded col-span-2">
                            <option>UI Intern</option>
                        </select>
                        <div className="flex justify-center col-span-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white py-2 rounded mt-4 w-32"
                            >
                                Save Changes
                            </button>
                            </div>
                        
                        </form>
                    </div>
                    </div>

                    {/* Profile Card (same height as Edit Profile) */}
                    <div className="col-span-3">
                    <div className="bg-white p-6 rounded-xl shadow text-center h-full flex flex-col justify-between">
                        <div>
                        <div className="flex flex-col items-center">
                            <img src="https://img.freepik.com/premium-photo/portrait-picture-boy_161767-3033.jpg" alt="profile" className="w-36 h-36 rounded-full border-4 border-blue-500 mb-3 mt-5" />
                            <h3 className="font-bold text-xl">Yash Ghori</h3>
                            <p className="text-sm text-gray-500m text-xl">Ahmedabad, Gujarat</p>
                            <p className="text-sm text-gray-500  text-xl">Filipino</p>
                        </div>

                         {/* Divider line */}
                        <hr className="my-4 border-t border-gray-300 w-[350px] mx-auto" />


                        <div className="mt-5 text-xl text-gray-600 space-y-1">
                        <p>UI - Intern</p>
                        <p>on-teak</p>
                        </div>

                         {/* Divider line */}
                         <hr className="my-4 border-t border-gray-300 w-[350px] mx-auto" />


                        </div>
                        <div className="mt-4 mb-5 text-xl text-gray-600 space-y-1">
                        <p>+91 7048144030</p>
                        <p>yghori@asite.com</p>
                        <p>PDT - I</p>
                        </div>
                    </div>
                    </div>
                </div>

                {/* ✅ Bottom Section: UI Developer + Projects + Work Done */}
                <div className="grid grid-cols-12 gap-6 mt-6">
                    {/* UI Developer */}
                    <div className="col-span-3 bg-white p-6 rounded-xl shadow border h-64">
                    <h3 className="font-bold text-2xl">UI Developer</h3>
                    <p className="text-gray-500 text-base">Lorem Ipsum is the best sentence in the world</p>
                    <h4 className="mt-3 font-semibold">Worked with</h4>
                    <div className="flex mt-6 gap-6 overflow-x-auto">
                        {[...Array(5)].map((_, i) => (
                        <img
                            key={i}
                            src={`https://i.pravatar.cc/40?img=${i + 1}`}
                            className="w-12 h-12 rounded-full"
                        />
                        ))}
                    </div>
                    </div>

                    {/* Projects + Work Done side by side */}
                    <div className="col-span-9 grid grid-cols-2 gap-6">
                    {/* Projects */}
                    <div className="bg-white p-6 rounded-xl shadow border h-full">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-2xl">Projects</h3>
                        <a href="#" className="text-sm text-blue-500">View all</a>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-gray-100 rounded p-2 text-center text-xs"
                        >
                            Project {i + 1}
                        </div>
                        ))}
                    </div>
                    </div>


                    {/* Total Work Done */}
                    <div className="bg-white p-6 rounded-xl shadow border text-center h-full">
                        <div className="flex justify-between text-sm text-gray-500 mb-3">
                        <span className="font-bold text-2xl text-black" >Total work done</span>
                        <select id="timeframe-select" className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>This Week</option>
                            <option>Last Week</option>
                            <option>This Month</option>
                        </select>
                        </div>
                        <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full border-8 border-blue-600 flex items-center justify-center font-bold">
                            5w: 2d
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

export default AccountSettings;