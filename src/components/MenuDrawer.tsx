import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Sparkles, Code2, FileText, Mail, PlusCircle, Github, Linkedin, ExternalLink } from "lucide-react";
import appIcon from "../assets/app_icon.png";

interface MenuDrawerProps {
  currentTab: "chat" | "projects" | "cv" | "contact";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact") => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function MenuDrawer({ currentTab, onTabChange, isOpen, onToggle }: MenuDrawerProps) {
  const menuItems = [
    { id: "chat", label: "Kamo AI Agent Chat", icon: <Sparkles size={18} />, desc: "Ask the AI anything about my work" },
    { id: "projects", label: "My Live Projects", icon: <Code2 size={18} />, desc: "Explore CallTrax and PortfoliAI" },
    { id: "cv", label: "Interactive Resume / CV", icon: <FileText size={18} />, desc: "My career history and skill stack" },
    { id: "contact", label: "Get In Touch", icon: <Mail size={18} />, desc: "Drop me an email directly" }
  ] as const;

  return (
    <>
      {/* Floating Menu Toggle Button - Top Right */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={onToggle}
          className="bg-black hover:bg-gray-800 text-white flex items-center justify-center w-12 h-12 transition-all duration-300 shadow-md border-0 group cursor-pointer"
          style={{ borderRadius: '100%' }}
          title="Open Navigation Options"
          aria-label="Toggle Menu"
          id="global-menu-btn"
        >
          {isOpen ? (
            <X size={24} className="transform transition-transform duration-300" />
          ) : (
            <Menu size={24} className="transition-transform duration-300 text-white" />
          )}
        </button>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black z-40 cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Slide-out Menu Panel from Right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white border-l border-gray-100 z-40 p-8 flex flex-col justify-between shadow-2xl overflow-y-auto"
          >
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div className="flex flex-col">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-gray-100 bg-white overflow-hidden shadow-sm">
                  <img src={appIcon} alt="App Icon" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-display font-bold text-2xl tracking-tight text-black">
                  Navigate Portfolio
                </h3>
                <p className="text-xs text-gray-400 mt-1 uppercase font-semibold font-display tracking-widest">
                  Custom Options Drawer
                </p>
              </div>

              {/* Main Options List */}
              <div className="flex flex-col gap-3">
                {menuItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        onToggle();
                      }}
                      className={`text-left p-4 rounded-xl border flex items-start gap-3.5 transition-all cursor-pointer ${
                        isActive
                          ? "border-accent bg-accent/5"
                          : "border-gray-50 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-100"
                      }`}
                    >
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isActive ? "bg-accent text-white" : "bg-white border border-gray-100 text-gray-600"
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isActive ? "text-accent" : "text-black"}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}

                {/* VISUAL SPOTLIGHT PREPARED FOR DYNAMIC PAGE / BUTTON EXTENSION */}
                <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/20 mt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <PlusCircle size={14} className="text-gray-300" />
                    <span>Expandable Slot</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Insert your downstream routes, dynamic templates or external deep links inside this slot:
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    {/* Visual Placeholders user requested: "reveling more options that I will use to add more buttons that will lead to more pages" */}
                    <button
                      disabled
                      className="text-[11px] font-semibold text-gray-400 text-left border border-dashed border-gray-150 py-2.5 px-3 rounded-lg bg-white cursor-not-allowed flex items-center justify-between"
                    >
                      <span>➕ Lead to Custom Page A</span>
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-400 px-1 py-0.5 rounded">Future Slot</span>
                    </button>
                    <button
                      disabled
                      className="text-[11px] font-semibold text-gray-400 text-left border border-dashed border-gray-150 py-2.5 px-3 rounded-lg bg-white cursor-not-allowed flex items-center justify-between"
                    >
                      <span>➕ Lead to Custom Page B</span>
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-400 px-1 py-0.5 rounded">Future Slot</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Connect links */}
            <div className="pt-8 border-t border-gray-100 mt-8 flex flex-col gap-4">
              <div className="flex items-center justify-around">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-gray-50 hover:bg-black text-gray-600 hover:text-white rounded-full transition-all shrink-0 cursor-pointer"
                  title="GitHub Profile"
                >
                  <Github size={16} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-gray-50 hover:bg-black text-gray-600 hover:text-white rounded-full transition-all shrink-0 cursor-pointer"
                  title="LinkedIn Profile"
                >
                  <Linkedin size={16} />
                </a>
                <a
                  href="mailto:kamogelomosiah@gmail.com"
                  className="p-3 bg-gray-50 hover:bg-black text-gray-600 hover:text-white rounded-full transition-all shrink-0 cursor-pointer"
                  title="Direct Contact"
                >
                  <Mail size={16} />
                </a>
              </div>
              <p className="text-[10px] text-gray-400 text-center font-mono uppercase mt-2">
                Designed & Built // Kamo portfolio
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
