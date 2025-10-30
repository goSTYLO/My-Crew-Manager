// components/TermsAcceptedModal.tsx
import React from "react";
import { CheckCircle, Users, BarChart3, Shield } from "lucide-react";

interface TermsAcceptedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAcceptedModal: React.FC<TermsAcceptedModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-[#1a5f7a] to-[#2c7a9e] px-8 pt-8 pb-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
            <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-white text-center">Terms Accepted</h3>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <p className="text-gray-600 text-center leading-relaxed mb-6">
            Thank you for reviewing and accepting our Terms and Conditions. You can now create your account.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-[#1a5f7a]/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-[#1a5f7a]" />
              </div>
              <span>Your data is protected and secure</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-[#1a5f7a]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-[#1a5f7a]" />
              </div>
              <span>Full access to collaboration tools</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-lg bg-[#1a5f7a]/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-[#1a5f7a]" />
              </div>
              <span>Advanced analytics and reporting</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 rounded-lg bg-[#1a5f7a] text-white hover:bg-[#154d63] font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Continue
          </button>
        </div>

        {/* Footer note */}
        <div className="px-8 pb-6">
          <p className="text-xs text-gray-500 text-center">
            You can review our terms anytime in your account settings
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsAcceptedModal;