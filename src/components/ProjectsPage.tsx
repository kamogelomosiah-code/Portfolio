import { motion } from "motion/react";
import { ExternalLink, Github, Code2, ArrowLeft, Menu } from "lucide-react";

interface ProjectsPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

export default function ProjectsPage({ onBackToChat, onToggleDrawer }: ProjectsPageProps) {
  const projects = [
    {
      title: "CallTrax",
      subtitle: "Client Tracking & Billing Platform",
      description: "A robust client tracking and billing workspace designed and deployed completely from scratch for active, paying corporate service providers. Integrates direct account ledger controls and real-time state logging.",
      tags: ["PHP", "Laravel", "React.js", "MySQL", "Tailwind CSS"],
      stats: { "Deployment": "Active", "Data Base": "MySQL", "Framework": "Laravel" },
      github: "https://github.com/kamogelomosiah",
      live: "https://call-trax.co.za",
      bgClass: "bg-gradient-to-br from-blue-50/70 to-sky-50/30 border-blue-200 hover:border-blue-400 hover:ring-4 hover:ring-blue-100/50",
      accent: "text-blue-600 bg-blue-50/50"
    },
    {
      title: "kamocodes API",
      subtitle: "Central API Gateway & Sandboxes",
      description: "A live, self-maintained central API gateway running behind several independent web tools and personal developer sandboxes, handling request parsing and routing safely.",
      tags: ["PHP", "Laravel", "REST API", "PostgreSQL"],
      stats: { "Engine": "Laravel", "Queries": "RESTful", "Uptime": "99.9%" },
      github: "https://github.com/kamogelomosiah",
      live: "https://api.kamocodes.xyz",
      bgClass: "bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border-emerald-200 hover:border-emerald-400 hover:ring-4 hover:ring-emerald-100/50",
      accent: "text-emerald-700 bg-emerald-50/50"
    },
    {
      title: "kamocodes Library",
      subtitle: "Academic Library Tracker",
      description: "A live-deployed cataloging and library catalog system with full student membership logs, active borrowing indicators, and analytics trackers for tracking borrow history.",
      tags: ["TypeScript", "React.js", "Laravel", "MySQL"],
      stats: { "Platform": "TypeScript", "Status": "Live Work", "Clients": "Active" },
      github: "https://github.com/kamogelomosiah",
      live: "https://library.kamocodes.xyz",
      bgClass: "bg-gradient-to-br from-amber-50/60 to-orange-50/20 border-amber-200 hover:border-amber-400 hover:ring-4 hover:ring-amber-100/50",
      accent: "text-amber-700 bg-amber-50/50"
    },
    {
      title: "Personal AI Portfolio App",
      subtitle: "Voice Assistant & Resume Platform",
      description: "Full-stack portfolio featuring automated voice command transcription, Firestore CMS, and real-time interactive sandboxes, powered by Gemini LLM reasoning capabilities.",
      tags: ["TypeScript", "Firebase", "Gemini AI", "Vite", "Tailwind CSS"],
      stats: { "AI Engine": "Gemini 3.5", "Data Store": "Firestore", "Build": "Vite/React" },
      github: "https://github.com/kamogelomosiah",
      live: "#",
      bgClass: "bg-gradient-to-br from-purple-50/70 to-violet-50/30 border-purple-200 hover:border-purple-400 hover:ring-4 hover:ring-purple-100/50",
      accent: "text-purple-700 bg-purple-50/50"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-[#F9F9F9] text-black flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar with Back Button */}
      <div className="w-full h-20 flex items-center justify-between px-4 sm:px-6 bg-[#F9F9F9] z-10 shrink-0 border-b border-gray-200/60">
        <div className="flex items-center gap-3 m-0 p-0">
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 text-black transition-colors shadow-sm cursor-pointer shrink-0 m-0"
            style={{ borderRadius: '100%' }}
            title="Back to conversational agent"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="font-semibold text-lg text-black tracking-tight font-sans m-0 p-0">My Live Works</h1>
        </div>
      </div>

      {/* Main Content Area - Flush on mobile, Card on desktop */}
      <div className="flex-1 overflow-y-auto w-full md:w-auto flex flex-col items-center pb-32 px-6 md:px-12 bg-white md:rounded-tl-2xl md:shadow-sm md:border md:border-gray-100 md:mx-4 md:mt-2 mx-0 mt-0 border-0 rounded-none shadow-none">
        <div className="w-full max-w-4xl pt-10 md:pt-14">
          <div className="mb-10 text-left">
            <p className="text-gray-500 text-sm md:text-base max-w-2xl leading-relaxed">
              A showcase of full-stack engineering, specialized AI integrations, and responsive micro-architectures.
            </p>
          </div>

          <div className="flex flex-col gap-8 w-full">
            {projects.map((project, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                key={project.title}
                className={`group border rounded-[24px] p-6 md:p-8 transition-all relative overflow-hidden ${project.bgClass || "border-slate-200 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9]"}`}
              >
                {/* Secondary accent highlight hover shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
                
                <div className="flex flex-col gap-6 relative z-10 w-full text-left">
                  <div className="flex-1 text-left">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ${project.accent || "text-accent bg-accent/5"}`}>
                      Live Sandbox
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold mt-4 text-black group-hover:text-accent transition-colors text-left font-sans">
                      {project.title}
                    </h2>
                    <p className="text-xs font-semibold text-gray-400 mt-1 mb-4 italic text-left">
                      {project.subtitle}
                    </p>
                    <p className="text-gray-650 text-sm md:text-base leading-relaxed mb-6 text-left font-sans">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6 justify-start">
                      {project.tags.map((tag) => (
                        <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 bg-white border border-gray-150 rounded-full text-black hover:bg-black hover:text-white transition-colors cursor-default">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Operational stats */}
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6 max-w-xl text-left">
                      {Object.entries(project.stats).map(([key, val]) => (
                        <div key={key} className="text-left">
                          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">{key}</p>
                          <p className="font-mono text-xs sm:text-sm font-bold text-black mt-1 leading-none">{val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buttons left aligned */}
                  <div className="flex flex-wrap gap-3 mt-4 justify-start">
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-full hover:bg-accent transition-colors font-semibold text-xs sm:text-sm cursor-pointer shadow-sm"
                    >
                      View Live <ExternalLink size={13} />
                    </a>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 border border-slate-300 bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors font-semibold text-xs sm:text-sm cursor-pointer shadow-sm"
                    >
                      Source <Github size={13} />
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
