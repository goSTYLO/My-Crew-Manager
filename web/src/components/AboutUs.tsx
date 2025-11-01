import { Users, Target, Code, Github, Linkedin, Mail, Brain, Zap, FolderKanban, BarChart3 } from 'lucide-react';
import { useTheme } from './themeContext';

interface TeamMember {
  name: string;
  role: string;
  photo?: string;
  bio?: string;
  initials?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
}

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Team members from landing page
const teamMembers: TeamMember[] = [
  { 
    name: "Aaron Christian Tamayo", 
    role: "Project Manager / LLM Developer",
    bio: "Leads strategic direction and AI implementation, specializing in large language models and intelligent automation systems.",
    initials: "AT",
    socialLinks: {
      email: "#",
      linkedin: "https://www.linkedin.com/in/aaron-christian-tamayo-0b1b3b1b3/",
    }
  },
  { 
    name: "John Wayne Enrique", 
    role: "Lead Frontend Developer",
    bio: "Architects responsive user experiences across web and mobile platforms, ensuring seamless interaction and modern design patterns.",
    initials: "JE",
    socialLinks: {
      email: "enriquejohnwayne@gmail.com",
      linkedin: "#"
    }
  },
  { 
    name: "Joshua Lozano", 
    role: "Lead Backend Developer",
    bio: "Designs robust server architecture and APIs, focusing on scalability, security, and optimal system performance.",
    initials: "JL",
    socialLinks: {
      email: "#",
      linkedin: "https://www.linkedin.com/in/joshua-lozano-0b1b3b1b3/",
    }
  },
  { 
    name: "Ralph Luis Mamaril", 
    role: "Frontend Developer (Mobile)",
    bio: "Crafts intuitive mobile interfaces with focus on native performance and delightful user interactions on iOS and Android.",
    initials: "RM",
    socialLinks: {
      email: "#",
      linkedin: "https://www.linkedin.com/in/ralph-luis-mamaril-0b1b3b1b3/",
    }
  },
  { 
    name: "Angel Kurt Pawig", 
    role: "Frontend Developer (Mobile)",
    bio: "Bridges frontend and backend systems, developing integrated solutions that enhance both user experience and functionality.",
    initials: "AP",
    socialLinks: {
      email: "#",
      linkedin: "https://www.linkedin.com/in/angel-kurt-pawig-0b1b3b1b3/",
    }
  },
  { 
    name: "Keith Ardee Lazo", 
    role: "Frontend Developer (Web)",
    bio: "Implements responsive web interfaces with attention to accessibility, cross-browser compatibility, and modern CSS techniques.",
    initials: "KL",
    socialLinks: {
      email: "#",
      linkedin: "https://www.linkedin.com/in/keith-ardee-lazo-0b1b3b1b3/",
    }
  },
  { 
    name: "Joshua Nick Velasco", 
    role: "Frontend Developer (Web)",
    bio: "Develops dynamic web components and interactive features, optimizing for performance and exceptional user engagement.",
    initials: "JV",
    socialLinks: {
      email: "#",
      linkedin: "https://www.linkedin.com/in/joshua-nick-velasco-0b1b3b1b3/",
    }
  }
];

const techStack = {
  ai: [
    { name: "Large Language Models", description: "Advanced AI models that understand and generate human-like text for intelligent project analysis and automation" },
    { name: "Natural Language Processing", description: "Advanced NLP capabilities that extract insights from project proposals and documentation" },
    { name: "AI-Powered Task Generation", description: "Intelligent automation that transforms project requirements into structured backlogs and actionable tasks" },
    { name: "Intelligent Document Analysis", description: "Automated extraction and understanding of project proposals, requirements, and documentation" }
  ],
  realTime: [
    { name: "Real-Time Data Processing", description: "Instant updates and synchronization across all team members and project components" },
    { name: "Live Collaboration Features", description: "Real-time chat, updates, and notifications that keep teams connected and informed" },
    { name: "Smart Polling System", description: "Adaptive polling technology that provides real-time updates without heavy WebSocket connections" },
    { name: "Instant Progress Tracking", description: "Live updates on project progress, task completion, and team activity" }
  ],
  projectManagement: [
    { name: "Agile Workflow Automation", description: "Streamlined sprint planning, backlog management, and task prioritization" },
    { name: "Epic & User Story Management", description: "Hierarchical project structure with epics, sub-epics, user stories, and tasks" },
    { name: "Sprint Planning & Tracking", description: "Time-boxed iterations with progress monitoring and deadline management" },
    { name: "Team Collaboration Tools", description: "Integrated communication and coordination features for seamless teamwork" }
  ],
  analytics: [
    { name: "Project Analytics & Insights", description: "Data-driven dashboards and reports that provide actionable insights into project performance" },
    { name: "Performance Metrics", description: "Comprehensive tracking of team productivity, sprint velocity, and project health" },
    { name: "Progress Visualization", description: "Intuitive charts and graphs that visualize project status and team progress" },
    { name: "Custom Reporting", description: "Flexible reporting tools that generate detailed project summaries and analytics" }
  ]
};

