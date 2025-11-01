//settings_security.tsx
import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebarLayout";
import SettingsNavigation from "../../components/sidebarNavLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";
import { TwoFactorService, type TwoFAStatus } from "../../services/TwoFactorService";

const SecuritySettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFAStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ qr_code: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);

  useEffect(() => {
    load2FAStatus();
  }, []);

  const load2FAStatus = async () => {
    try {
      setLoading(true);
      const status = await TwoFactorService.get2FAStatus();
      setTwoFAStatus(status);
    } catch (error) {
      console.error("Failed to load 2FA status:", error);
      setMessage({
        text: error instanceof Error ? error.message : "Failed to load 2FA status",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const response = await TwoFactorService.enable2FA();
      setQrCodeData({
        qr_code: response.qr_code,
        secret: response.secret,
      });
      setShowQRCode(true);
      setMessage({
        text: "Scan the QR code with Microsoft Authenticator, then enter the verification code below",
        type: "success",
      });
    } catch (error) {
      console.error("Failed to enable 2FA:", error);
      setMessage({
        text: error instanceof Error ? error.message : "Failed to enable 2FA",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySetup = async () => {
    if (verificationCode.length !== 6) {
      setMessage({ text: "Please enter a valid 6-digit code", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await TwoFactorService.verify2FASetup(verificationCode);
      setMessage({ text: "2FA has been enabled successfully!", type: "success" });
      setShowQRCode(false);
      setQrCodeData(null);
      setVerificationCode("");
      await load2FAStatus();
    } catch (error) {
      console.error("Failed to verify 2FA setup:", error);
      setMessage({
        text: error instanceof Error ? error.message : "Invalid verification code",
        type: "error",
      });
      setVerificationCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      setMessage({ text: "Please enter your password", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await TwoFactorService.disable2FA(disablePassword);
      setMessage({ text: "2FA has been disabled successfully", type: "success" });
      setShowDisableModal(false);
      setDisablePassword("");
      await load2FAStatus();
    } catch (error) {
      console.error("Failed to disable 2FA:", error);
      setMessage({
        text: error instanceof Error ? error.message : "Failed to disable 2FA",
        type: "error",
      });
      setDisablePassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setShowQRCode(false);
    setQrCodeData(null);
    setVerificationCode("");
    setMessage(null);
    load2FAStatus();
  };

  return (
    <div className={`flex min-h-screen w-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-[100px] overflow-auto space-y-[40px]">
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Settings Sidebar */}
            <div className="col-span-2">
              <SettingsNavigation />
            </div>

            {/* Page Content */}
            <div className="col-span-10">
              <div className={`max-w-8xl mx-auto p-6 rounded-xl shadow ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"}`}>
                <h1 className={`text-2xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  Security Settings
                </h1>
                <p className={`mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  Manage your privacy and security preferences.
                </p>

                {/* Message Display */}
                {message && (
                  <div className={`mb-4 rounded-lg p-4 ${
                    message.type === 'error'
                      ? theme === "dark" ? "bg-red-900/30 border border-red-700 text-red-200" : "bg-red-50 border border-red-200 text-red-800"
                      : theme === "dark" ? "bg-green-900/30 border border-green-700 text-green-200" : "bg-green-50 border border-green-200 text-green-800"
                  }`}>
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Two-Factor Authentication */}
                  <div>
                    <h2 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Two-Factor Authentication
                    </h2>
                    <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Add an extra layer of security to your account using Microsoft Authenticator.
                    </p>
                    
                    {loading && (
                      <div className="mb-3">
                        <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Loading...</span>
                      </div>
                    )}

                    {twoFAStatus?.enabled ? (
                      <div className="space-y-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          theme === "dark" ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-800"
                        }`}>
                          <span>✓</span>
                          <span>2FA is enabled</span>
                        </div>
                        <div>
                          <button
                            onClick={() => setShowDisableModal(true)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Disable 2FA
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {!showQRCode ? (
                          <button
                            onClick={handleEnable2FA}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {loading ? "Loading..." : "Enable 2FA"}
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex flex-col items-center space-y-4">
                              <div className={`p-4 rounded-lg flex justify-center ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                                {qrCodeData?.qr_code && (
                                  <img 
                                    src={qrCodeData.qr_code} 
                                    alt="2FA QR Code" 
                                    className="w-48 h-48"
                                  />
                                )}
                              </div>
                              <div className="text-center">
                                <p className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                                  Scan with Microsoft Authenticator
                                </p>
                                {qrCodeData?.secret && (
                                  <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                    Or enter manually: <code className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">{qrCodeData.secret}</code>
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor="verification-code" className={`block text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                                Enter 6-digit verification code
                              </label>
                              <input
                                id="verification-code"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                  theme === "dark" 
                                    ? "bg-gray-900 border-gray-700 text-white" 
                                    : "border-gray-300"
                                }`}
                                placeholder="000000"
                                maxLength={6}
                                disabled={loading}
                              />
                            </div>
                            
                            <div className="flex gap-3">
                              <button
                                onClick={handleVerifySetup}
                                disabled={verificationCode.length !== 6 || loading}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {loading ? "Verifying..." : "Verify & Enable"}
                              </button>
                              <button
                                onClick={handleCancelSetup}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Session Timeout */}
                  <div>
                    <h2 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Session Timeout
                    </h2>
                    <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Automatically log out after inactivity.
                    </p>
                    <select className={`mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "border-gray-300"}`}>
                      <option value="15">15 minutes</option>
                      <option value="30" defaultValue>
                        30 minutes
                      </option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>

                  {/* Public Profile */}
                  <div>
                    <h2 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                      Public Profile
                    </h2>
                    <p className={`text-sm mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      Control whether your profile is visible to others.
                    </p>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 text-blue-600" />
                      <span className={`${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>Allow public profile</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg p-6 max-w-md w-full mx-4`}>
            <h3 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Disable Two-Factor Authentication
            </h3>
            <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Enter your password to confirm you want to disable 2FA.
            </p>
            <div className="mb-4">
              <label htmlFor="disable-password" className={`block text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                Password
              </label>
              <input
                id="disable-password"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                  theme === "dark" 
                    ? "bg-gray-900 border-gray-700 text-white" 
                    : "border-gray-300"
                }`}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisablePassword("");
                  setMessage(null);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisable2FA}
                disabled={!disablePassword || loading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Disabling..." : "Disable 2FA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;
