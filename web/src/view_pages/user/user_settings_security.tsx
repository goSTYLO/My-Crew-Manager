//user_settings_security.tsx
import { useState, useEffect } from "react";
import Sidebar from "../../components/sidebarUser"; 
import SettingsNavigation from "../../components/sidebarNavLayout_user"; 
import TopNavbar from "../../components/topbarLayout_user";
import { useTheme } from "../../components/themeContext";
import { TwoFactorService, type TwoFAStatus } from "../../services/TwoFactorService";
import Disable2FAModal from "../../components/Disable2FAModal";
import { 
  Shield, 
  Lock, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Eye, 
  EyeOff,
  AlertCircle,
  Copy,
  Check,
  Smartphone,
  X
} from "lucide-react";

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
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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
              <div className={`max-w-8xl mx-auto ${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-2xl shadow-lg border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} overflow-hidden`}>
                {/* Header */}
                <div className={`px-8 py-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Security Settings
                    </h1>
                  </div>
                  <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"} ml-12`}>
                    Manage your account security and privacy preferences
                  </p>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Message Display */}
                  {message && (
                    <div className={`mb-6 rounded-xl p-4 flex items-start gap-3 border ${
                      message.type === 'error'
                        ? theme === "dark" 
                          ? "bg-red-900/20 border-red-700/50 text-red-200" 
                          : "bg-red-50 border-red-200 text-red-800"
                        : theme === "dark" 
                          ? "bg-green-900/20 border-green-700/50 text-green-200" 
                          : "bg-green-50 border-green-200 text-green-800"
                    }`}>
                      {message.type === 'error' ? (
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-medium flex-1">{message.text}</p>
                      <button
                        onClick={() => setMessage(null)}
                        className={`flex-shrink-0 ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
                        aria-label="Close message"
                        title="Close message"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-8">
                    {/* Two-Factor Authentication Card */}
                    <div className={`rounded-xl border ${theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"} p-6`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${theme === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              Two-Factor Authentication
                            </h2>
                            <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              Add an extra layer of security using Microsoft Authenticator
                            </p>
                          </div>
                        </div>
                        {twoFAStatus?.enabled && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            theme === "dark" ? "bg-green-900/30 text-green-300 border border-green-700/50" : "bg-green-100 text-green-800 border border-green-200"
                          }`}>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Active</span>
                          </div>
                        )}
                      </div>

                      {loading && !showQRCode && (
                        <div className={`flex items-center gap-2 py-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm">Loading...</span>
                        </div>
                      )}

                      {twoFAStatus?.enabled ? (
                        <div className="space-y-4">
                          <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"} border ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className={`w-4 h-4 ${theme === "dark" ? "text-green-400" : "text-green-600"}`} />
                              <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                                Your account is protected with two-factor authentication
                              </p>
                            </div>
                            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              You'll be required to enter a verification code from your authenticator app when signing in.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowDisableModal(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow"
                          >
                            <Lock className="w-4 h-4" />
                            <span>Disable 2FA</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {!showQRCode ? (
                            <button
                              onClick={handleEnable2FA}
                              disabled={loading}
                              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Shield className="w-4 h-4" />
                              <span>{loading ? "Loading..." : "Enable Two-Factor Authentication"}</span>
                            </button>
                          ) : (
                            <div className="space-y-6">
                              {/* QR Code Section */}
                              <div className={`p-6 rounded-xl border ${theme === "dark" ? "bg-gray-700/30 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                                <div className="flex flex-col items-center space-y-4">
                                  <div className={`p-6 rounded-xl ${theme === "dark" ? "bg-white" : "bg-white"} shadow-lg border-2 ${theme === "dark" ? "border-gray-600" : "border-gray-200"}`}>
                                    {qrCodeData?.qr_code && (
                                      <img 
                                        src={qrCodeData.qr_code} 
                                        alt="2FA QR Code" 
                                        className="w-56 h-56"
                                      />
                                    )}
                                  </div>
                                  <div className="text-center space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                      <Smartphone className={`w-5 h-5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
                                      <p className={`text-base font-semibold ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                                        Scan with Microsoft Authenticator
                                      </p>
                                    </div>
                                    {qrCodeData?.secret && (
                                      <div className={`mt-4 p-3 rounded-lg border ${theme === "dark" ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}`}>
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                          <p className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                                            Or enter this code manually:
                                          </p>
                                          <button
                                            onClick={() => copyToClipboard(qrCodeData.secret)}
                                            className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${theme === "dark" ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-800"}`}
                                            title="Copy to clipboard"
                                          >
                                            {copied ? (
                                              <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                        <code className={`block font-mono text-sm px-3 py-2 rounded ${theme === "dark" ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                                          {showSecret ? qrCodeData.secret : "•".repeat(qrCodeData.secret.length)}
                                        </code>
                                        <button
                                          onClick={() => setShowSecret(!showSecret)}
                                          className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                                        >
                                          {showSecret ? (
                                            <>
                                              <EyeOff className="w-3.5 h-3.5" />
                                              <span>Hide</span>
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="w-3.5 h-3.5" />
                                              <span>Show</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Verification Code Input */}
                              <div>
                                <label htmlFor="verification-code" className={`flex items-center gap-2 text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                                  <QrCode className="w-4 h-4" />
                                  <span>Enter 6-digit verification code</span>
                                </label>
                                <div className="relative">
                                  <input
                                    id="verification-code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className={`w-full px-4 py-3 border-2 rounded-lg text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                      theme === "dark" 
                                        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-600" 
                                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                                    }`}
                                    placeholder="000000"
                                    maxLength={6}
                                    disabled={loading}
                                    autoFocus
                                  />
                                </div>
                                <p className={`mt-2 text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                                  Enter the code displayed in your authenticator app
                                </p>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-3">
                                <button
                                  onClick={handleVerifySetup}
                                  disabled={verificationCode.length !== 6 || loading}
                                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {loading ? (
                                    <>
                                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      <span>Verifying...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-5 h-5" />
                                      <span>Verify & Enable</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={handleCancelSetup}
                                  disabled={loading}
                                  className={`px-5 py-3 border-2 rounded-lg font-medium transition-all ${theme === "dark" ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Session Timeout Card */}
                    <div className={`rounded-xl border ${theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"} p-6`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-lg ${theme === "dark" ? "bg-orange-900/30 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            Session Timeout
                          </h2>
                          <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            Automatically log out after a period of inactivity
                          </p>
                        </div>
                      </div>
                      <select 
                        className={`w-full md:w-64 px-4 py-2.5 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                        defaultValue="30"
                        aria-label="Session timeout duration"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    {/* Public Profile Card */}
                    <div className={`rounded-xl border ${theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white"} p-6`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-lg ${theme === "dark" ? "bg-purple-900/30 text-purple-400" : "bg-purple-100 text-purple-600"}`}>
                          <Eye className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            Public Profile Visibility
                          </h2>
                          <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                            Control whether your profile information is visible to other users
                          </p>
                        </div>
                      </div>
                      <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        theme === "dark" 
                          ? "border-gray-700 hover:border-gray-600 bg-gray-900/50" 
                          : "border-gray-200 hover:border-gray-300 bg-gray-50"
                      }`}>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                        />
                        <span className={`font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                          Allow public profile
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Disable 2FA Modal */}
      <Disable2FAModal
        isOpen={showDisableModal}
        onClose={() => {
          setShowDisableModal(false);
          setDisablePassword("");
          setMessage(null);
        }}
        theme={theme}
        disablePassword={disablePassword}
        setDisablePassword={setDisablePassword}
        onDisable={handleDisable2FA}
        loading={loading}
      />
    </div>
  );
};

export default SecuritySettings;
