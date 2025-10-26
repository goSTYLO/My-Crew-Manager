//settings_accouts.tsx
import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import {  Camera, Phone, Mail, User, TrendingUp  } from "lucide-react";

interface UserData {
    user_id: string;
    name: string;
    email: string;
    role: string | null;
    profile_picture?: string | null;
}



// Main CreateProject Component
const AccountSettings = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [nationality, setNationality] = useState("Filipino");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // User data state
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [country, setCountry] = useState("Philippines");

    const nationalities = [
        "Filipino",
        "American",
        "Canadian",
        "British",
        "Australian",
        "Japanese",
        "Korean",
        "Chinese",
        "Indian",
        "Singaporean"
    ];

    const nationalityToCountryMap: Record<string, string> = {
        Filipino: "Philippines",
        American: "United States",
        Canadian: "Canada",
        British: "United Kingdom",
        Australian: "Australia",
        Japanese: "Japan",
        Korean: "South Korea",
        Chinese: "China",
        Indian: "India",
        Singaporean: "Singapore",
      };
      
    useEffect(() => {
    const mappedCountry = nationalityToCountryMap[nationality];
    if (mappedCountry) {
        setCountry(mappedCountry);
    }
    }, [nationality]);

    



    useEffect(() => {
        const storedCountry = localStorage.getItem("user_country");
        if (storedCountry) {
          setCountry(storedCountry);
        }
      }, []);
      
      useEffect(() => {
        localStorage.setItem("user_country", country);
      }, [country]);

      
    // Fetch user data on component mount
        useEffect(() => {
            const fetchUserData = async () => {
            const token = sessionStorage.getItem("token");
        
            if (!token) {
                navigate("/login");
                return;
            }
        
            try {
                const response = await fetch(`${API_BASE_URL}/api/user/me/`, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                });
        
                if (response.ok) {
                const data = await response.json();
        
                // ✅ Fix relative profile picture path
                const fixedData = {
                    ...data,
                    profile_picture: data.profile_picture
                    ? data.profile_picture.startsWith("http")
                        ? data.profile_picture
                        : `${API_BASE_URL}${data.profile_picture}`
                    : null,
                };
        
                setUserData(fixedData);
        
                const storedNationality = localStorage.getItem("user_nationality");
                setNationality(storedNationality || data.nationality || "Filipino");
        
                if (fixedData.profile_picture) {
                    setProfilePicturePreview(fixedData.profile_picture);
                }
        
                const nameParts = fixedData.name.split(" ");
                setFirstName(nameParts[0] || "");
                setLastName(nameParts.slice(1).join(" ") || "");
                setEmail(fixedData.email);
                setRole(fixedData.role || "");
                } else {
                sessionStorage.removeItem("token");
                navigate("/login");
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setLoading(false);
            }
            };
        
            fetchUserData();
        }, [navigate]);

    // Handle profile picture selection
    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setSaveMessage("Error: Image size should be less than 5MB");
                return;
            }

            // Check file type
            if (!file.type.startsWith('image/')) {
                setSaveMessage("Error: Please upload an image file");
                return;
            }

            setProfilePicture(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Trigger file input click
    const handleProfilePictureClick = () => {
        fileInputRef.current?.click();
    };

    // Handle form submission
    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveMessage("");
    
        const token = sessionStorage.getItem("token");
        if (!token) {
        navigate("/login");
        return;
        }
    
        try {
        const fullName = `${firstName} ${lastName}`.trim();
        const formData = new FormData();
        formData.append("name", fullName);
        formData.append("email", email);
        formData.append("role", role);
        formData.append("nationality", nationality);
    
        if (profilePicture) {
            formData.append("profile_picture", profilePicture);
        }
    
        if (password.trim() !== "") {
            formData.append("password", password);
        }
    
        const response = await fetch(`${API_BASE_URL}/api/user/me/`, {
            method: "PUT",
            headers: {
            Authorization: `Token ${token}`,
            },
            body: formData,
        });
    
        if (response.ok) {
            const updatedData = await response.json();
    
            // ✅ Fix relative profile picture path
            const updatedProfilePictureURL = updatedData.profile_picture
            ? updatedData.profile_picture.startsWith("http")
                ? updatedData.profile_picture
                : `${API_BASE_URL}${updatedData.profile_picture}`
            : null;
    
            setUserData({
            ...updatedData,
            profile_picture: updatedProfilePictureURL,
            });
    
            if (updatedProfilePictureURL) {
            setProfilePicturePreview(updatedProfilePictureURL);
            }
    
            // ✅ Dispatch event with full updated data (for TopNavbar refresh)
            window.dispatchEvent(
            new CustomEvent("userDataUpdated", {
                detail: {
                name: updatedData.name,
                email: updatedData.email,
                role: updatedData.role,
                profile_picture: updatedProfilePictureURL,
                },
            })
            );
    
            setSaveMessage("Changes saved successfully!");
            setPassword("");
            setProfilePicture(null);
            setTimeout(() => setSaveMessage(""), 3000);
        } else {
            const errorData = await response.json();
            setSaveMessage(`Error: ${JSON.stringify(errorData)}`);
        }
        } catch (error) {
        console.error("Failed to update user data:", error);
        setSaveMessage("Failed to save changes. Please try again.");
        }
    };
  
    // Get user initials for avatar
    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className={`flex min-h-screen w-full items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                <p className={`text-xl ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Loading...</p>
            </div>
        );
    }

    return (
        <div className={`flex min-h-screen w-full ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
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
                <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
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
                            
                            {/* Save Message */}
                            {saveMessage && (
                                <div className={`mb-4 p-3 rounded ${saveMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {saveMessage}
                                </div>
                            )}

                            <form className="grid grid-cols-2 gap-4" onSubmit={handleSaveChanges}>
                                <input 
                                    type="text" 
                                    placeholder="First Name" 
                                    className={`p-4 border rounded ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} 
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    required
                                />
                                <input 
                                    type="text" 
                                    placeholder="Last Name" 
                                    className={`p-4 border rounded ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} 
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                                <input 
                                    type="email" 
                                    placeholder="Email" 
                                    className={`p-4 border rounded col-span-2 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`} 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <input 
                                    type="password" 
                                    placeholder="Change Password (leave blank to keep current)" 
                                    className={`p-4 border rounded col-span-2 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : ""}`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div className="grid grid-cols-2 gap-4 w-[203%] mx-auto">
                                    <label htmlFor="nationality-select" className="sr-only">
                                        Nationality
                                    </label>
                                    <select
                                        id="nationality-select"
                                        className={`p-4 border rounded w-full ${
                                            theme === "dark"
                                            ? "bg-gray-900 border-gray-700 text-white"
                                            : "bg-white text-gray-700"
                                        }`}
                                        value={nationality}
                                        onChange={(e) => {
                                            setNationality(e.target.value);
                                            localStorage.setItem("user_nationality", e.target.value);
                                        }}
                                        >
                                        <option value="">Select Nationality</option>
                                        {nationalities.map((nation) => (
                                            <option key={nation} value={nation}>
                                            {nation}
                                            </option>
                                        ))}
                                        </select>

                                    <div className="flex w-full">
                                        <span
                                            className={`p-4 border rounded-l ${
                                                theme === "dark"
                                                ? "bg-gray-700 border-gray-700 text-white"
                                                : "bg-gray-100"
                                            }`}
                                        >
                                            +63
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="Phone Number"
                                            className={`p-4 border rounded-r flex-1 ${
                                                theme === "dark"
                                                ? "bg-gray-900 border-gray-700 text-white"
                                                : "bg-white text-gray-700"
                                            }`}
                                            defaultValue="981567839"
                                        />
                                    </div>
                                </div>
                                <div
                                    className={`p-4 border rounded col-span-2 ${
                                        theme === "dark"
                                        ? "bg-gray-900 border-gray-700 text-white"
                                        : "bg-gray-100 text-gray-700"
                                    } cursor-default select-none`}
                                >
                                    {role || "No Role Assigned"}
                                </div>
                                <div className="flex justify-center col-span-2">
                                    <button
                                        type="submit"
                                        className="bg-blue-600 text-white py-2 rounded mt-4 w-32 hover:bg-blue-700 transition"
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
                                    {/* Profile Picture with Edit Button */}
                                    <div className="relative mb-3 mt-5">
                                        {profilePicturePreview ? (
                                            <img 
                                                src={profilePicturePreview} 
                                                alt="Profile" 
                                                className="w-36 h-36 rounded-full border-4 border-blue-500 object-cover"
                                            />
                                        ) : (
                                            <div className="w-36 h-36 rounded-full border-4 border-blue-500 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                                                {userData ? getUserInitials(userData.name) : '?'}
                                            </div>
                                        )}
                                        
                                        {/* Camera Icon Button */}
                                        <button
                                            type="button"
                                            onClick={handleProfilePictureClick}
                                            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition"
                                            title="Change profile picture"
                                        >
                                            <Camera className="w-5 h-5" />
                                        </button>
                                        
                                        {/* Hidden File Input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProfilePictureChange}
                                            className="hidden"
                                        />
                                    </div>
                                    
                                    <h3 className="font-bold text-2xl mb-3">{userData?.name || 'Loading...'}</h3>
                                    <p className={`text-sm text-xl mb-1 ${ theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>{country}</p>

                                    <p className={`text-sm text-xl mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>{nationality || "Filipino"}</p>
                                </div>

                                {/* Divider line */}
                                <hr className={`my-7 border-t w-[350px] mx-auto ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`} />
                                <div className="flex flex-col items-center space-y-3 text-xl">
                                    {/* Role */}
                                    <div className="flex items-center gap-2">
                                        <User className="w-5 h-5" />
                                        <p>{userData?.role || 'No role assigned'}</p>
                                    </div>

                                    {/* On-Track */}
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        <p>On-Track</p>
                                    </div>
                                </div>
                                {/* Divider line */}
                                <hr className={`my-7 border-t w-[350px] mx-auto ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`} />
                            </div>
                            <div className="flex flex-col items-center space-y-3 text-xl">
                                {/* Phone */}
                                <div className="flex items-center gap-2">
                                    <Phone className="w-5 h-5" />
                                    <p>+63 981567839</p>
                                </div>

                                {/* Email */}
                                <div className="flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    <p>{userData?.email || 'Loading...'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ✅ Bottom Section: UI Developer + Projects + Work Done */}
                <div className="grid grid-cols-12 gap-6 mt-6">
                    {/* UI Developer */}
                    <div className={`col-span-3 p-6 rounded-xl shadow border h-64 ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white"}`}>
                        <h3 className="font-bold text-2xl">{userData?.role || 'User'}</h3>
                        <p className={`text-base ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Leads projects and ensures tasks are completed efficiently.</p>
                        <h4 className="mt-3 font-semibold">Worked with</h4>
                        <div className="flex mt-6 gap-6 overflow-x-auto">
                            {[...Array(5)].map((_, i) => (
                                <img
                                    key={i}
                                    src={`https://i.pravatar.cc/40?img=${i + 1}`}
                                    className="w-12 h-12 rounded-full"
                                    alt={`Team member ${i + 1}`}
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