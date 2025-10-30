import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, X, ArrowRight, CheckCircle, Sparkles, Zap, 
  Users, BarChart3, Clock, Smartphone, Brain,
  FileText, GitBranch, MessageSquare, Target, ChevronDown,
  Linkedin, Mail
} from 'lucide-react';
import logo from "./../assets/logo2.png";
import ContactSupport from './ContactSupport';

export default function LandingPage() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Smooth scroll function
  const smoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    targetId: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const navHeight = 64; // Height of fixed navbar
      const targetPosition = element.offsetTop - navHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
      setMobileMenuOpen(false);
    }
  };


  const features = [
    {
      icon: Brain,
      title: "AI-Driven Task Generation",
      description: "Automatically transform project proposals into structured backlogs with tasks, epics, and dependencies using advanced AI technology."
    },
    {
      icon: FileText,
      title: "Smart Document Processing",
      description: "Upload project proposals and watch as AI instantly analyzes and breaks them down into actionable work items."
    },
    {
      icon: GitBranch,
      title: "Agile Workflow Automation",
      description: "Streamline your agile processes with intelligent sprint planning, backlog management, and automated task prioritization."
    },
    {
      icon: Smartphone,
      title: "Mobile Accessibility",
      description: "Stay connected and productive on the go with full mobile support for iOS and Android platforms."
    },
    {
      icon: MessageSquare,
      title: "AI Summarization",
      description: "Get instant project summaries, progress reports, and meeting notes powered by advanced language models."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Enhance communication and engagement across teams with real-time updates and collaborative workspaces."
    }
  ];

  const benefits = [
    "Automated backlog creation from documents",
    "Intelligent task prioritization",
    "Real-time collaboration tools",
    "Mobile-first design",
    "AI-powered insights and reporting",
    "Seamless integration with agile methodologies"
  ];

  const teamMembers = [
    { 
      name: "Aaron Christian Tamayo", 
      role: "Project Manager / LLM Developer",
      description: "Leads strategic direction and AI implementation, specializing in large language models and intelligent automation systems.",
      initials: "AT"
    },
    { 
      name: "John Wayne Enrique", 
      role: "Lead Frontend Developer",
      description: "Architects responsive user experiences across web and mobile platforms, ensuring seamless interaction and modern design patterns.",
      initials: "JE"
    },
    { 
      name: "Joshua Lozano", 
      role: "Lead Backend Developer",
      description: "Designs robust server architecture and APIs, focusing on scalability, security, and optimal system performance.",
      initials: "JL"
    },
    { 
      name: "Ralph Luis Mamaril", 
      role: "Frontend Developer (Mobile)",
      description: "Crafts intuitive mobile interfaces with focus on native performance and delightful user interactions on iOS and Android.",
      initials: "RM"
    },
    { 
      name: "Angel Kurt Pawig", 
      role: "Full-Stack Developer",
      description: "Bridges frontend and backend systems, developing integrated solutions that enhance both user experience and functionality.",
      initials: "AP"
    },
    { 
      name: "Keith Ardee Lazo", 
      role: "Frontend Developer (Web)",
      description: "Implements responsive web interfaces with attention to accessibility, cross-browser compatibility, and modern CSS techniques.",
      initials: "KL"
    },
    { 
      name: "Joshua Nick Velasco", 
      role: "Frontend Developer (Web)",
      description: "Develops dynamic web components and interactive features, optimizing for performance and exceptional user engagement.",
      initials: "JV"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50 shadow-sm">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1a5f7a] to-[#2c7a9e] rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                <img src={logo} alt="MyCrewManager" className="w-9 h-9 object-contain" />
              </div>
              <span className="text-xl font-bold text-gray-900">MyCrewManager</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a 
                href="#features" 
                onClick={(e) => smoothScroll(e, 'features')}
                className="text-gray-600 hover:text-[#1a5f7a] font-medium transition-colors"
              >
                Features
              </a>
              <a 
                href="#benefits" 
                onClick={(e) => smoothScroll(e, 'benefits')}
                className="text-gray-600 hover:text-[#1a5f7a] font-medium transition-colors"
              >
                Benefits
              </a>
              <a 
                href="#team" 
                onClick={(e) => smoothScroll(e, 'team')}
                className="text-gray-600 hover:text-[#1a5f7a] font-medium transition-colors"
              >
                Team
              </a>
              <a 
                href="#contact" 
                onClick={(e) => smoothScroll(e, 'contact')}
                className="text-gray-600 hover:text-[#1a5f7a] font-medium transition-colors"
              >
                Contact
              </a>
              <button
                onClick={() => navigate("/signin")}
                className="text-[#1a5f7a] hover:text-[#2c7a9e] font-semibold transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-6 py-2 bg-[#1a5f7a] hover:bg-[#2c7a9e] text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#1a5f7a] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#features" 
                onClick={(e) => smoothScroll(e, 'features')}
                className="block text-gray-600 hover:text-[#1a5f7a] font-medium py-2 transition-colors"
              >
                Features
              </a>
              <a 
                href="#benefits" 
                onClick={(e) => smoothScroll(e, 'benefits')}
                className="block text-gray-600 hover:text-[#1a5f7a] font-medium py-2 transition-colors"
              >
                Benefits
              </a>
              <a 
                href="#team" 
                onClick={(e) => smoothScroll(e, 'team')}
                className="block text-gray-600 hover:text-[#1a5f7a] font-medium py-2 transition-colors"
              >
                Team
              </a>
              <a 
                href="#contact" 
                onClick={(e) => smoothScroll(e, 'contact')}
                className="block text-gray-600 hover:text-[#1a5f7a] font-medium py-2 transition-colors"
              >
                Contact
              </a>
              <button
                className="block w-full text-left text-[#1a5f7a] font-semibold py-2"
              >
                Sign In
              </button>
              <button
                className="block w-full px-6 py-2 bg-[#1a5f7a] text-white font-semibold rounded-lg text-center hover:bg-[#2c7a9e] transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1a5f7a] via-[#2c7a9e] to-[#57a8c9] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#57a8c9] rounded-full blur-3xl"></div>
        </div>

        <div className="w-full mx-auto relative z-10">
          <div className="text-center w-full mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Project Management
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Transform Projects into<br />
              <span className="text-[#c9e4f0]">Actionable Tasks</span> with AI
            </h1>
            
            <p className="text-lg sm:text-xl text-[#c9e4f0] mb-8 leading-relaxed w-full mx-auto">
              MyCrewManager automates agile workflows through intelligent task generation, 
              turning project proposals into structured backlogs in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/signup")}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#1a5f7a] font-bold rounded-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => smoothScroll(e, 'features')}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/20 transition-colors border-2 border-white/30 flex items-center justify-center gap-2"
              >
                Learn More
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">10x</div>
                <div className="text-[#c9e4f0] text-sm sm:text-base">Faster Task Creation</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">95%</div>
                <div className="text-[#c9e4f0] text-sm sm:text-base">Time Saved on Planning</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">100%</div>
                <div className="text-[#c9e4f0] text-sm sm:text-base">Team Collaboration</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a5f7a]/10 rounded-full text-[#1a5f7a] text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 w-full mx-auto">
              Intelligent automation meets intuitive design for seamless project management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-[#1a5f7a]/20"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#1a5f7a] to-[#2c7a9e] rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a5f7a]/10 rounded-full text-[#1a5f7a] text-sm font-semibold mb-4">
                <Target className="w-4 h-4" />
                Why Choose Us
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Built for Modern<br />Agile Teams
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                MyCrewManager combines cutting-edge AI technology with proven agile methodologies 
                to deliver a project management experience that's both powerful and intuitive.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700 text-base sm:text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate("/signup")}
                className="mt-8 px-6 sm:px-8 py-3 sm:py-4 bg-[#1a5f7a] hover:bg-[#2c7a9e] text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Right Content - Feature Highlights */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#1a5f7a] to-[#2c7a9e] rounded-2xl p-6 sm:p-8 text-white hover:shadow-xl transition-shadow">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mb-4 opacity-80" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Project Reliability</h3>
                <p className="text-[#c9e4f0] leading-relaxed text-sm sm:text-base">
                    Ensure smooth and consistent project performance with robust uptime and real-time monitoring.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#2c7a9e] to-[#57a8c9] rounded-2xl p-6 sm:p-8 text-white hover:shadow-xl transition-shadow">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 mb-4 opacity-80" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Save Time & Effort</h3>
                <p className="text-[#c9e4f0] leading-relaxed text-sm sm:text-base">
                  Automate repetitive tasks, reduce planning overhead, and focus on what matters 
                  most - delivering value.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#57a8c9] to-[#1a5f7a] rounded-2xl p-6 sm:p-8 text-white hover:shadow-xl transition-shadow">
                <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mb-4 opacity-80" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Data-Driven Insights</h3>
                <p className="text-[#c9e4f0] leading-relaxed text-sm sm:text-base">
                  Make informed decisions with AI-powered analytics, progress tracking, and 
                  comprehensive reporting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a5f7a]/10 rounded-full text-[#1a5f7a] text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Our Team
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Meet the Innovators
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 w-full mx-auto">
              A talented team of developers and designers dedicated to revolutionizing project management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-[#1a5f7a]/20 group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#1a5f7a] to-[#2c7a9e] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      {member.initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 break-words">{member.name}</h3>
                    <p className="text-[#1a5f7a] font-semibold text-xs sm:text-sm mb-3">{member.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm mb-4">
                  {member.description}
                </p>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-[#1a5f7a] transition-colors text-sm">
                    <Linkedin className="w-4 h-4" />
                    <span className="hidden sm:inline">LinkedIn</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-500 hover:text-[#1a5f7a] transition-colors text-sm">
                    <Mail className="w-4 h-4" />
                    <span className="hidden sm:inline">Email</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1a5f7a] via-[#2c7a9e] to-[#57a8c9] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#57a8c9] rounded-full blur-3xl"></div>
        </div>

        <div className="w-full mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your<br />Project Management?
          </h2>
          <p className="text-lg sm:text-xl text-[#c9e4f0] mb-8 leading-relaxed">
            Join teams worldwide using AI-powered automation to deliver projects faster and smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
                onClick={() => navigate("/signup")}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-[#1a5f7a] font-bold rounded-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
                onClick={() => navigate("/signin")}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/20 transition-colors border-2 border-white/30"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      <ContactSupport />

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1a5f7a] to-[#2c7a9e] rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                    <img src={logo} alt="MyCrewManager" className="w-9 h-9 object-contain" />
                </div>
                <span className="text-xl font-bold text-white">MyCrewManager</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4 text-sm sm:text-base">
                AI-powered project management suite that automates agile workflows and enhances team collaboration.
              </p>
              <p className="text-sm text-gray-500">© 2025 MyCrewManager. All rights reserved.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-base sm:text-lg">Quick Links</h3>
              <ul className="space-y-2 text-sm sm:text-base">
                <li>
                  <a 
                    href="#features" 
                    onClick={(e) => smoothScroll(e, 'features')}
                    className="hover:text-[#57a8c9] transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a 
                    href="#benefits" 
                    onClick={(e) => smoothScroll(e, 'benefits')}
                    className="hover:text-[#57a8c9] transition-colors"
                  >
                    Benefits
                  </a>
                </li>
                <li>
                  <a 
                    href="#team" 
                    onClick={(e) => smoothScroll(e, 'team')}
                    className="hover:text-[#57a8c9] transition-colors"
                  >
                    Team
                  </a>
                </li>
                <li>
                  <a 
                    href="#contact" 
                    onClick={(e) => smoothScroll(e, 'contact')}
                    className="hover:text-[#57a8c9] transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <button onClick={() => navigate("/signin")} className="hover:text-[#57a8c9] transition-colors">Sign In</button>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-base sm:text-lg">Support</h3>
              <ul className="space-y-2 text-sm sm:text-base">
                <li><a href="#" className="hover:text-[#57a8c9] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#57a8c9] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#57a8c9] transition-colors">Terms of Service</a></li>
                <li><a href="mailto:mycrewmanager@company.com" className="hover:text-[#57a8c9] transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>Built with dedication by the MyCrewManager Team</p>
          </div>
        </div>
      </footer>
    </div>
  );
}