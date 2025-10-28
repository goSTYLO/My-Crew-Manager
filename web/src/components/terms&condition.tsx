import React, { useState } from "react";
import {
  X,
  Shield,
  Users,
  FileText,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline?: () => void;
}

export default function TermsAndConditionsModal({
  isOpen,
  onClose,
  onAccept,
}: TermsAndConditionsModalProps) {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "services", label: "Services", icon: CheckCircle },
    { id: "privacy", label: "Privacy & Data", icon: Lock },
    { id: "user-conduct", label: "User Conduct", icon: Users },
    { id: "liability", label: "Liability", icon: Shield },
    { id: "termination", label: "Termination", icon: AlertCircle },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Terms & Conditions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Last updated: October 28, 2025
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-200 p-4 overflow-y-auto">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? "bg-[#1a5f7a]/10 text-[#1a5f7a] font-medium"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            {activeSection === "overview" && (
              <div className="prose prose-slate max-w-none">
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  Agreement Overview
                </h3>
                <p className="text-slate-600 mb-4">
                    Welcome to My Crew Manager. By accessing or using our Project Management Platform, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
                </p>
                <p className="text-slate-600 mb-4">
                    These terms constitute a legally binding agreement between you and My Crew Manager regarding your use of our enterprise platform, including all features, tools, and services provided.
                </p>
                <div className="bg-[#1a5f7a]/10 border-l-4 border-[#1a5f7a] p-4 rounded-r-lg mb-4">
                  <p className="text-sm text-[#1a5f7a] font-medium">
                    By clicking "Accept," you acknowledge that you have read,
                    understood, and agree to be bound by these terms.
                  </p>
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Key Points</h4>
                <ul className="text-slate-600 space-y-2 mb-4">
                    <li>You must be authorized to represent your organization</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>Our services are provided on an "as is" basis</li>
                    <li>We reserve the right to modify these terms with notice</li>
                </ul>
              </div>
            )}
            {activeSection === "services" && (
              <div className="prose prose-slate max-w-none">
                <h3 className="text-xl font-bold text-slate-800 mb-4">
                  Services Provided
                </h3>
                <p className="text-slate-600 mb-4">
                    My Crew Manager provides a comprehensive enterprise project management platform designed to facilitate team collaboration, project tracking, and business operations.
                </p>
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Platform Features</h4>
                <div className="grid gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-slate-800 mb-2">Project Reliability</h5>
                    <p className="text-sm text-slate-600">
                    Ensure smooth and consistent project performance with robust uptime and real-time monitoring capabilities.
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-slate-800 mb-2">Team Collaboration</h5>
                    <p className="text-sm text-slate-600">
                    Real-time collaboration tools for seamless team coordination across projects and departments.
                    </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-slate-800 mb-2">Advanced Analytics</h5>
                    <p className="text-sm text-slate-600">
                    Comprehensive insights and reporting for data-driven decision making.
                    </p>
                </div>
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-3">Service Availability</h4>
                <p className="text-slate-600 mb-4">
                We strive to maintain 99.9% uptime for our platform. Scheduled maintenance will be communicated in advance. We are not liable for service interruptions due to circumstances beyond our reasonable control.
                </p>
              </div>
            )}
            {activeSection === "privacy" && (
              <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Privacy & Data Protection</h3>
              <p className="text-slate-600 mb-4">
                Your privacy and data security are paramount. We are committed to protecting your information and maintaining transparency about our data practices.
              </p>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Data Collection</h4>
              <p className="text-slate-600 mb-4">
                We collect information necessary to provide and improve our services, including account information, usage data, and project-related content you create or upload.
              </p>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Data Security</h4>
              <ul className="text-slate-600 space-y-2 mb-4">
                <li>Industry-standard encryption for data in transit and at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Strict access controls and authentication protocols</li>
                <li>Compliance with GDPR, CCPA, and other data protection regulations</li>
              </ul>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Data Ownership</h4>
              <p className="text-slate-600 mb-4">
                You retain all ownership rights to your data. We do not claim ownership of any content you upload or create within the platform. You grant us a limited license to process your data solely for the purpose of providing our services.
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                <p className="text-sm text-blue-800">
                  For detailed information, please review our separate Privacy Policy available at mycrewmanager.company.com/privacy
                </p>
              </div>
            </div>

            )}
            {activeSection === "user-conduct" && (
               <div className="prose prose-slate max-w-none">
               <h3 className="text-xl font-bold text-slate-800 mb-4">User Conduct & Responsibilities</h3>
               <p className="text-slate-600 mb-4">
                 As a user of My Crew Manager, you agree to use the platform responsibly and in accordance with all applicable laws and regulations.
               </p>
               <h4 className="text-lg font-semibold text-slate-800 mb-3">Acceptable Use</h4>
               <p className="text-slate-600 mb-4">You agree to use the platform only for lawful business purposes and in a manner that does not:</p>
               <ul className="text-slate-600 space-y-2 mb-4">
                 <li>Violate any laws, regulations, or third-party rights</li>
                 <li>Transmit harmful code, viruses, or malicious software</li>
                 <li>Attempt to gain unauthorized access to our systems</li>
                 <li>Interfere with other users' access or use of the platform</li>
                 <li>Engage in any form of harassment or discrimination</li>
               </ul>
               <h4 className="text-lg font-semibold text-slate-800 mb-3">Account Security</h4>
               <p className="text-slate-600 mb-4">
                 You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.
               </p>
               <h4 className="text-lg font-semibold text-slate-800 mb-3">Content Standards</h4>
               <p className="text-slate-600 mb-4">
                 All content uploaded or shared through the platform must comply with our content policies. We reserve the right to remove content that violates these standards.
               </p>
             </div>
            )}
            {activeSection === "liability" && (
              <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Limitation of Liability</h3>
              <p className="text-slate-600 mb-4">
                Our services are provided "as is" and "as available" without warranties of any kind, either express or implied.
              </p>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Disclaimer of Warranties</h4>
              <p className="text-slate-600 mb-4">
                We do not warrant that the platform will be uninterrupted, error-free, or completely secure. While we strive for excellence, we cannot guarantee specific results from using our services.
              </p>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Limitation of Damages</h4>
              <p className="text-slate-600 mb-4">
                To the maximum extent permitted by law, My Crew Manager shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-lg mb-4">
                <p className="text-sm text-amber-800">
                  Our total liability for any claims arising from your use of the platform shall not exceed the amount you paid us in the twelve months preceding the claim.
                </p>
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Indemnification</h4>
              <p className="text-slate-600 mb-4">
                You agree to indemnify and hold harmless My Crew Manager from any claims, damages, or expenses arising from your use of the platform or violation of these terms.
              </p>
            </div>
            )}
            {activeSection === "termination" && (
              <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Termination & Suspension</h3>
              <p className="text-slate-600 mb-4">
                Either party may terminate this agreement under certain conditions. We reserve the right to suspend or terminate accounts that violate these terms.
              </p>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Your Rights to Terminate</h4>
              <p className="text-slate-600 mb-4">
                You may terminate your account at any time through your account settings or by contacting our support team. Upon termination, you will retain access until the end of your current billing period.
              </p>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Our Rights to Terminate</h4>
              <p className="text-slate-600 mb-4">We may suspend or terminate your account if:</p>
              <ul className="text-slate-600 space-y-2 mb-4">
                <li>You breach these Terms and Conditions</li>
                <li>Your account shows suspicious or fraudulent activity</li>
                <li>You fail to pay required fees</li>
                <li>Required by law or regulatory authority</li>
              </ul>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Data Upon Termination</h4>
              <p className="text-slate-600 mb-4">
                Upon termination, you will have 30 days to export your data. After this period, we may delete your data in accordance with our data retention policies.
              </p>
              <h4 className="text-lg font-semibold text-slate-800 mb-3">Contact Information</h4>
              <p className="text-slate-600 mb-2">
                For questions about termination or account closure:
              </p>
              <p className="text-[#1a5f7a] font-medium">mycrewmanager@company.com</p>
            </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              By accepting, you agree to our Terms & Conditions
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={onAccept}
                className="px-6 py-2.5 rounded-lg bg-[#1a5f7a] text-white hover:bg-[#154d63] font-medium transition-colors shadow-sm"
              >
                Accept Terms
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}