export default function AboutUs() {
  const { theme } = useTheme();

  return (
    <section className={`py-24 px-4 sm:px-6 lg:px-8 min-h-screen overflow-x-hidden ${
      theme === "dark" ? "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800" : "bg-gradient-to-b from-gray-50 via-white to-gray-50"
    }`}>
      <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
        {/* Header */}
        <div className="text-center mb-20">
          <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm transition-all ${
            theme === "dark" 
              ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
              : "bg-[#1a5f7a]/10 text-[#1a5f7a] border border-[#1a5f7a]/20"
          }`}>
            <Users className="w-4 h-4" />
            About MyCrewManager
          </div>
          <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            About Us
          </h2>
          <p className={`text-lg sm:text-xl ${
            theme === "dark" ? "text-gray-300" : "text-gray-600"
          }`}>
            Learn about our mission, team, and the technology behind MyCrewManager
          </p>
        </div>

        {/* Mission Section */}
        <div className={`rounded-3xl p-10 sm:p-12 mb-16 shadow-2xl transition-all ${
          theme === "dark" 
            ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-gray-700/50" 
            : "bg-gradient-to-br from-[#1a5f7a] via-[#1f6a86] to-[#2c7a9e] text-white shadow-[#1a5f7a]/20"
        }`}>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className={`p-4 rounded-2xl flex-shrink-0 ${
              theme === "dark" 
                ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
                : "bg-white/20 backdrop-blur-sm"
            }`}>
              <Target className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className={`text-2xl font-bold mb-3 ${
                theme === "dark" ? "text-white" : "text-white"
              }`}>
                Our Mission
              </h3>
              <p className={`text-lg leading-relaxed break-words ${
                theme === "dark" ? "text-gray-300" : "text-white/90"
              }`}>
                At MyCrewManager, our mission is to empower teams with intelligent, user-friendly project management tools that streamline workflows, enhance collaboration, and drive project success. We combine cutting-edge AI technology with intuitive design to help teams of all sizes manage their projects more effectively, from conception to completion. We believe that great project management should be accessible, intelligent, and seamlessly integrated into your workflow.
              </p>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="mb-20">
          <div className="flex items-center gap-4 mb-12">
            <div className={`p-3 rounded-xl ${
              theme === "dark" 
                ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
                : "bg-[#1a5f7a]/10 text-[#1a5f7a] border border-[#1a5f7a]/20"
            }`}>
              <Users className="w-6 h-6" />
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Our Team
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`group rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  theme === "dark"
                    ? "bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600 hover:shadow-gray-900/50"
                    : "bg-white border-gray-200 hover:border-[#1a5f7a]/30 hover:shadow-[#1a5f7a]/10"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className={`w-28 h-28 rounded-full object-cover mb-6 ring-4 ring-offset-2 transition-all group-hover:ring-[#1a5f7a]/30 ${
                        theme === "dark" 
                          ? "ring-gray-700 ring-offset-gray-800" 
                          : "ring-[#1a5f7a]/20 ring-offset-white"
                      }`}
                    />
                  ) : (
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 ring-4 ring-offset-2 transition-all group-hover:scale-105 group-hover:ring-[#1a5f7a]/30 ${
                      theme === "dark" 
                        ? "bg-gradient-to-br from-[#1a5f7a] via-[#2c7a9e] to-[#1a5f7a] text-white ring-gray-700 ring-offset-gray-800 shadow-lg" 
                        : "bg-gradient-to-br from-[#1a5f7a] via-[#2c7a9e] to-[#1a5f7a] text-white ring-[#1a5f7a]/20 ring-offset-white shadow-lg"
                    }`}>
                      <span className="text-2xl font-bold">
                        {member.initials || getInitials(member.name)}
                      </span>
                    </div>
                  )}
                  <h4 className={`text-xl font-bold mb-2 group-hover:text-[#1a5f7a] transition-colors ${
                    theme === "dark" ? "text-white group-hover:text-blue-400" : "text-gray-900"
                  }`}>
                    {member.name}
                  </h4>
                  <p className={`text-sm font-semibold mb-4 ${
                    theme === "dark" ? "text-blue-400" : "text-[#1a5f7a]"
                  }`}>
                    {member.role}
                  </p>
                  {member.bio && (
                    <p className={`text-sm mb-6 break-words leading-relaxed min-h-[3rem] ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}>
                      {member.bio}
                    </p>
                  )}
                  <div className={`flex gap-4 justify-center pt-5 border-t w-full ${
                    theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                  }`}>
                    {member.socialLinks?.linkedin && member.socialLinks.linkedin !== "#" ? (
                      <a
                        href={member.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                          theme === "dark"
                            ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700/50"
                            : "text-gray-600 hover:text-[#1a5f7a] hover:bg-[#1a5f7a]/5"
                        }`}
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </a>
                    ) : (
                      <span className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                        theme === "dark" ? "text-gray-600 opacity-50" : "text-gray-400 opacity-50"
                      }`}>
                        <Linkedin className="w-4 h-4" />
                        <span>LinkedIn</span>
                      </span>
                    )}
                    {member.socialLinks?.email && member.socialLinks.email !== "#" ? (
                      <a
                        href={`mailto:${member.socialLinks.email}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                          theme === "dark"
                            ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700/50"
                            : "text-gray-600 hover:text-[#1a5f7a] hover:bg-[#1a5f7a]/5"
                        }`}
                        aria-label="Email"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </a>
                    ) : (
                      <span className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                        theme === "dark" ? "text-gray-600 opacity-50" : "text-gray-400 opacity-50"
                      }`}>
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </span>
                    )}
                    {member.socialLinks?.github && (
                      <a
                        href={member.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                          theme === "dark"
                            ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700/50"
                            : "text-gray-600 hover:text-[#1a5f7a] hover:bg-[#1a5f7a]/5"
                        }`}
                        aria-label="GitHub"
                      >
                        <Github className="w-4 h-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Section */}
        <div>
          <div className="flex items-center gap-4 mb-12">
            <div className={`p-3 rounded-xl ${
              theme === "dark" 
                ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
                : "bg-[#1a5f7a]/10 text-[#1a5f7a] border border-[#1a5f7a]/20"
            }`}>
              <Code className="w-6 h-6" />
            </div>
            <h3 className={`text-2xl font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>
              Technology Stack
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* AI & Machine Learning */}
            <div className={`group relative rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
              theme === "dark" 
                ? "bg-gradient-to-br from-gray-800/95 via-gray-800 to-gray-900/95 border-gray-700/50 hover:border-blue-600/50 backdrop-blur-sm" 
                : "bg-white border-gray-200 hover:border-[#1a5f7a]/40 hover:shadow-[#1a5f7a]/20 shadow-lg"
            }`}>
              <div className="relative">
                <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${
                  theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                }`}>
                  <div className={`p-3 rounded-xl ${
                    theme === "dark" 
                      ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
                      : "bg-[#1a5f7a]/10 text-[#1a5f7a] border border-[#1a5f7a]/20"
                  }`}>
                    <Brain className="w-6 h-6" />
                  </div>
                  <h4 className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    AI & Machine Learning
                  </h4>
                </div>
                <ul className="space-y-5">
                  {techStack.ai.map((tech, index) => (
                    <li key={index} className={`pb-5 border-b last:border-0 last:pb-0 transition-colors ${
                      theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          theme === "dark" ? "bg-blue-400" : "bg-[#1a5f7a]"
                        }`}></div>
                        <div className="flex-1">
                          <div className={`font-semibold mb-2 ${
                            theme === "dark" ? "text-blue-400" : "text-[#1a5f7a]"
                          }`}>
                            {tech.name}
                          </div>
                          <div className={`text-sm break-words leading-relaxed ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {tech.description}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Real-Time Features */}
            <div className={`group relative rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
              theme === "dark" 
                ? "bg-gradient-to-br from-gray-800/95 via-gray-800 to-gray-900/95 border-gray-700/50 hover:border-blue-600/50 backdrop-blur-sm" 
                : "bg-white border-gray-200 hover:border-[#1a5f7a]/40 hover:shadow-[#1a5f7a]/20 shadow-lg"
            }`}>
              <div className="relative">
                <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${
                  theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                }`}>
                  <div className={`p-3 rounded-xl ${
                    theme === "dark" 
                      ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
                      : "bg-[#1a5f7a]/10 text-[#1a5f7a] border border-[#1a5f7a]/20"
                  }`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <h4 className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Real-Time Features
                  </h4>
                </div>
                <ul className="space-y-5">
                  {techStack.realTime.map((tech, index) => (
                    <li key={index} className={`pb-5 border-b last:border-0 last:pb-0 transition-colors ${
                      theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          theme === "dark" ? "bg-blue-400" : "bg-[#1a5f7a]"
                        }`}></div>
                        <div className="flex-1">
                          <div className={`font-semibold mb-2 ${
                            theme === "dark" ? "text-blue-400" : "text-[#1a5f7a]"
                          }`}>
                            {tech.name}
                          </div>
                          <div className={`text-sm break-words leading-relaxed ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {tech.description}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Project Management */}
            <div className={`group relative rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
              theme === "dark" 
                ? "bg-gradient-to-br from-gray-800/95 via-gray-800 to-gray-900/95 border-gray-700/50 hover:border-blue-600/50 backdrop-blur-sm" 
                : "bg-white border-gray-200 hover:border-[#1a5f7a]/40 hover:shadow-[#1a5f7a]/20 shadow-lg"
            }`}>
              <div className="relative">
                <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${
                  theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                }`}>
                  <div className={`p-3 rounded-xl ${
                    theme === "dark" 
                      ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
                      : "bg-[#1a5f7a]/10 text-[#1a5f7a] border border-[#1a5f7a]/20"
                  }`}>
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <h4 className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Project Management
                  </h4>
                </div>
                <ul className="space-y-5">
                  {techStack.projectManagement.map((tech, index) => (
                    <li key={index} className={`pb-5 border-b last:border-0 last:pb-0 transition-colors ${
                      theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          theme === "dark" ? "bg-blue-400" : "bg-[#1a5f7a]"
                        }`}></div>
                        <div className="flex-1">
                          <div className={`font-semibold mb-2 ${
                            theme === "dark" ? "text-blue-400" : "text-[#1a5f7a]"
                          }`}>
                            {tech.name}
                          </div>
                          <div className={`text-sm break-words leading-relaxed ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {tech.description}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Analytics & Insights */}
            <div className={`group relative rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
              theme === "dark" 
                ? "bg-gradient-to-br from-gray-800/95 via-gray-800 to-gray-900/95 border-gray-700/50 hover:border-blue-600/50 backdrop-blur-sm" 
                : "bg-white border-gray-200 hover:border-[#1a5f7a]/40 hover:shadow-[#1a5f7a]/20 shadow-lg"
            }`}>
              <div className="relative">
                <div className={`flex items-center gap-4 mb-8 pb-6 border-b ${
                  theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                }`}>
                  <div className={`p-3 rounded-xl ${
                    theme === "dark" 
                      ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" 
                      : "bg-[#1a5f7a]/10 text-[#1a5f7a] border border-[#1a5f7a]/20"
                  }`}>
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h4 className={`text-xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    Analytics & Insights
                  </h4>
                </div>
                <ul className="space-y-5">
                  {techStack.analytics.map((tech, index) => (
                    <li key={index} className={`pb-5 border-b last:border-0 last:pb-0 transition-colors ${
                      theme === "dark" ? "border-gray-700/50" : "border-gray-200"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                          theme === "dark" ? "bg-blue-400" : "bg-[#1a5f7a]"
                        }`}></div>
                        <div className="flex-1">
                          <div className={`font-semibold mb-2 ${
                            theme === "dark" ? "text-blue-400" : "text-[#1a5f7a]"
                          }`}>
                            {tech.name}
                          </div>
                          <div className={`text-sm break-words leading-relaxed ${
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {tech.description}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

