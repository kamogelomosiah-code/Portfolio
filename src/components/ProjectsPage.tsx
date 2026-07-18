import { motion } from "motion/react";
import { ExternalLink, Github, ArrowLeft, Server, Activity, Database, FileText, PenTool, Layers, Box, BarChart3, PackageSearch, MessageSquare, Zap, Users, Network, Combine, ShieldCheck, TerminalSquare, AppWindow, MousePointerClick, Cpu, Workflow, Menu } from "lucide-react";

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
      bgClass: "bg-surface",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-background/80">
          {/* Background Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
          <div className="absolute inset-0 opacity-40 transition-opacity duration-700 group-hover:opacity-70" style={{ background: "radial-gradient(circle at center, var(--color-accent) 0%, transparent 60%)" }} />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 flex gap-4 sm:gap-6 items-center transform transition-all duration-700 group-hover:scale-105 group-hover:-translate-y-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface border-2 border-primary/30 shadow-[0_0_15px_rgba(var(--color-accent),0.2)]">
                <Database size={20} className="text-primary" />
              </div>
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-surface border-2 border-primary/30 shadow-[0_0_15px_rgba(var(--color-accent),0.2)]">
                <Network size={20} className="text-primary" />
              </div>
            </div>
            
            <div className="w-12 sm:w-16 h-[2px] bg-gradient-to-r from-[var(--color-accent)]/50 to-[var(--color-accent)]/90 relative">
              <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-primary -translate-y-1/2 animate-ping" />
            </div>
            
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-surface border-2 border-primary/50 shadow-[0_0_30px_rgba(var(--color-accent),0.4)] relative">
              <div className="absolute -inset-1 bg-primary/20 rounded-xl blur animate-pulse" />
              <Server size={32} className="text-primary relative z-10" />
            </div>
            
            <div className="w-12 sm:w-16 h-[2px] bg-gradient-to-l from-[var(--color-accent)]/50 to-[var(--color-accent)]/90 relative">
              <div className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-primary -translate-y-1/2 animate-[ping_1.5s_infinite]" />
            </div>
            
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-surface border-2 border-primary/30 shadow-[0_0_15px_rgba(var(--color-accent),0.2)]">
              <ShieldCheck size={24} className="text-primary" />
            </div>
          </div>
          
          {/* Decorative Elements */}
          <TerminalSquare size={24} className="text-primary/30 absolute top-8 left-1/4 -rotate-12 transform group-hover:rotate-0 transition-transform duration-700" />
          <Cpu size={24} className="text-primary/30 absolute bottom-12 right-1/4 rotate-12 transform group-hover:rotate-0 transition-transform duration-700" />
          
          <div className="absolute top-0 right-1/4 w-px h-16 bg-gradient-to-b from-[var(--color-accent)]/0 to-[var(--color-accent)]/40" />
          <div className="absolute bottom-0 left-1/3 w-px h-12 bg-gradient-to-t from-[var(--color-accent)]/0 to-[var(--color-accent)]/40" />
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
      bgClass: "bg-surface",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-background/80">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
          <div className="absolute inset-0 opacity-40 transition-opacity duration-700 group-hover:opacity-60" style={{ background: "radial-gradient(ellipse at top right, var(--color-accent) 0%, transparent 60%)" }} />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-primary/10 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 w-48 h-32 bg-surface rounded-xl border-2 border-outline-variant shadow-lg flex flex-col overflow-hidden transform transition-all duration-700 group-hover:scale-105 group-hover:-rotate-2 group-hover:shadow-[0_10px_30px_rgba(var(--color-accent),0.2)]">
            <div className="h-6 w-full border-b-2 border-outline-variant flex items-center px-2 gap-1.5 bg-background/50">
              <div className="w-2 h-2 rounded-full bg-red-400/80" />
              <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
              <div className="w-2 h-2 rounded-full bg-green-400/80" />
            </div>
            <div className="flex-1 p-3 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center">
                <FileText size={16} className="text-primary" />
              </div>
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="w-3/4 h-2 rounded-full bg-primary/40" />
                <div className="w-full h-1.5 rounded-full bg-primary/20" />
                <div className="w-4/5 h-1.5 rounded-full bg-primary/20" />
                <div className="w-1/2 h-1.5 rounded-full bg-primary/20" />
              </div>
            </div>
          </div>
          
          <div className="absolute z-20 -bottom-4 -right-2 transform transition-all duration-700 group-hover:-translate-y-4 group-hover:-translate-x-4">
            <div className="w-32 h-20 bg-surface rounded-xl border-2 border-outline-variant shadow-xl p-3 flex flex-col gap-2 translate-x-8 -translate-y-6 rotate-6">
              <div className="flex items-center gap-2">
                <AppWindow size={14} className="text-primary" />
                <div className="w-16 h-1.5 rounded-full bg-primary/40" />
              </div>
              <div className="w-full h-8 rounded-md bg-primary/10 border-2 border-primary/20" />
            </div>
          </div>

          <div className="absolute top-1/2 right-1/4 animate-bounce" style={{animationDuration: '3s'}}>
            <MousePointerClick size={24} className="text-primary drop-shadow-md" />
          </div>
          
          <Layers size={100} className="text-primary/5 absolute -left-8 -bottom-8 -rotate-12" />
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
      bgClass: "bg-surface",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-background/80">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:20px_20px] opacity-10" />
          <div className="absolute inset-0 opacity-40 transition-opacity duration-700 group-hover:opacity-60" style={{ background: "radial-gradient(ellipse at bottom left, var(--color-accent) 0%, transparent 60%)" }} />
          
          <div className="flex gap-4 relative z-10 transform transition-transform duration-700 group-hover:scale-105">
            {/* Sidebar mock */}
            <div className="w-12 sm:w-16 h-36 bg-surface rounded-xl border-2 border-outline-variant shadow-lg flex flex-col items-center py-4 gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Box size={16} className="text-primary" />
              </div>
              <div className="w-6 h-6 rounded-md bg-primary/5 flex items-center justify-center">
                <PackageSearch size={14} className="text-on-surface-variant" />
              </div>
              <div className="w-6 h-6 rounded-md bg-primary/5 flex items-center justify-center">
                <Combine size={14} className="text-on-surface-variant" />
              </div>
            </div>
            
            {/* Dashboard blocks */}
            <div className="flex flex-col gap-4 w-36 sm:w-40">
              <div className="h-16 w-full bg-surface rounded-xl border-2 border-outline-variant shadow-lg flex items-end p-2 gap-1.5 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-accent)]/10 to-transparent" />
                <div className="flex-1 h-[30%] bg-primary/40 rounded-t-sm" />
                <div className="flex-1 h-[60%] bg-primary rounded-t-sm" />
                <div className="flex-1 h-[45%] bg-primary/60 rounded-t-sm" />
                <div className="flex-1 h-[80%] bg-primary/80 rounded-t-sm" />
                <div className="flex-1 h-[55%] bg-primary/50 rounded-t-sm" />
                <BarChart3 size={24} className="absolute top-2 left-2 text-primary/30" />
              </div>
              <div className="flex gap-3 sm:gap-4 h-16 w-full">
                 <div className="flex-1 bg-surface rounded-xl border-2 border-outline-variant shadow-lg p-2 flex flex-col justify-between">
                    <div className="w-full h-1.5 rounded-full bg-primary/20" />
                    <div className="w-3/4 h-2 rounded-full bg-primary/50" />
                 </div>
                 <div className="flex-1 bg-surface rounded-xl border-2 border-outline-variant shadow-lg p-2 flex flex-col justify-between">
                    <div className="w-full h-1.5 rounded-full bg-primary/20" />
                    <div className="w-1/2 h-2 rounded-full bg-primary/50" />
                 </div>
              </div>
            </div>
          </div>
          <div className="absolute w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
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
      bgClass: "bg-surface",
      accent: "text-accent bg-accent/10",
      illustration: (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-background/80">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:16px_16px] opacity-10" />
          <div className="absolute inset-0 opacity-40 transition-opacity duration-700 group-hover:opacity-60" style={{ background: "radial-gradient(circle at center, var(--color-accent) 0%, transparent 70%)" }} />
          
          <div className="absolute w-56 h-56 bg-primary/10 rounded-full blur-3xl opacity-50" />

          {/* Connection lines */}
          <div className="absolute w-[150%] h-[1px] bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent rotate-45 transform transition-transform duration-1000 group-hover:rotate-12" />
          <div className="absolute w-[150%] h-[1px] bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent -rotate-45 transform transition-transform duration-1000 group-hover:-rotate-12" />

          <div className="relative z-10 w-56 h-36 flex flex-col justify-end gap-3 transform transition-transform duration-700 group-hover:scale-105 group-hover:-translate-y-2">
            <div className="self-start w-32 px-3 py-2 bg-surface rounded-xl rounded-bl-sm border-2 border-outline-variant shadow-md flex items-center gap-2 transform -rotate-2 -translate-x-2">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Users size={12} className="text-primary" />
              </div>
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="w-full h-1.5 bg-primary/20 rounded-full" />
                <div className="w-4/5 h-1.5 bg-primary/20 rounded-full" />
              </div>
            </div>

            <div className="self-end w-36 px-3 py-2 bg-primary/10 rounded-xl border-2 border-primary/20 rounded-br-sm shadow-md flex items-center gap-2 transform rotate-2 translate-x-2 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-accent)]/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
               <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="w-full h-1.5 bg-primary/50 rounded-full" />
                <div className="w-2/3 h-1.5 bg-primary/50 rounded-full" />
              </div>
            </div>
            
            <div className="self-start px-4 py-2 bg-surface rounded-xl rounded-bl-sm border-2 border-primary/30 shadow-lg flex items-center gap-2 -translate-y-1 relative">
               <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
            
          </div>
          
          <MessageSquare size={100} className="text-primary/5 absolute right-4 top-4 rotate-12" />
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
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button - Island Style */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center transition-all duration-200 pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-4 sm:px-6">
        <div className="flex items-center justify-between w-full transition-all duration-200 pointer-events-auto bg-surface/90 backdrop-blur-md rounded-xl shadow-md border-2 border-outline-variant/60 px-4 py-2 max-w-3xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <h1 className="font-medium text-title-medium sm:text-title-large md:text-headline-small text-on-background tracking-normal font-display m-0 p-0 ml-1 py-1">My Live Works</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)]">
        <div className="w-full max-w-4xl pt-4 sm:pt-8">
          <div className="mb-8 text-left max-w-2xl">
            <p className="text-on-surface-variant text-title-medium leading-relaxed">
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
                className={`group border-2 border-outline-variant shadow-sm rounded-xl transition-all relative overflow-hidden flex flex-col ${project.bgClass}`}
              >
                {/* Image Thumbnail / Vector Illustration */}
                <div className="w-full h-48 md:h-56 overflow-hidden relative border-b-2 border-outline-variant shrink-0">
                  <div className="absolute inset-0 bg-[var(--text-main)]/5 group-hover:bg-transparent transition-colors duration-500 z-20 pointer-events-none" />
                  {project.illustration}
                </div>

                <div className="p-6 md:p-8 flex flex-col relative z-20 w-full text-left flex-1">
                  {/* Secondary accent highlight hover shimmer */}
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
                  
                  <div className="flex-1 text-left relative z-10">
                    <span className={`text-label-small font-medium tracking-wide px-3 py-1.5 rounded-full ${project.accent}`}>
                      Live Sandbox
                    </span>
                    <h2 className="text-headline-large md:text-[28px] font-medium mt-5 text-on-background text-left font-display">
                      {project.title}
                    </h2>
                    <p className="text-body-medium text-on-surface-variant mt-1 mb-4 text-left">
                      {project.subtitle}
                    </p>
                    <p className="text-[#444746] text-title-small leading-relaxed mb-6 text-left">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6 justify-start">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-label-medium font-medium px-3 py-1.5 bg-[#F1F3F4] rounded-full text-[#444746] hover:bg-[var(--border-light)] transition-colors cursor-default border-2 border-transparent">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Operational stats */}
                    <div className="grid grid-cols-3 gap-4 border-t-2 border-outline-variant pt-6 max-w-xl text-left mt-auto">
                      {Object.entries(project.stats).map(([key, val]) => (
                        <div key={key} className="text-left">
                          <p className="text-label-small text-on-surface-variant font-medium">{key}</p>
                          <p className="font-mono text-body-small font-medium text-on-background mt-1 leading-none">{val}</p>
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
                      className="flex items-center justify-center gap-2 bg-accent text-on-primary px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity font-medium text-body-medium cursor-pointer shadow-sm no-underline border-0"
                    >
                      View Live <ExternalLink size={16} />
                    </a>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 border-2 border-accent/20 bg-accent/5 text-accent px-6 py-2.5 rounded-full hover:bg-accent/10 transition-colors font-medium text-body-medium cursor-pointer no-underline"
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
      
      {/* Floating Bottom Navigation */}
      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface/90 backdrop-blur-md rounded-full shadow-lg border-2 border-outline-variant/60 px-2 py-2">
          {onToggleDrawer && (
            <button 
              onClick={onToggleDrawer}
              className="md:hidden flex items-center justify-center w-12 h-12 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent"
              title="Menu"
            >
              <Menu size={24} />
            </button>
          )}
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center gap-2 h-12 px-5 md:px-6 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent"
            title="Back to Chat"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-title-small">Back to Chat</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
