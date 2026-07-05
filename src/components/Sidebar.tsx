import { memo } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { WatermelonIcon } from "./WatermelonIcon";

interface SidebarProps {
  currentTab: "chat" | "projects" | "cv" | "contact" | "changelog" | "workspace";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact" | "changelog" | "workspace") => void;
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
                ? "text-[var(--color-accent)] font-semibold" 
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] font-normal"
            }`}
            title="Kamo AI Chatbot Agent"
          >
            <div className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${currentTab === "chat" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "text-inherit group-hover:bg-[var(--bg-elevated)]"}`}>
               <MaterialIcon name="forum" className="text-[22px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Chat</span>
          </button>

          <button 
            onClick={() => onTabChange("projects")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "projects" 
                ? "text-[var(--color-accent)] font-semibold" 
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] font-normal"
            }`}
            title="My Live Projects"
          >
            <div className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${currentTab === "projects" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "text-inherit group-hover:bg-[var(--bg-elevated)]"}`}>
               <MaterialIcon name="code" className="text-[22px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Projects</span>
          </button>

          <button 
            onClick={() => onTabChange("cv")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "cv" 
                ? "text-[var(--color-accent)] font-semibold" 
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] font-normal"
            }`}
            title="Interactive CV / Resume"
          >
            <div className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${currentTab === "cv" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "text-inherit group-hover:bg-[var(--bg-elevated)]"}`}>
               <MaterialIcon name="description" className="text-[22px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">CV</span>
          </button>

          <button 
            onClick={() => onTabChange("contact")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "contact" 
                ? "text-[var(--color-accent)] font-semibold" 
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] font-normal"
            }`}
            title="Get In Touch"
          >
            <div className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${currentTab === "contact" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "text-inherit group-hover:bg-[var(--bg-elevated)]"}`}>
               <MaterialIcon name="mail" className="text-[22px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Contact</span>
          </button>

          <button 
            onClick={() => onTabChange("workspace")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "workspace" 
                ? "text-[var(--color-accent)] font-semibold" 
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] font-normal"
            }`}
            title="Google Workspace Hub"
          >
            <div className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${currentTab === "workspace" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "text-inherit group-hover:bg-[var(--bg-elevated)]"}`}>
               <MaterialIcon name="apps" className="text-[22px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Workspace</span>
          </button>

          <button 
            onClick={() => onTabChange("changelog")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "changelog" 
                ? "text-[var(--color-accent)] font-semibold" 
                : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] font-normal"
            }`}
            title="System Updates Log"
          >
            <div className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${currentTab === "changelog" ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "text-inherit group-hover:bg-[var(--bg-elevated)]"}`}>
               <MaterialIcon name="history" className="text-[22px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Updates</span>
          </button>
        </div>
      </div>

      {/* Social and External Anchor Points */}
      <div className="flex flex-col gap-2 items-center">
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer" 
          className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors shrink-0 cursor-pointer" 
          title="GitHub Account"
        >
          <MaterialIcon name="terminal" className="text-[20px]" />
        </a>
        <a 
          href="https://linkedin.com" 
          target="_blank" 
          rel="noreferrer" 
          className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-colors shrink-0 cursor-pointer" 
          title="LinkedIn Profile"
        >
          <MaterialIcon name="work" className="text-[20px]" />
        </a>
      </div>
    </div>
  );
});

export default Sidebar;
