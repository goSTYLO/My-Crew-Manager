import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useTheme } from './themeContext';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is MyCrewManager?",
    answer: "MyCrewManager is a comprehensive project management platform with AI-powered features, real-time collaboration, and team management capabilities. It helps teams create and manage projects, organize work into sprints, track progress, and collaborate effectively through chat and real-time updates."
  },
  {
    question: "How do I create a new project?",
    answer: "To create a new project, navigate to the 'Project' section and click on 'Create Project'. You'll go through a 7-step workflow: 1) Create Project, 2) Upload Proposal (optional), 3) AI Analysis (if proposal uploaded), 4) Review & Edit, 5) Generate Backlog, 6) Review Backlog, and 7) Invite Team. You can skip the proposal step if you prefer to create the project manually."
  },
  {
    question: "How does AI-powered project analysis work?",
    answer: "Our AI analyzes project proposals you upload to automatically extract key features, roles, goals, and timelines. It then generates a comprehensive backlog with epics, sub-epics, user stories, and tasks. The AI uses advanced language models to understand your project requirements and create a structured project plan. You can review and edit the AI-generated content before finalizing."
  },
  {
    question: "How do I invite team members to a project?",
    answer: "After creating a project, go to the 'Invite Team' step in the project creation workflow. You can also invite team members from an existing project's settings. Enter their email address and they will receive an invitation. Team members can accept or decline the invitation, and once accepted, they'll have access to the project based on their assigned role."
  },
  {
    question: "What are epics, user stories, and tasks?",
    answer: "These are components of the project backlog structure: Epics are large work items that represent major features or themes. User Stories describe functionality from the end-user's perspective, typically written as 'As a [user], I want [feature] so that [benefit]'. Tasks are smaller, actionable items that break down user stories into specific work assignments. The backlog is organized hierarchically: Epics contain Sub-Epics, which contain User Stories, which contain Tasks."
  },
  {
    question: "How does sprint planning work?",
    answer: "Sprint planning allows you to organize your work into time-boxed iterations called sprints. You can create sprints with specific start and end dates, assign epics and user stories to sprints, and track progress. The sprint timeline helps teams focus on delivering incremental value and meeting deadlines. You can view sprint progress in the project dashboard and update sprint status as work progresses."
  },
  {
    question: "How does real-time collaboration work?",
    answer: "MyCrewManager uses an intelligent polling system that provides real-time updates without WebSockets. The system adapts polling intervals based on user activity - faster when active, slower when idle. When you make changes to projects, tasks, or chat messages, other team members see updates automatically. The smart polling system pauses when browser tabs are hidden to save resources while maintaining responsiveness when active."
  },
  {
    question: "What is the difference between Project Manager and Team Member roles?",
    answer: "Project Managers have full control over projects including creating projects, inviting team members, modifying project details, managing the backlog, and organizing sprints. Team Members can view project details, update assigned tasks, participate in team chat, and view project progress, but cannot modify project settings or invite new members. Role-based access ensures appropriate permissions for different team members."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { theme } = useTheme();

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 min-h-screen overflow-x-hidden ${
      theme === "dark" ? "bg-gray-900" : "bg-white"
    }`}>
      <div className="w-full max-w-4xl mx-auto overflow-x-hidden">
        <div className="text-center mb-16">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 ${
            theme === "dark" 
              ? "bg-blue-900/30 text-blue-300" 
              : "bg-[#1a5f7a]/10 text-[#1a5f7a]"
          }`}>
            <HelpCircle className="w-4 h-4" />
            Frequently Asked Questions
          </div>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            FAQ
          </h2>
          <p className={`text-lg sm:text-xl ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>
            Find answers to common questions about MyCrewManager
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <div
              key={index}
              className={`rounded-lg border transition-all ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              <button
                onClick={() => toggleItem(index)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                  theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-50"
                }`}
                {...(openIndex === index ? { "aria-expanded": true } : { "aria-expanded": false })}
              >
                <span className={`font-semibold text-lg pr-4 break-words ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}>
                  {item.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className={`w-5 h-5 flex-shrink-0 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`} />
                )}
              </button>
              {openIndex === index && (
                <div className={`px-6 pb-4 border-t ${
                  theme === "dark" 
                    ? "border-gray-700" 
                    : "border-gray-200"
                }`}>
                  <p className={`pt-4 leading-relaxed break-words ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}>
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

