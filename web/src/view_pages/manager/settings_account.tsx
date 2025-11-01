import { useState, useEffect, useRef } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { Camera, Phone, Mail, User, TrendingUp, Lock, Edit2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { EmailChangeService } from "../../services/EmailChangeService";

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

    // Email change state
    const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
    const [emailChangeStep, setEmailChangeStep] = useState<1 | 2 | 3>(1);
    const [emailChangePassword, setEmailChangePassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [emailOTP, setEmailOTP] = useState("");
    const [emailChangeMessage, setEmailChangeMessage] = useState("");
    const [emailChangeLoading, setEmailChangeLoading] = useState(false);

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


    const getUserInitials = (name: string) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    // Email change handlers
    const handleEmailChangePasswordVerify = async () => {
        if (!emailChangePassword) {
            setEmailChangeMessage("Please enter your password");
            return;
        }

        setEmailChangeLoading(true);
        setEmailChangeMessage("");

        try {
            const result = await EmailChangeService.verifyPassword(emailChangePassword);
            if (result.success) {
                setEmailChangeStep(2);
                setEmailChangeMessage("");
            } else {
                setEmailChangeMessage(result.message || "Password verification failed");
            }
        } catch (error) {
            setEmailChangeMessage("An error occurred. Please try again.");
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const handleEmailChangeRequest = async () => {
        if (!newEmail) {
            setEmailChangeMessage("Please enter a new email address");
            return;
        }

        if (newEmail.toLowerCase() === email.toLowerCase()) {
            setEmailChangeMessage("New email must be different from your current email");
            return;
        }

        setEmailChangeLoading(true);
        setEmailChangeMessage("");

        try {
            const result = await EmailChangeService.requestEmailChange(newEmail);
            if (result.success) {
                setEmailChangeStep(3);
                setEmailChangeMessage(result.message || "Verification code sent to your new email");
            } else {
                setEmailChangeMessage(result.message || "Failed to send verification code");
            }
        } catch (error) {
            setEmailChangeMessage("An error occurred. Please try again.");
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const handleEmailChangeVerify = async () => {
        if (emailOTP.length !== 6) {
            setEmailChangeMessage("Please enter a valid 6-digit code");
            return;
        }

        setEmailChangeLoading(true);
        setEmailChangeMessage("");

        try {
            const result = await EmailChangeService.verifyEmailChange(newEmail, emailOTP);
            if (result.success) {
                setEmailChangeMessage(result.message || "Email updated successfully!");
                // Update local state
                setEmail(result.new_email || newEmail);
                if (userData) {
                    setUserData({ ...userData, email: result.new_email || newEmail });
                }
                
                // Refresh user data
                const token = sessionStorage.getItem("token");
                if (token) {
                    const response = await fetch(`${API_BASE_URL}/user/me/`, {
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                        setEmail(data.email);
                        
                        // Dispatch event to update other components
                        window.dispatchEvent(
                            new CustomEvent("userDataUpdated", {
                                detail: {
                                    name: data.name,
                                    email: data.email,
                                    role: data.role,
                                    profile_picture: data.profile_picture,
                                },
                            })
                        );
                    }
                }

                // Close modal after 2 seconds
                setTimeout(() => {
                    setShowEmailChangeModal(false);
                    setEmailChangeStep(1);
                    setEmailChangePassword("");
                    setNewEmail("");
                    setEmailOTP("");
                    setEmailChangeMessage("");
                }, 2000);
                } else {
                setEmailChangeMessage(result.message || "Verification failed");
            }
        } catch (error) {
            setEmailChangeMessage("An error occurred. Please try again.");
        } finally {
            setEmailChangeLoading(false);
        }
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
                                        <div className="flex items-center justify-between mb-2">
                                            <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                            Email Address
                                        </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowEmailChangeModal(true);
                                                    setEmailChangeStep(1);
                                                    setEmailChangePassword("");
                                                    setNewEmail("");
                                                    setEmailOTP("");
                                                    setEmailChangeMessage("");
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                    theme === "dark"
                                                        ? "text-blue-400 hover:bg-blue-900/20 hover:text-blue-300"
                                                        : "text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                                }`}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                                Change Email
                                            </button>
                                        </div>
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
                                            Click "Change Email" to update your email address
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
                </main>
            </div>

            {/* Email Change Modal */}
            {showEmailChangeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg p-6 max-w-md w-full mx-4 relative max-h-[90vh] overflow-y-auto`}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                Change Email Address
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEmailChangeModal(false);
                                    setEmailChangeStep(1);
                                    setEmailChangePassword("");
                                    setNewEmail("");
                                    setEmailOTP("");
                                    setEmailChangeMessage("");
                                }}
                                className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className={`flex-1 h-2 rounded-full ${emailChangeStep >= 1 ? (theme === "dark" ? "bg-blue-600" : "bg-blue-500") : (theme === "dark" ? "bg-gray-700" : "bg-gray-200")}`}></div>
                            <div className={`flex-1 h-2 rounded-full ${emailChangeStep >= 2 ? (theme === "dark" ? "bg-blue-600" : "bg-blue-500") : (theme === "dark" ? "bg-gray-700" : "bg-gray-200")}`}></div>
                            <div className={`flex-1 h-2 rounded-full ${emailChangeStep >= 3 ? (theme === "dark" ? "bg-blue-600" : "bg-blue-500") : (theme === "dark" ? "bg-gray-700" : "bg-gray-200")}`}></div>
                        </div>

                        {/* Message Display */}
                        {emailChangeMessage && (
                            <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 ${
                                emailChangeMessage.includes("error") || emailChangeMessage.includes("Error") || emailChangeMessage.includes("failed") || emailChangeMessage.includes("Failed") || emailChangeMessage.includes("Invalid") || emailChangeMessage.includes("incorrect")
                                    ? theme === "dark"
                                        ? "bg-red-900/20 border border-red-700/50 text-red-200"
                                        : "bg-red-50 border border-red-200 text-red-800"
                                    : theme === "dark"
                                        ? "bg-green-900/20 border border-green-700/50 text-green-200"
                                        : "bg-green-50 border border-green-200 text-green-800"
                            }`}>
                                {emailChangeMessage.includes("error") || emailChangeMessage.includes("Error") || emailChangeMessage.includes("failed") || emailChangeMessage.includes("Failed") || emailChangeMessage.includes("Invalid") || emailChangeMessage.includes("incorrect") ? (
                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                )}
                                <p className="text-sm flex-1">{emailChangeMessage}</p>
                            </div>
                        )}

                        {/* Step 1: Password Verification */}
                        {emailChangeStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                        For security reasons, please enter your current password to proceed with changing your email address.
                                    </p>
                                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        value={emailChangePassword}
                                        onChange={(e) => setEmailChangePassword(e.target.value)}
                                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                            theme === "dark"
                                                ? "bg-gray-900 border-gray-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
                                        placeholder="Enter your password"
                                        disabled={emailChangeLoading}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && emailChangePassword && !emailChangeLoading) {
                                                handleEmailChangePasswordVerify();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setShowEmailChangeModal(false);
                                            setEmailChangeStep(1);
                                            setEmailChangePassword("");
                                            setEmailChangeMessage("");
                                        }}
                                        disabled={emailChangeLoading}
                                        className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                                            theme === "dark"
                                                ? "border-gray-700 hover:bg-gray-700 text-gray-300"
                                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                                        } disabled:opacity-50`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEmailChangePasswordVerify}
                                        disabled={!emailChangePassword || emailChangeLoading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {emailChangeLoading ? "Verifying..." : "Continue"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: New Email Input */}
                        {emailChangeStep === 2 && (
                            <div className="space-y-4">
                                <div>
                                    <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                        Enter your new email address. We'll send a verification code to confirm ownership.
                                    </p>
                                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                        New Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value.toLowerCase())}
                                        className={`w-full px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                            theme === "dark"
                                                ? "bg-gray-900 border-gray-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
                                        placeholder="Enter new email address"
                                        disabled={emailChangeLoading}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && newEmail && !emailChangeLoading) {
                                                handleEmailChangeRequest();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setEmailChangeStep(1);
                                            setEmailChangePassword("");
                                            setNewEmail("");
                                            setEmailChangeMessage("");
                                        }}
                                        disabled={emailChangeLoading}
                                        className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                                            theme === "dark"
                                                ? "border-gray-700 hover:bg-gray-700 text-gray-300"
                                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                                        } disabled:opacity-50`}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleEmailChangeRequest}
                                        disabled={!newEmail || newEmail === email.toLowerCase() || emailChangeLoading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {emailChangeLoading ? "Sending..." : "Send Code"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: OTP Verification */}
                        {emailChangeStep === 3 && (
                            <div className="space-y-4">
                                <div>
                                    <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                        Enter the 6-digit verification code sent to <strong>{newEmail}</strong>
                                    </p>
                                    <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={emailOTP}
                                        onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className={`w-full px-4 py-2.5 border-2 rounded-lg text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                            theme === "dark"
                                                ? "bg-gray-900 border-gray-700 text-white"
                                                : "bg-white border-gray-300 text-gray-900"
                                        }`}
                                        placeholder="000000"
                                        maxLength={6}
                                        disabled={emailChangeLoading}
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && emailOTP.length === 6 && !emailChangeLoading) {
                                                handleEmailChangeVerify();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleEmailChangeRequest}
                                        disabled={emailChangeLoading}
                                        className={`mt-2 text-sm ${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} disabled:opacity-50`}
                                    >
                                        Resend code
                                    </button>
                                </div>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setEmailChangeStep(2);
                                            setEmailOTP("");
                                            setEmailChangeMessage("");
                                        }}
                                        disabled={emailChangeLoading}
                                        className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                                            theme === "dark"
                                                ? "border-gray-700 hover:bg-gray-700 text-gray-300"
                                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                                        } disabled:opacity-50`}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleEmailChangeVerify}
                                        disabled={emailOTP.length !== 6 || emailChangeLoading}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {emailChangeLoading ? "Verifying..." : "Verify & Update"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSettings;