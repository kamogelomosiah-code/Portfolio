import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Sparkles, Code2, FileText, Mail, PlusCircle, Github, Linkedin } from "lucide-react";
import appIcon from "../assets/app_icon.png";

interface MenuDrawerProps {
  currentTab: "chat" | "projects" | "cv" | "contact";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact") => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function MenuDrawer({ currentTab, onTabChange, isOpen, onToggle }: MenuDrawerProps) {
  const menuItems = [
    { id: "chat", label: "Chat Assistant", icon: <Sparkles size={20} />, desc: "Ask the AI anything" },
    { id: "projects", label: "Projects", icon: <Code2 size={20} />, desc: "Explore Live Projects" },
    { id: "cv", label: "Resume / CV", icon: <FileText size={20} />, desc: "Career history & skills" },
    { id: "contact", label: "Contact", icon: <Mail size={20} />, desc: "Get in touch directly" }
  ] as const;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-[#202124] z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Slide-out Menu Panel from Left to act as standard Nav Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#F8F9FA] rounded-r-3xl z-50 py-6 px-4 flex flex-col shadow-2xl overflow-y-auto border-r border-gray-200"
          >
            <div className="flex flex-col gap-6 flex-1">
              {/* Header */}
              <div className="flex flex-col px-4 pt-2">
                <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center mb-5 border border-gray-200 bg-white shadow-sm">
                  <img src={appIcon} alt="App Icon" className="w-[80%] h-[80%] object-contain" />
                </div>
                <h3 className="font-display font-medium text-[22px] tracking-normal text-[#202124] leading-tight mb-1">
                  Kamogelo Mosia
                </h3>
                <p className="text-[14px] text-[#5F6368] font-normal">
                  Interaction & Dev
                </p>
              </div>

              <div className="h-px bg-gray-200 my-1 mx-2" />

              {/* Main Options List */}
              <div className="flex flex-col gap-1 w-full">
                {menuItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        onToggle();
                      }}
                      className={`text-left px-5 py-4 w-full rounded-full flex items-center gap-4 transition-colors cursor-pointer border-0 ${
                        isActive
                          ? "bg-[#E8F0FE] text-[#1A73E8]"
                          : "bg-transparent hover:bg-gray-100 text-[#444746]"
                      }`}
                    >
                      <div className="shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="text-[14px] font-medium leading-tight mb-0.5">
                          {item.label}
                        </span>
                        {!isActive && (
                           <span className="text-[12px] text-[#5F6368] leading-tight">
                             {item.desc}
                           </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                <div className="h-px bg-gray-200 my-4 mx-2" />
                <span className="px-5 text-[12px] font-medium text-[#5F6368] mb-2">More options coming soon</span>
                
                {/* Visual expansion buttons requested by user earlier */}
                <div className="flex flex-col px-3 gap-1">
                  <button disabled className="text-left py-3 px-4 w-full rounded-full flex items-center justify-between text-[#1A73E8] bg-transparent border border-dashed border-[#1A73E8]/30 cursor-not-allowed opacity-70">
                    <span className="text-[14px] font-medium flex items-center gap-2"><PlusCircle size={18}/> Custom Action A</span>
                  </button>
                  <button disabled className="text-left py-3 px-4 w-full rounded-full flex items-center justify-between text-[#1A73E8] bg-transparent border border-dashed border-[#1A73E8]/30 cursor-not-allowed opacity-70">
                    <span className="text-[14px] font-medium flex items-center gap-2"><PlusCircle size={18}/> Custom Action B</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Footer Connect links */}
            <div className="mt-auto pt-6 px-2 pb-2">
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-[#5F6368] hover:text-[#202124] rounded-full transition-colors shrink-0 cursor-pointer"
                  title="GitHub Profile"
                >
                  <Github size={20} strokeWidth={2} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-[#5F6368] hover:text-[#202124] rounded-full transition-colors shrink-0 cursor-pointer"
                  title="LinkedIn Profile"
                >
                  <Linkedin size={20} strokeWidth={2} />
                </a>
                <a
                  href="mailto:kamogelomosiah@gmail.com"
                  className="w-10 h-10 flex items-center justify-center bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] rounded-full transition-colors shrink-0 cursor-pointer"
                  title="Direct Contact"
                >
                  <Mail size={20} strokeWidth={2} />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
