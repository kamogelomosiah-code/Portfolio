import { memo } from "react";
import { Github, Linkedin, Mail, FileText, Code2, LayoutDashboard } from "lucide-react";
import appIcon from "../assets/app_icon.png";

interface SidebarProps {
  currentTab: "chat" | "projects" | "cv" | "contact";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact") => void;
}

const Sidebar = memo(function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  return (
    <div className="hidden md:flex w-20 lg:w-[88px] h-screen border-r border-gray-200 flex-col items-center py-6 justify-between shrink-0 fixed left-0 bg-[#F8F9FA] z-20">
      <div className="flex flex-col gap-6 items-center w-full">
        {/* Logo Icon */}
        <div 
          onClick={() => onTabChange("chat")}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors duration-300 bg-white border border-gray-200 overflow-hidden shadow-sm"
        >
          <img src={appIcon} alt="App Icon" className="w-[80%] h-[80%] object-contain" />
        </div>
        
        {/* Navigation Section */}
        <div className="flex flex-col gap-3 items-center w-full px-3">
          <button 
            onClick={() => onTabChange("chat")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-2xl transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "chat" 
                ? "bg-[#E8F0FE] text-[#1A73E8] font-medium" 
                : "bg-transparent text-[#5F6368] hover:bg-black/5 hover:text-[#202124] font-normal"
            }`}
            title="Kamo AI Chatbot Agent"
          >
            <div className={`px-4 py-1 rounded-full ${currentTab === "chat" ? "bg-[#d2e3fc]" : ""}`}>
               <LayoutDashboard size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Chat</span>
          </button>

          <button 
            onClick={() => onTabChange("projects")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-2xl transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "projects" 
                ? "bg-[#E8F0FE] text-[#1A73E8] font-medium" 
                : "bg-transparent text-[#5F6368] hover:bg-black/5 hover:text-[#202124] font-normal"
            }`}
            title="My Live Projects"
          >
            <div className={`px-4 py-1 rounded-full ${currentTab === "projects" ? "bg-[#d2e3fc]" : ""}`}>
               <Code2 size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">Projects</span>
          </button>

          <button 
            onClick={() => onTabChange("cv")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-2xl transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "cv" 
                ? "bg-[#E8F0FE] text-[#1A73E8] font-medium" 
                : "bg-transparent text-[#5F6368] hover:bg-black/5 hover:text-[#202124] font-normal"
            }`}
            title="Interactive CV / Resume"
          >
            <div className={`px-4 py-1 rounded-full ${currentTab === "cv" ? "bg-[#d2e3fc]" : ""}`}>
               <FileText size={22} className="stroke-[2px]" />
            </div>
            <span className="text-[11px] font-sans text-center leading-none mt-1">CV</span>
          </button>

          <button 
            onClick={() => onTabChange("contact")}
            className={`flex flex-col items-center justify-center w-full gap-1 p-2 rounded-2xl transition-all duration-300 group cursor-pointer border-0 ${
              currentTab === "contact" 
                ? "bg-[#E8F0FE] text-[#1A73E8] font-medium" 
                : "bg-transparent text-[#5F6368] hover:bg-black/5 hover:text-[#202124] font-normal"
            }`}
            title="Get In Touch"
          >
            <div className={`px-4 py-1 rounded-full ${currentTab === "contact" ? "bg-[#d2e3fc]" : ""}`}>
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
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-black/5 transition-colors shrink-0 cursor-pointer" 
          title="GitHub Account"
        >
          <Github size={20} strokeWidth={2} />
        </a>
        <a 
          href="https://linkedin.com" 
          target="_blank" 
          rel="noreferrer" 
          className="w-10 h-10 flex items-center justify-center rounded-full text-[#5F6368] hover:text-[#202124] hover:bg-black/5 transition-colors shrink-0 cursor-pointer" 
          title="LinkedIn Profile"
        >
          <Linkedin size={20} strokeWidth={2} />
        </a>
      </div>
    </div>
  );
});

export default Sidebar;
