import { X, AlertTriangle, Mail, Lock } from "lucide-react";

// Add this import to your AccountSettings.tsx file:
// import DeleteAccountModal from "./DeleteAccountModal";

interface DeleteAccountModalProps {
    showDeleteModal: boolean;
    setShowDeleteModal: (show: boolean) => void;
    theme: string;
    email: string;
    deleteEmail: string;
    setDeleteEmail: (email: string) => void;
    deletePassword: string;
    setDeletePassword: (password: string) => void;
    deleteError: string;
    setDeleteError: (error: string) => void;
    deleteSuccess: boolean;
    setDeleteSuccess: (success: boolean) => void;
    isDeleting: boolean;
    handleDeleteAccount: () => void;
}

const DeleteAccountModal = ({
    showDeleteModal,
    setShowDeleteModal,
    theme,
    email,
    deleteEmail,
    setDeleteEmail,
    deletePassword,
    setDeletePassword,
    deleteError,
    setDeleteError,
    deleteSuccess,
    setDeleteSuccess,
    isDeleting,
    handleDeleteAccount,
}: DeleteAccountModalProps) => {
    if (!showDeleteModal) return null;

    const handleClose = () => {
        setShowDeleteModal(false);
        setDeleteEmail("");
        setDeletePassword("");
        setDeleteError("");
        setDeleteSuccess(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl shadow-2xl max-w-md w-full p-6 ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        Delete Account
                    </h3>
                    <button
                        onClick={handleClose}
                        className={`p-1 rounded-lg transition ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                        disabled={isDeleting || deleteSuccess}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {deleteSuccess ? (
                    <div className="text-center py-8">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h4 className="text-xl font-bold text-green-600 mb-2">Account Deleted Successfully</h4>
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            Redirecting you to sign in page...
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <p className="text-red-800 font-semibold mb-2">⚠️ Warning: This action cannot be undone!</p>
                                <p className="text-red-700 text-sm">
                                    Deleting your account will permanently remove all your data, including:
                                </p>
                                <ul className="text-red-700 text-sm list-disc list-inside mt-2 space-y-1">
                                    <li>Profile information</li>
                                    <li>Projects and tasks</li>
                                    <li>Activity history</li>
                                    <li>All associated data</li>
                                </ul>
                            </div>

                            <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                                Please confirm your identity by entering your email and password:
                            </p>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                        value={deleteEmail}
                                        onChange={(e) => {
                                            setDeleteEmail(e.target.value);
                                            setDeleteError("");
                                        }}
                                        disabled={isDeleting}
                                        autoFocus
                                    />
                                </div>
                                <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                                    Current email: {email}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} />
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`}
                                        value={deletePassword}
                                        onChange={(e) => {
                                            setDeletePassword(e.target.value);
                                            setDeleteError("");
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && deleteEmail.trim() && deletePassword.trim() && !isDeleting) {
                                                handleDeleteAccount();
                                            }
                                        }}
                                        disabled={isDeleting}
                                    />
                                </div>
                            </div>

                            {deleteError && (
                                <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm flex items-start gap-2">
                                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span>{deleteError}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleClose}
                                disabled={isDeleting}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"} ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || !deleteEmail.trim() || !deletePassword.trim()}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${isDeleting || !deleteEmail.trim() || !deletePassword.trim() ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                            >
                                {isDeleting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </span>
                                ) : (
                                    "Delete Account"
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default DeleteAccountModal;