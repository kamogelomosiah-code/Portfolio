import { motion } from "motion/react";
import { ExternalLink, Github, ArrowLeft, Menu } from "lucide-react";

interface ProjectsPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

const PROJECTS = [
  {
    title: "Master API Service",
    subtitle: "Central Orchestration Backend",
    description:
      "API gateway and orchestration service acting as a unified backend layer for distributed applications, structured data routing, and external service integration.",
    stack: ["Node.js", "Express", "API Gateway", "Backend Architecture"],
    stats: [
      { label: "Deployment", value: "Active" },
      { label: "Host", value: "Render" },
      { label: "Architecture", value: "Microservices" },
    ],
    github: "https://github.com/kamogelomosiah",
    live: "https://masterapi-main.onrender.com/",
  },
  {
    title: "Interactive CV Maker",
    subtitle: "Dynamic Resume Generation Platform",
    description:
      "Responsive CV builder enabling users to structure, preview, and export formatted resumes with dynamic template rendering and database persistence.",
    stack: ["React.js", "TypeScript", "Tailwind CSS", "PDF Export"],
    stats: [
      { label: "Platform", value: "Web" },
      { label: "Status", value: "Live App" },
      { label: "Interface", value: "Interactive" },
    ],
    github: "https://github.com/kamogelomosiah",
    live: "https://cvmaker-v371.onrender.com/",
  },
  {
    title: "UJ Stock Manager",
    subtitle: "Inventory Control System",
    description:
      "Inventory and stock management platform built for tracking academic resources, equipment lifecycles, and lab materials with administrative reporting.",
    stack: ["Full-Stack", "Database Management", "Analytics", "Asset Tracking"],
    stats: [
      { label: "Scope", value: "Enterprise" },
      { label: "Target", value: "UJ" },
      { label: "Tracking", value: "Real-time" },
    ],
    github: "https://github.com/kamogelomosiah",
    live: "https://ujstockmanager.onrender.com/",
  },
  {
    title: "Real-time Chat App",
    subtitle: "Live Communication Platform",
    description:
      "Streamlined real-time messaging application featuring live presence indicators, typing state updates, and persistent message history over WebSockets.",
    stack: ["WebSockets", "React.js", "Real-time", "Messaging"],
    stats: [
      { label: "Status", value: "Deployed" },
      { label: "Transport", value: "WebSockets" },
      { label: "Latency", value: "<50ms" },
    ],
    github: "https://github.com/kamogelomosiah",
    live: "https://s-c4nk.onrender.com/",
  },
];

export default function ProjectsPage({ onBackToChat, onToggleDrawer }: ProjectsPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden"
    >
      <header className="h-14 shrink-0 border-b border-outline-variant bg-surface px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleDrawer && (
            <button
              type="button"
              onClick={onToggleDrawer}
              className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 h-10 px-2.5 -ml-1 md:ml-0 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <span className="text-outline-variant select-none">/</span>
          <h1 className="text-sm sm:text-base font-semibold text-on-background truncate">Projects</h1>
        </div>
        <span className="font-mono text-xs text-on-surface-variant tabular-nums shrink-0">
          {PROJECTS.length} works
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-8 pb-6 border-b border-outline-variant">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-background">
              Selected Work
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-2 leading-relaxed max-w-xl">
              Full-stack applications, backend APIs, and real-time systems built and deployed by Kamogelo Mosia.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {PROJECTS.map((project, index) => (
              <article
                key={project.title}
                className="border border-outline-variant rounded-xl bg-surface p-5 sm:p-6 transition-colors hover:border-outline"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-xs text-on-surface-variant tabular-nums">
                      0{index + 1}
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-on-background tracking-tight">
                      {project.title}
                    </h3>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {project.subtitle}
                  </span>
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed mt-2 mb-4">
                  {project.description}
                </p>

                <p className="font-mono text-xs text-on-surface-variant mb-5">
                  {project.stack.join(" · ")}
                </p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline-variant mb-5">
                  {project.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-[11px] text-on-surface-variant">{stat.label}</div>
                      <div className="font-mono text-xs font-medium text-on-background mt-0.5 tabular-nums">
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-4 h-10 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm no-underline whitespace-nowrap shrink-0"
                  >
                    <span>View Live</span>
                    <ExternalLink size={14} />
                  </a>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 border border-outline-variant bg-surface-container-low text-on-background px-4 h-10 rounded-lg hover:bg-surface-container transition-colors font-medium text-sm no-underline whitespace-nowrap shrink-0"
                  >
                    <span>Source</span>
                    <Github size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
