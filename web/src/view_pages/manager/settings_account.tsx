import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { Camera, Phone, Mail, User, TrendingUp, Lock, Trash2 } from "lucide-react";
import DeleteAccountModal from "../../components/DeleteAccountModal";

interface UserData {
    user_id: string;
    name: string;
    email: string;
    role: string | null;
    profile_picture?: string | null;
}

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
    const [role, setRole] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [country, setCountry] = useState("Philippines");

    // Delete account modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteEmail, setDeleteEmail] = useState("");
    const [deleteSuccess, setDeleteSuccess] = useState(false);

    const nationalities = [
        "Filipino", "American", "Canadian", "British", "Australian",
        "Japanese", "Korean", "Chinese", "Indian", "Singaporean"
    ];

    const nationalityToCountryMap: Record<string, string> = {
        Filipino: "Philippines", American: "United States", Canadian: "Canada",
        British: "United Kingdom", Australian: "Australia", Japanese: "Japan",
        Korean: "South Korea", Chinese: "China", Indian: "India", Singaporean: "Singapore",
    };

    useEffect(() => {
        const mappedCountry = nationalityToCountryMap[nationality];
        if (mappedCountry) setCountry(mappedCountry);
    }, [nationality]);

    useEffect(() => {
        const storedCountry = localStorage.getItem("user_country");
        if (storedCountry) setCountry(storedCountry);
    }, []);

    useEffect(() => {
        localStorage.setItem("user_country", country);
    }, [country]);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                navigate("/signin");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/user/me/`, {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
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
                    navigate("/signin");
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setSaveMessage("Error: Image size should be less than 5MB");
                return;
            }
            if (!file.type.startsWith('image/')) {
                setSaveMessage("Error: Please upload an image file");
                return;
            }
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfilePicturePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleProfilePictureClick = () => fileInputRef.current?.click();

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveMessage("");

        const token = sessionStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        try {
            const fullName = `${firstName} ${lastName}`.trim();
            const formData = new FormData();
            formData.append("name", fullName);
            formData.append("nationality", nationality);

            if (phoneNumber.trim() !== "") {
                formData.append("phone_number", phoneNumber);
            }

            if (profilePicture) {
                formData.append("profile_picture", profilePicture);
            }

            const response = await fetch(`${API_BASE_URL}/user/me/`, {
                method: "PUT",
                headers: { Authorization: `Token ${token}` },
                body: formData,
            });

            if (response.ok) {
                const updatedData = await response.json();
                const updatedProfilePictureURL = updatedData.profile_picture
                    ? updatedData.profile_picture.startsWith("http")
                        ? updatedData.profile_picture
                        : `${API_BASE_URL}${updatedData.profile_picture}`
                    : null;

                setUserData({ ...updatedData, profile_picture: updatedProfilePictureURL });
                if (updatedProfilePictureURL) {
                    setProfilePicturePreview(updatedProfilePictureURL);
                }

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

    const handleDeleteAccount = async () => {
        // Reset previous errors
        setDeleteError("");

        // Validate inputs
        if (!deleteEmail.trim()) {
            setDeleteError("Please enter your email address");
            return;
        }

        if (!deletePassword.trim()) {
            setDeleteError("Please enter your password to confirm deletion");
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(deleteEmail)) {
            setDeleteError("Please enter a valid email address");
            return;
        }

        // Check if email matches
        if (deleteEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
            setDeleteError("Email does not match your account");
            return;
        }

        setIsDeleting(true);

        const token = sessionStorage.getItem("token");
        if (!token) {
            navigate("/signin");
            return;
        }

        try {
            console.log("Attempting to delete account with email:", deleteEmail.trim());
            
            const deleteResponse = await fetch(`${API_BASE_URL}/user/delete/`, {
                method: "POST",
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: deleteEmail.trim(),
                    password: deletePassword
                }),
            });

            console.log("Delete response status:", deleteResponse.status);

            if (deleteResponse.ok) {
                const responseData = await deleteResponse.json();
                console.log("Delete success:", responseData);
                
                // Clear authentication
                sessionStorage.removeItem("token");
                localStorage.removeItem("user_country");
                localStorage.removeItem("user_nationality");
                localStorage.clear();
                
                // Show success state
                setDeleteSuccess(true);
                setDeleteError("");
                
                // Redirect after showing success message
                setTimeout(() => {
                    navigate("/signin", { 
                        state: { 
                            message: "Your account has been successfully deleted",
                            type: "success"
                        } 
                    });
                }, 2000);
                
            } else {
                const rawBody = await deleteResponse.text().catch(() => "");
                let parsedBody: any = {};
                try {
                    parsedBody = rawBody ? JSON.parse(rawBody) : {};
                } catch {
                    // ignore JSON parse error; fall back to raw text
                }

                const serverMessage = (parsedBody && (parsedBody.error || parsedBody.detail || parsedBody.message)) || rawBody || "Unknown error occurred";
                console.error("Delete error response:", {
                    status: deleteResponse.status,
                    statusText: deleteResponse.statusText,
                    body: rawBody,
                    parsed: parsedBody,
                });
                
                // Handle specific error cases
                if (deleteResponse.status === 401) {
                    setDeleteError("Incorrect password. Please try again.");
                } else if (deleteResponse.status === 400) {
                    setDeleteError(serverMessage || "Invalid request. Please check your email and password.");
                } else if (deleteResponse.status === 429) {
                    setDeleteError("Too many attempts. Please try again later.");
                } else if (deleteResponse.status === 500) {
                    setDeleteError(serverMessage || "Server error. Please try again later or contact support.");
                } else {
                    setDeleteError(serverMessage || "Failed to delete account. Please try again.");
                }
            }
        } catch (error) {
            console.error("Failed to delete account:", error);
            setDeleteError("Network error. Please check your connection and try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const getUserInitials = (name: string) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
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
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex-1 flex flex-col min-w-0">
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
                    <div className="grid grid-cols-12 gap-6 mb-6">
                        <div className="col-span-2">
                            <SettingsNavigation />
                        </div>

                        <div className="col-span-7">
                            <div className={`p-8 rounded-xl shadow-lg border h-full ${theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="mb-8">
                                    <h2 className={`text-3xl font-semibold mb-2 mt-3 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                                        Edit Profile
                                    </h2>
                                    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                        Update your personal information and profile settings
                                    </p>
                                </div>

                                {saveMessage && (
                                    <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${saveMessage.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                                        <span className="font-medium">{saveMessage}</span>
                                    </div>
                                )}

                                <form className="space-y-10" onSubmit={handleSaveChanges}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                First Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter first name"
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter last name"
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                className={`w-full p-3 pr-10 border rounded-lg cursor-not-allowed ${theme === "dark" ? "bg-gray-900/50 border-gray-700 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-600"}`}
                                                value={email}
                                                disabled
                                                readOnly
                                            />
                                            <Lock className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
                                        </div>
                                        <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                                            Email cannot be changed for security reasons
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="nationality-select" className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                Nationality
                                            </label>
                                            <select
                                                id="nationality-select"
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                                                value={nationality}
                                                onChange={(e) => {
                                                    setNationality(e.target.value);
                                                    localStorage.setItem("user_nationality", e.target.value);
                                                }}
                                            >
                                                <option value="">Select Nationality</option>
                                                {nationalities.map((nation) => (
                                                    <option key={nation} value={nation}>{nation}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                Phone Number <span className={`text-xs font-normal ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>(Optional)</span>
                                            </label>
                                            <div className="flex">
                                                <span className={`flex items-center px-3 border border-r-0 rounded-l-lg ${theme === "dark" ? "bg-gray-900 border-gray-700 text-gray-400" : "bg-gray-50 border-gray-300 text-gray-600"}`}>
                                                    +63
                                                </span>
                                                <input
                                                    type="text"
                                                    placeholder="9XX XXX XXXX"
                                                    className={`w-full p-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                                                        theme === "dark"
                                                            ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                                                            : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                                                    }`}
                                                    value={phoneNumber}
                                                    onChange={(e) => {
                                                        // Allow only numbers
                                                        const numericValue = e.target.value.replace(/[^0-9]/g, "");
                                                        setPhoneNumber(numericValue);
                                                    }}
                                                    inputMode="numeric"
                                                    maxLength={10}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                            Role
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className={`w-full p-3 pr-10 border rounded-lg cursor-not-allowed ${theme === "dark" ? "bg-gray-900/50 border-gray-700 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-600"}`}
                                                value={role || "No Role Assigned"}
                                                disabled
                                                readOnly
                                            />
                                            <Lock className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
                                        </div>
                                        <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                                            Role is assigned by administrators
                                        </p>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-sm hover:shadow-md"
                                        >
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDeleteModal(true);
                                                setDeleteEmail("");
                                                setDeletePassword("");
                                                setDeleteError("");
                                                setDeleteSuccess(false);
                                            }}
                                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 shadow-sm hover:shadow-md"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                            Delete Account
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Profile Card - Same as before */}
                        <div className="col-span-3">
                            <div className={`rounded-xl shadow-lg border overflow-hidden h-full flex flex-col ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 h-[110px]">
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                                    
                                    <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
                                        <div className="relative">
                                            {profilePicturePreview ? (
                                                <img
                                                    src={profilePicturePreview}
                                                    alt="Profile"
                                                    className="w-40 h-40 rounded-full border-[6px] border-white shadow-2xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-40 h-40 rounded-full border-[6px] border-white shadow-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                                                    {userData ? getUserInitials(userData.name) : '?'}
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={handleProfilePictureClick}
                                                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-xl transition-all hover:scale-110 border-4 border-white"
                                                title="Change profile picture"
                                            >
                                                <Camera className="w-5 h-5" />
                                            </button>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleProfilePictureChange}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col pt-24 px-7 pb-7">
                                    <div className="text-center mb-7">
                                        <h3 className={`font-bold text-2xl mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                            {userData?.name || 'Loading...'}
                                        </h3>
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-2 ${theme === "dark" ? "bg-gray-900/50" : "bg-blue-50"}`}>
                                            <svg className={`w-4 h-4 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                                {country}
                                            </p>
                                        </div>
                                        <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                            {nationality || "Filipino"}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-7">
                                        <div className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${theme === "dark" ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700" : "bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"}`}>
                                            <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"}`}>
                                                <User className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                                            </div>
                                            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Role</p>
                                            <p className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                {userData?.role || 'Not Set'}
                                            </p>
                                        </div>
                                        <div className={`p-4 rounded-xl text-center transition-all hover:scale-105 ${theme === "dark" ? "bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700" : "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100"}`}>
                                            <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-green-500/20" : "bg-green-100"}`}>
                                                <TrendingUp className={`w-5 h-5 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
                                            </div>
                                            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Status</p>
                                            <p className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                On-Track
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative mb-7">
                                        <hr className={`${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />
                                        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
                                            <svg className={`w-5 h-5 ${theme === "dark" ? "text-gray-600" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
                                                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-5">
                                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                            <div className={`w-1 h-4 rounded-full ${theme === "dark" ? "bg-blue-500" : "bg-blue-600"}`}></div>
                                            Contact Information
                                        </h4>
                                        
                                        <div className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] ${theme === "dark" ? "bg-gray-900/50 hover:bg-gray-900" : "bg-gray-50 hover:bg-gray-100"}`}>
                                            <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-100"}`}>
                                                <Phone className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                                    Phone Number
                                                </p>
                                                <p className={`text-base font-semibold truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                                    {phoneNumber ? `+63 ${phoneNumber}` : '+63  9XX XXX XXXX (Not Set)'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.02] ${theme === "dark" ? "bg-gray-900/50 hover:bg-gray-900" : "bg-gray-50 hover:bg-gray-100"}`}>
                                            <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-purple-500/20" : "bg-purple-100"}`}>
                                                <Mail className={`w-5 h-5 ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                                    Email Address
                                                </p>
                                                <p className={`text-base font-semibold truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`} title={userData?.email}>
                                                    {userData?.email || 'Loading...'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-12 gap-6 mt-6">
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

                        <div className="col-span-9 grid grid-cols-2 gap-6">
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

            {/* Delete Account Modal */}
            <DeleteAccountModal
            showDeleteModal={showDeleteModal}
            setShowDeleteModal={setShowDeleteModal}
            theme={theme}
            email={email}
            deleteEmail={deleteEmail}
            setDeleteEmail={setDeleteEmail}
            deletePassword={deletePassword}
            setDeletePassword={setDeletePassword}
            deleteError={deleteError}
            setDeleteError={setDeleteError}
            deleteSuccess={deleteSuccess}
            setDeleteSuccess={setDeleteSuccess}
            isDeleting={isDeleting}
            handleDeleteAccount={handleDeleteAccount}
            />
        </div>
    );
};

export default AccountSettings;