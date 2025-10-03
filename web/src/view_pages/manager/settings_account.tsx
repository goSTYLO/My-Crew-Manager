import { useState } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";

// Main CreateProject Component
const AccountSettings = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { theme } = useTheme();

    return (
        <div className={`flex min-h-screen w-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
            {/* Sidebar (reusable, same as mainFrame/settings) */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

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
                        <div className={`p-6 rounded-xl shadow border h-full ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white"}`}>
                            <h2 className={`text-3xl font-medium mb-12 mt-3 text-start ${theme === "dark" ? "text-white" : ""}`}>Edit Profile</h2>
                            <form className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="First Name" className={`p-4 border rounded ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} defaultValue="Yash" />
                                <input type="text" placeholder="Last Name" className={`p-4 border rounded ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} defaultValue="Ghori" />
                                <input type="email" placeholder="Email" className={`p-4 border rounded col-span-2 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} defaultValue="yghori@asite.com" />
                                <input type="password" placeholder="Change Password" className={`p-4 border rounded col-span-2 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} />
                                <select className={`p-4 border rounded ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`}>
                                    <option>Filipino</option>
                                </select>
                                <div className="flex">
                                    <span className={`p-4 border rounded-l ${theme === "dark" ? "bg-gray-700 border-gray-700 text-white" : "bg-gray-100"}`}>+63</span>
                                    <input type="text" placeholder="Phone Number" className={`p-2 border rounded-r flex-1 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} defaultValue="981567839" />
                                </div>
                                <select className={`p-4 border rounded col-span-2 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`}>
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
                        <div className={`p-6 rounded-xl shadow text-center h-full flex flex-col justify-between ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                            <div>
                                <div className="flex flex-col items-center">
                                    <img src="https://img.freepik.com/premium-photo/portrait-picture-boy_161767-3033.jpg" alt="profile" className="w-36 h-36 rounded-full border-4 border-blue-500 mb-3 mt-5" />
                                    <h3 className="font-bold text-xl">Yash Ghori</h3>
                                    <p className={`text-sm text-xl ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Ahmedabad, Gujarat</p>
                                    <p className={`text-sm text-xl ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Filipino</p>
                                </div>

                                 {/* Divider line */}
                                <hr className={`my-4 border-t w-[350px] mx-auto ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`} />


                                <div className={`mt-5 text-xl space-y-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                    <p>UI - Intern</p>
                                    <p>on-teak</p>
                                </div>

                                 {/* Divider line */}
                                 <hr className={`my-4 border-t w-[350px] mx-auto ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`} />


                            </div>
                            <div className={`mt-4 mb-5 text-xl space-y-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
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
                    <div className={`col-span-3 p-6 rounded-xl shadow border h-64 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white"}`}>
                        <h3 className="font-bold text-2xl">UI Developer</h3>
                        <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Lorem Ipsum is the best sentence in the world</p>
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
                        <div className={`p-6 rounded-xl shadow border h-full ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white"}`}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-2xl">Projects</h3>
                                <a href="#" className="text-sm text-blue-500">View all</a>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`rounded p-2 text-center text-xs ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"}`}
                                    >
                                        Project {i + 1}
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Total Work Done */}
                        <div className={`p-6 rounded-xl shadow border text-center h-full ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white"}`}>
                            <div className={`flex justify-between text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                                <span className={`font-bold text-2xl ${theme === "dark" ? "text-white" : "text-black"}`}>Total work done</span>
                                <select id="timeframe-select" className={`text-sm border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
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