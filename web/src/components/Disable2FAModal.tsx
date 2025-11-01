// Disable2FAModal.tsx
import { X, Lock, AlertCircle, XCircle } from "lucide-react";

interface Disable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  disablePassword: string;
  setDisablePassword: (password: string) => void;
  onDisable: () => void;
  loading: boolean;
}

const Disable2FAModal = ({
  isOpen,
  onClose,
  theme,
  disablePassword,
  setDisablePassword,
  onDisable,
  loading,
}: Disable2FAModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-2xl max-w-md w-full border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} overflow-hidden`}>
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Disable Two-Factor Authentication
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className={`mb-6 p-4 rounded-lg border ${theme === "dark" ? "bg-yellow-900/20 border-yellow-700/50 text-yellow-200" : "bg-yellow-50 border-yellow-200 text-yellow-800"}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Security Warning</p>
                <p>Disabling 2FA will make your account less secure. You'll only need your password to sign in.</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="disable-password" className={`flex items-center gap-2 text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
              <Lock className="w-4 h-4" />
              <span>Confirm your password</span>
            </label>
            <input
              id="disable-password"
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${
                theme === "dark" 
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" 
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
              }`}
              placeholder="Enter your password"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className={`flex-1 px-4 py-3 border-2 rounded-lg font-medium transition-all ${theme === "dark" ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}
            >
              Cancel
            </button>
            <button
              onClick={onDisable}
              disabled={!disablePassword || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Disabling...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  <span>Disable 2FA</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disable2FAModal;

