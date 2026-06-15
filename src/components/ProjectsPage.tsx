import { motion } from "motion/react";
import { ExternalLink, Github, ArrowLeft, Server, Activity, Database, FileText, PenTool, Layers, Box, BarChart3, PackageSearch, MessageSquare, Zap, Users } from "lucide-react";

interface ProjectsPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

export default function ProjectsPage({ onBackToChat, onToggleDrawer }: ProjectsPageProps) {
  const projects = [
    {
      title: "Master API Service",
      subtitle: "Central Orchestration Backend",
      description: "A comprehensive API gateway and orchestration service acting as the central nervous system for various applications. Designed to handle robust data processing, secure routing, and streamlined external tool integration.",
      tags: ["Node.js", "Express", "API Gateway", "Backend Architecture"],
      stats: { "Deployment": "Active", "Host": "Render", "Architecture": "Microservices" },
      github: "https://github.com/kamogelomosiah",
      live: "https://masterapi-main.onrender.com/",
      bgClass: "bg-white",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-50/50">
          <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40" style={{ background: "radial-gradient(circle at center, var(--color-accent) 0%, transparent 70%)" }} />
          <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-accent/20 blur-2xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
          <Server size={64} className="text-accent relative z-10 drop-shadow-md transform transition-transform duration-700 group-hover:scale-110" strokeWidth={1.5} />
          <Activity size={32} className="text-accent/60 absolute top-12 right-24 animate-pulse delay-75" strokeWidth={1.5} />
          <Database size={40} className="text-accent/50 absolute bottom-12 left-24" strokeWidth={1.5} />
        </div>
      )
    },
    {
      title: "Interactive CV Maker",
      subtitle: "Dynamic Resume Generation Platform",
      description: "A fully responsive CV builder allowing users to seamlessly generate, style, and structure professional resumes. It features dynamic template rendering and export functionality to streamline the job application process.",
      tags: ["React.js", "TypeScript", "Tailwind CSS", "PDF Export"],
      stats: { "Platform": "Web", "Status": "Live App", "UX Form": "Interactive" },
      github: "https://github.com/kamogelomosiah",
      live: "https://cvmaker-v371.onrender.com/",
      bgClass: "bg-white",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-50/50">
          <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40" style={{ background: "radial-gradient(circle at center, var(--color-accent) 0%, transparent 70%)" }} />
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-accent/10 rounded-full blur-2xl" />
          <FileText size={64} className="text-accent relative z-10 drop-shadow-md transform transition-transform duration-700 group-hover:scale-110" strokeWidth={1.5} />
          <PenTool size={32} className="text-accent/60 absolute top-16 right-24" strokeWidth={1.5} />
          <Layers size={40} className="text-accent/50 absolute bottom-16 left-24" strokeWidth={1.5} />
        </div>
      )
    },
    {
      title: "UJ Stock Manager",
      subtitle: "Enterprise Inventory Control System",
      description: "A robust inventory and stock management solution custom-built for tracking academic resources, equipment lifecycles, and lab materials. Provides real-time dashboard analytics and administrative workflows.",
      tags: ["Full-Stack", "Database Management", "Analytics Dashboard", "Asset Tracking"],
      stats: { "Engine": "Enterprise", "Target": "UJ", "Tracking": "Real-time" },
      github: "https://github.com/kamogelomosiah",
      live: "https://ujstockmanager.onrender.com/",
      bgClass: "bg-white",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-50/50">
          <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40" style={{ background: "radial-gradient(circle at center, var(--color-accent) 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl transform -translate-y-1/2" />
          <Box size={64} className="text-accent relative z-10 drop-shadow-md transform transition-transform duration-700 group-hover:scale-110" strokeWidth={1.5} />
          <BarChart3 size={36} className="text-accent/60 absolute top-12 left-1/4" strokeWidth={1.5} />
          <PackageSearch size={40} className="text-accent/50 absolute bottom-12 right-1/4" strokeWidth={1.5} />
        </div>
      )
    },
    {
      title: "Real-time Chat App",
      subtitle: "Live Communication Platform",
      description: "A streamlined, high-performance real-time chat application built for instant messaging, featuring live presence indicators, typing status, and persistent message history using WebSockets.",
      tags: ["WebSockets", "React.js", "Real-time", "Chat App"],
      stats: { "Status": "Deployed", "Engine": "WebSockets", "Latency": "<50ms" },
      github: "https://github.com/kamogelomosiah",
      live: "https://s-c4nk.onrender.com/",
      bgClass: "bg-white",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-50/50">
          <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-40" style={{ background: "radial-gradient(circle at center, var(--color-accent) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 flex items-center justify-center w-full h-full opacity-50">
            <div className="w-[120%] h-[120%] border-[40px] border-accent/5 rounded-full blur-2xl" />
          </div>
          <MessageSquare size={64} className="text-accent relative z-10 drop-shadow-md transform transition-transform duration-700 group-hover:scale-110" strokeWidth={1.5} />
          <Zap size={32} className="text-accent/60 absolute top-16 right-1/4 animate-pulse delay-150" strokeWidth={1.5} />
          <Users size={40} className="text-accent/50 absolute bottom-16 left-1/4" strokeWidth={1.5} />
        </div>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-[#F8F9FA] text-[#202124] flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button - Material 3 Top App Bar */}
      <div className="w-full h-[64px] flex items-center justify-between px-2 sm:px-4 bg-white z-20 shrink-0 border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 m-0 p-0">
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-black/5 text-[#5F6368] transition-colors cursor-pointer shrink-0 m-0 border-0"
            title="Back to conversational agent"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-medium text-[20px] text-[#202124] tracking-normal font-display m-0 p-0 ml-1">My Live Works</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6">
        <div className="w-full max-w-4xl pt-8 sm:pt-10">
          <div className="mb-8 text-left max-w-2xl">
            <p className="text-[#5F6368] text-[16px] leading-relaxed">
              A showcase of full-stack engineering, specialized AI integrations, and responsive micro-architectures.
            </p>
          </div>

          <div className="flex flex-col gap-6 w-full">
            {projects.map((project, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                key={project.title}
                className={`group border border-gray-200 shadow-sm rounded-3xl transition-all relative overflow-hidden flex flex-col ${project.bgClass}`}
              >
                {/* Image Thumbnail / Vector Illustration */}
                <div className="w-full h-48 md:h-56 overflow-hidden relative border-b border-gray-200 shrink-0">
                  <div className="absolute inset-0 bg-[#202124]/5 group-hover:bg-transparent transition-colors duration-500 z-20 pointer-events-none" />
                  {project.illustration}
                </div>

                <div className="p-6 md:p-8 flex flex-col relative z-20 w-full text-left flex-1">
                  {/* Secondary accent highlight hover shimmer */}
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
                  
                  <div className="flex-1 text-left relative z-10">
                    <span className={`text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-full ${project.accent}`}>
                      Live Sandbox
                    </span>
                    <h2 className="text-[24px] md:text-[28px] font-medium mt-5 text-[#202124] text-left font-display">
                      {project.title}
                    </h2>
                    <p className="text-[14px] text-[#5F6368] mt-1 mb-4 text-left">
                      {project.subtitle}
                    </p>
                    <p className="text-[#444746] text-[15px] leading-relaxed mb-6 text-left">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6 justify-start">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-[12px] font-medium px-3 py-1.5 bg-[#F1F3F4] rounded-full text-[#444746] hover:bg-[#E8EAED] transition-colors cursor-default border border-transparent">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Operational stats */}
                    <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-6 max-w-xl text-left mt-auto">
                      {Object.entries(project.stats).map(([key, val]) => (
                        <div key={key} className="text-left">
                          <p className="text-[11px] text-[#5F6368] font-medium">{key}</p>
                          <p className="font-mono text-[13px] font-medium text-[#202124] mt-1 leading-none">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buttons left aligned */}
                  <div className="flex flex-wrap gap-3 mt-8 justify-start relative z-10">
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 bg-accent text-white px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity font-medium text-[14px] cursor-pointer shadow-sm no-underline border-0"
                    >
                      View Live <ExternalLink size={16} />
                    </a>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 border border-accent/20 bg-accent/5 text-accent px-6 py-2.5 rounded-full hover:bg-accent/10 transition-colors font-medium text-[14px] cursor-pointer no-underline"
                    >
                      Source <Github size={16} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
