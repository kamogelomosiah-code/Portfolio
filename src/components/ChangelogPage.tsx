import { motion } from "motion/react";
import { ArrowLeft, Menu, GitCommit, Clock, CheckCircle2, Milestone, ShieldAlert, Sparkles, Paintbrush, Cpu } from "lucide-react";

interface ChangelogPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  status: "current" | "previous";
  changes: {
    type: "added" | "fixed" | "improved" | "security";
    text: string;
  }[];
}

export default function ChangelogPage({ onBackToChat, onToggleDrawer }: ChangelogPageProps) {
  const changelogData: ChangelogItem[] = [
    {
      version: "v1.4.0",
      date: "July 5, 2026",
      title: "Changelog & Versioning Engine",
      status: "current",
      changes: [
        { type: "added", text: "Created the interactive, responsive in-app Changelog & Version History timeline view." },
        { type: "added", text: "Added dedicated file-based CHANGELOG.md for structured iteration tracking." },
        { type: "improved", text: "Integrated the update log module seamlessly into both desktop sidebar and mobile menu drawer." }
      ]
    },
    {
      version: "v1.3.0",
      date: "July 5, 2026",
      title: "Theme Harmonization & LLM Optimization",
      status: "previous",
      changes: [
        { type: "fixed", text: "Harmonized light/dark background colors globally (no dark residues on light theme sidebar and panels)." },
        { type: "improved", text: "Suppressed excessive emojis in AI assistant answers to at most 1 or 2 per response." },
        { type: "improved", text: "Constrained AI output generation length for highly concise, RAM-efficient model execution." }
      ]
    },
    {
      version: "v1.2.0",
      date: "July 4, 2026",
      title: "Material UI Icon Standardization",
      status: "previous",
      changes: [
        { type: "fixed", text: "Standardized the custom Kamo AI Watermelon Icon using Material design's psychology glyph." },
        { type: "fixed", text: "Corrected layout sizing, responsive margins, and padding constraints on all action buttons." },
        { type: "improved", text: "Cleaned up legacy asset imports to ensure stable, warning-free compiler build." }
      ]
    },
    {
      version: "v1.1.0",
      date: "July 3, 2026",
      title: "Think Longer Debate & Calendar Integration",
      status: "previous",
      changes: [
        { type: "added", text: "Implemented 'Think Longer' mode executing multi-pipeline model voting using HF Serverless API." },
        { type: "added", text: "Added Google Calendar integration via Express API proxy routes." },
        { type: "added", text: "Built modular Sandboxes for showcasing dynamic Projects and Resume/CV lists." }
      ]
    },
    {
      version: "v1.0.0",
      date: "July 1, 2026",
      title: "Platform Launch",
      status: "previous",
      changes: [
        { type: "added", text: "Configured full-stack React + Express boilerplate structured for Render's 512 MB memory limit." },
        { type: "added", text: "Designed responsive sliding Menu Drawer and responsive desktop layout navigation." }
      ]
    }
  ];

  const getTypeStyle = (type: "added" | "fixed" | "improved" | "security") => {
    switch (type) {
      case "added":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "fixed":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "improved":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "security":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  };

  const getTypeIcon = (type: "added" | "fixed" | "improved" | "security") => {
    switch (type) {
      case "added":
        return <Sparkles size={11} />;
      case "fixed":
        return <ShieldAlert size={11} />;
      case "improved":
        return <Paintbrush size={11} />;
      case "security":
        return <Cpu size={11} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar - Island Style */}
      <div className="absolute top-0 left-0 md:left-20 lg:left-[88px] right-0 z-30 flex justify-center pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-3 sm:px-4">
        <div className="flex items-center justify-between w-full pointer-events-auto bg-surface/90 backdrop-blur-md rounded-xl shadow-md border border-outline-variant/60 px-4 py-2 max-w-3xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <h1 className="font-medium text-title-medium sm:text-title-large md:text-headline-small text-on-background tracking-normal font-display m-0 p-0 ml-1 py-1">System Changelog</h1>
          </div>
        </div>
      </div>

      {/* Main Timeline Scrollable Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)]">
        <div className="w-full max-w-2xl pt-4 sm:pt-8 text-left">
          
          <div className="mb-10 max-w-xl">
            <p className="text-on-surface-variant text-title-small sm:text-title-medium leading-relaxed">
              Tracking core platform system changes, layout iterations, chatbot features, and backend LLM pipeline optimizations.
            </p>
          </div>

          {/* Interactive Timeline Graph */}
          <div className="relative pl-6 sm:pl-8 border-l border-outline-variant ml-2 sm:ml-4 space-y-12">
            
            {changelogData.map((item, index) => (
              <motion.div
                key={item.version}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative group"
              >
                {/* Timeline Bullet Node */}
                <div className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 sm:w-5 h-4 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  item.status === "current"
                    ? "bg-surface border-primary shadow-[0_0_10px_rgba(var(--color-accent),0.3)] scale-110"
                    : "bg-background border-[var(--text-muted)]/50 group-hover:border-primary"
                }`}>
                  {item.status === "current" ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]/50 group-hover:bg-primary" />
                  )}
                </div>

                {/* Main Version Block Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-label-medium font-mono font-bold px-2 py-0.5 rounded-md ${
                      item.status === "current"
                        ? "bg-primary text-on-primary"
                        : "bg-[var(--border-light)] text-on-surface-variant"
                    }`}>
                      {item.version}
                    </span>
                    <h2 className="text-[17px] sm:text-[19px] font-semibold text-on-background font-display tracking-tight">
                      {item.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-label-small sm:text-label-medium text-on-surface-variant">
                    <Clock size={12} />
                    <span>{item.date}</span>
                  </div>
                </div>

                {/* Version Log Card Body */}
                <div className="p-4 sm:p-5 rounded-xl bg-surface border border-outline-variant hover:border-primary/30 transition-all shadow-sm">
                  <ul className="space-y-3.5 m-0 p-0 list-none">
                    {item.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-3 text-[13.5px] sm:text-body-medium text-on-background">
                        <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeStyle(change.type)}`}>
                          {getTypeIcon(change.type)}
                          <span>{change.type}</span>
                        </span>
                        <span className="leading-relaxed text-on-background/90 pt-0.5">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            ))}

          </div>

        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface/90 backdrop-blur-md rounded-full shadow-lg border border-outline-variant/60 px-2 py-2">
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
