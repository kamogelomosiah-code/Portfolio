import { memo } from "react";
import { Github, Linkedin, Mail, FileText, Code2, LayoutDashboard } from "lucide-react";
import { WatermelonIcon } from "./WatermelonIcon";

interface SidebarProps {
  currentTab: "chat" | "projects" | "cv" | "contact";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact") => void;
}

const Sidebar = memo(function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  return (
    <div className="hidden md:flex w-20 lg:w-[88px] h-screen border-r border-[var(--border-light)] flex-col items-center py-6 justify-between shrink-0 fixed left-0 bg-[var(--bg-main)] z-20">
      <div className="flex flex-col gap-6 items-center w-full">
        {/* Logo Icon */}
        <div 
          onClick={() => onTabChange("chat")}
          className="w-[42px] h-[42px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-300 text-accent"
        >
          <WatermelonIcon className="w-8 h-8" />
        </div>
        
        {/* Navigation Section */}
        <div className="flex flex-col gap-3 items-center w-full px-3">
          <button 
            onClick={() => onTabChange("chat")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "chat" 
                ? "bg-[var(--color-accent-light)] text-accent font-medium" 
                : "bg-transparent text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] font-normal"
            }`}
            title="Kamo AI Chatbot Agent"
          >
            <div className={`px-4 py-1 rounded-none ${currentTab === "chat" ? "bg-[#d2e3fc]" : ""}`}>
               <LayoutDashboard size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Chat</span>
          </button>

          <button 
            onClick={() => onTabChange("projects")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "projects" 
                ? "bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium" 
                : "bg-transparent text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] font-normal"
            }`}
            title="My Live Projects"
          >
            <div className={`px-4 py-1 rounded-none ${currentTab === "projects" ? "bg-[#d2e3fc]" : ""}`}>
               <Code2 size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Projects</span>
          </button>

          <button 
            onClick={() => onTabChange("cv")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "cv" 
                ? "bg-[var(--bg-accent-light)] text-[var(--color-accent)] font-medium" 
                : "bg-transparent text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] font-normal"
            }`}
            title="Interactive CV / Resume"
          >
            <div className={`px-4 py-1 rounded-none ${currentTab === "cv" ? "bg-[#d2e3fc]" : ""}`}>
               <FileText size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">CV</span>
          </button>

          <button 
            onClick={() => onTabChange("contact")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "contact" 
                ? "bg-[var(--bg-accent-light)] text-[var(--color-accent)] font-medium" 
                : "bg-transparent text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)] font-normal"
            }`}
            title="Get In Touch"
          >
            <div className={`px-4 py-1 rounded-none ${currentTab === "contact" ? "bg-[#d2e3fc]" : ""}`}>
               <Mail size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Contact</span>
          </button>
        </div>
      </div>

      {/* Social and External Anchor Points */}
      <div className="flex flex-col gap-2 items-center">
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer" 
          className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 transition-colors shrink-0 cursor-pointer" 
          title="GitHub Account"
        >
          <Github size={20} strokeWidth={2} />
        </a>
        <a 
          href="https://linkedin.com" 
          target="_blank" 
          rel="noreferrer" 
          className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 transition-colors shrink-0 cursor-pointer" 
          title="LinkedIn Profile"
        >
          <Linkedin size={20} strokeWidth={2} />
        </a>
      </div>
    </div>
  );
});

export default Sidebar;
