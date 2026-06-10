import { Github, Linkedin, Mail, FileText, Code2, LayoutDashboard } from "lucide-react";
import appIcon from "../assets/app_icon.png";

interface SidebarProps {
  currentTab: "chat" | "projects" | "cv" | "contact";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact") => void;
}

export default function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  return (
    <div className="hidden md:flex w-20 lg:w-24 h-screen border-r border-gray-150 flex-col items-center py-8 justify-between shrink-0 fixed left-0 bg-white z-20">
      <div className="flex flex-col gap-8 items-center w-full">
        {/* Logo Icon */}
        <div 
          onClick={() => onTabChange("chat")}
          className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300 bg-white border border-gray-100 overflow-hidden shadow-sm"
        >
          <img src={appIcon} alt="App Icon" className="w-full h-full object-cover" />
        </div>
        
        {/* Navigation Section */}
        <div className="flex flex-col gap-4 items-center w-full px-3">
          <button 
            onClick={() => onTabChange("chat")}
            className={`p-3 rounded-full transition-all duration-300 relative group cursor-pointer ${
              currentTab === "chat" 
                ? "bg-black text-white" 
                : "text-gray-400 hover:text-black hover:bg-gray-50"
            }`}
            title="Kamo AI Chatbot Agent"
          >
            <LayoutDashboard size={20} />
            <span className="absolute left-16 bg-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-50 pointer-events-none">
              Conversational Chat
            </span>
          </button>

          <button 
            onClick={() => onTabChange("projects")}
            className={`p-3 rounded-full transition-all duration-300 relative group cursor-pointer ${
              currentTab === "projects" 
                ? "bg-black text-white" 
                : "text-gray-400 hover:text-black hover:bg-gray-50"
            }`}
            title="My Live Projects"
          >
            <Code2 size={20} />
            <span className="absolute left-16 bg-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-50 pointer-events-none">
              Live Projects
            </span>
          </button>

          <button 
            onClick={() => onTabChange("cv")}
            className={`p-3 rounded-full transition-all duration-300 relative group cursor-pointer ${
              currentTab === "cv" 
                ? "bg-black text-white" 
                : "text-gray-400 hover:text-black hover:bg-gray-50"
            }`}
            title="Interactive CV / Resume"
          >
            <FileText size={20} />
            <span className="absolute left-16 bg-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-50 pointer-events-none">
              Curriculum Vitae
            </span>
          </button>

          <button 
            onClick={() => onTabChange("contact")}
            className={`p-3 rounded-full transition-all duration-300 relative group cursor-pointer ${
              currentTab === "contact" 
                ? "bg-black text-white" 
                : "text-gray-400 hover:text-black hover:bg-gray-50"
            }`}
            title="Get In Touch"
          >
            <Mail size={20} />
            <span className="absolute left-16 bg-black text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-50 pointer-events-none">
              Contact Form
            </span>
          </button>
        </div>
      </div>

      {/* Social and External Anchor Points */}
      <div className="flex flex-col gap-4 items-center">
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer" 
          className="p-3 text-gray-400 hover:text-black transition-colors shrink-0 cursor-pointer" 
          title="GitHub Account"
        >
          <Github size={20} />
        </a>
        <a 
          href="https://linkedin.com" 
          target="_blank" 
          rel="noreferrer" 
          className="p-3 text-gray-400 hover:text-black transition-colors shrink-0 cursor-pointer" 
          title="LinkedIn Profile"
        >
          <Linkedin size={20} />
        </a>
      </div>
    </div>
  );
}
