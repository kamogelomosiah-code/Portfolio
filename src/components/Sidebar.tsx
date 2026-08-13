import { memo } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { AppIcon } from "./AppIcon";

interface SidebarProps {
  currentTab: "chat" | "projects" | "cv" | "contact" | "changelog" | "planner";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact" | "changelog" | "planner") => void;
}

const Sidebar = memo(function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  return (
    <div className="hidden md:flex w-20 lg:w-[88px] h-screen border-r-2 border-outline-variant flex-col items-center py-6 justify-between shrink-0 fixed left-0 bg-background z-20">
      <div className="flex flex-col gap-6 items-center w-full">
        {/* Logo Icon */}
        <div 
          onClick={() => onTabChange("chat")}
          className="w-[42px] h-[42px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity duration-300 text-accent"
        >
          <AppIcon className="w-8 h-8" />
        </div>
        
        {/* Navigation Section */}
        <div className="flex flex-col gap-3 items-center w-full px-3">
          <button 
            onClick={() => onTabChange("chat")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "chat" 
                ? "text-primary font-semibold" 
                : "bg-transparent text-on-surface-variant hover:text-on-background font-normal"
            }`}
            title="Kamo AI Chatbot Agent"
          >
            <div className={`flex items-center justify-center transition-all ${currentTab === "chat" ? "text-primary" : "text-inherit"}`}>
               <MaterialIcon name="forum" className="text-headline-medium" />
            </div>
            <span className="text-label-small font-sans text-center leading-none mt-1">Chat</span>
          </button>

          <button 
            onClick={() => onTabChange("planner")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "planner" 
                ? "text-primary font-semibold" 
                : "bg-transparent text-on-surface-variant hover:text-on-background font-normal"
            }`}
            title="AI Action Planner"
          >
            <div className={`flex items-center justify-center transition-all ${currentTab === "planner" ? "text-primary" : "text-inherit"}`}>
               <MaterialIcon name="track_changes" className="text-headline-medium" />
            </div>
            <span className="text-label-small font-sans text-center leading-none mt-1">Planner</span>
          </button>

          <button 
            onClick={() => onTabChange("projects")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "projects" 
                ? "text-primary font-semibold" 
                : "bg-transparent text-on-surface-variant hover:text-on-background font-normal"
            }`}
            title="My Live Projects"
          >
            <div className={`flex items-center justify-center transition-all ${currentTab === "projects" ? "text-primary" : "text-inherit"}`}>
               <MaterialIcon name="code" className="text-headline-medium" />
            </div>
            <span className="text-label-small font-sans text-center leading-none mt-1">Projects</span>
          </button>

          <button 
            onClick={() => onTabChange("cv")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "cv" 
                ? "text-primary font-semibold" 
                : "bg-transparent text-on-surface-variant hover:text-on-background font-normal"
            }`}
            title="Interactive CV / Resume"
          >
            <div className={`flex items-center justify-center transition-all ${currentTab === "cv" ? "text-primary" : "text-inherit"}`}>
               <MaterialIcon name="description" className="text-headline-medium" />
            </div>
            <span className="text-label-small font-sans text-center leading-none mt-1">CV</span>
          </button>

          <button 
            onClick={() => onTabChange("contact")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "contact" 
                ? "text-primary font-semibold" 
                : "bg-transparent text-on-surface-variant hover:text-on-background font-normal"
            }`}
            title="Get In Touch"
          >
            <div className={`flex items-center justify-center transition-all ${currentTab === "contact" ? "text-primary" : "text-inherit"}`}>
               <MaterialIcon name="mail" className="text-headline-medium" />
            </div>
            <span className="text-label-small font-sans text-center leading-none mt-1">Contact</span>
          </button>



          <button 
            onClick={() => onTabChange("changelog")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-none transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "changelog" 
                ? "text-primary font-semibold" 
                : "bg-transparent text-on-surface-variant hover:text-on-background font-normal"
            }`}
            title="System Updates Log"
          >
            <div className={`flex items-center justify-center transition-all ${currentTab === "changelog" ? "text-primary" : "text-inherit"}`}>
               <MaterialIcon name="history" className="text-headline-medium" />
            </div>
            <span className="text-label-small font-sans text-center leading-none mt-1">Updates</span>
          </button>
        </div>
      </div>

      {/* Social and External Anchor Points */}
      <div className="flex flex-col gap-2 items-center">
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer" 
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors shrink-0 cursor-pointer" 
          title="GitHub Account"
        >
          <MaterialIcon name="terminal" className="text-headline-small" />
        </a>
        <a 
          href="https://linkedin.com" 
          target="_blank" 
          rel="noreferrer" 
          className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors shrink-0 cursor-pointer" 
          title="LinkedIn Profile"
        >
          <MaterialIcon name="work" className="text-headline-small" />
        </a>
      </div>
    </div>
  );
});

export default Sidebar;
