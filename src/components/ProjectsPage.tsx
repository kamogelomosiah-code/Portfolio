import { motion } from "motion/react";
import { ExternalLink, Github, Code2, ArrowLeft, Menu } from "lucide-react";

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
      accent: "text-[#1A73E8] bg-[#E8F0FE]",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=400"
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
      accent: "text-[#1A73E8] bg-[#E8F0FE]",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800&h=400"
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
      accent: "text-[#1A73E8] bg-[#E8F0FE]",
      image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800&h=400"
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
      accent: "text-[#1A73E8] bg-[#E8F0FE]",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800&h=400"
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
                {/* Image Thumbnail */}
                <div className="w-full h-48 md:h-56 overflow-hidden relative border-b border-gray-200 shrink-0">
                  <div className="absolute inset-0 bg-[#202124]/5 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                </div>

                <div className="p-6 md:p-8 flex flex-col relative z-20 w-full text-left flex-1">
                  {/* Secondary accent highlight hover shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#E8F0FE]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
                  
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
                      className="flex items-center justify-center gap-2 bg-[#1A73E8] text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition-colors font-medium text-[14px] cursor-pointer shadow-sm no-underline border-0"
                    >
                      View Live <ExternalLink size={16} />
                    </a>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-[#1A73E8] px-6 py-2.5 rounded-full hover:bg-[#F8F9FA] hover:text-blue-800 transition-colors font-medium text-[14px] cursor-pointer no-underline"
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
