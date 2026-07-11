import { motion, AnimatePresence } from "motion/react";
import { MaterialIcon } from "./MaterialIcon";
import { WatermelonIcon } from "./WatermelonIcon";

interface MenuDrawerProps {
  currentTab: "chat" | "projects" | "cv" | "contact" | "changelog" | "workspace";
  onTabChange: (tab: "chat" | "projects" | "cv" | "contact" | "changelog" | "workspace") => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function MenuDrawer({ currentTab, onTabChange, isOpen, onToggle }: MenuDrawerProps) {
  const menuItems: Array<{ id: "chat" | "projects" | "cv" | "contact" | "changelog" | "workspace"; label: string; icon: React.ReactNode; desc: string }> = [
    { id: "chat", label: "Chat Assistant", icon: <MaterialIcon name="forum" className="text-headline-small" />, desc: "Ask the AI anything" },
    { id: "projects", label: "Projects", icon: <MaterialIcon name="code" className="text-headline-small" />, desc: "Explore Live Projects" },
    { id: "cv", label: "Resume / CV", icon: <MaterialIcon name="description" className="text-headline-small" />, desc: "Career history & skills" },
    { id: "contact", label: "Contact", icon: <MaterialIcon name="mail" className="text-headline-small" />, desc: "Get in touch directly" },
    { id: "workspace", label: "Google Hub", icon: <MaterialIcon name="apps" className="text-headline-small" />, desc: "Manage Gmail, Calendar, & Keep" },
    { id: "changelog", label: "System Updates", icon: <MaterialIcon name="history" className="text-headline-small" />, desc: "View version history & logs" }
  ];

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
            className="fixed inset-0 bg-[var(--text-main)] z-40 cursor-pointer"
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
            className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-surface rounded-none z-50 py-6 px-4 flex flex-col shadow-2xl overflow-y-auto border-r border-outline-variant"
          >
            <div className="flex flex-col gap-6 flex-1">
              {/* Header */}
              <div className="flex flex-col px-4 pt-2">
                <div className="mb-5 text-accent">
                  <WatermelonIcon className="w-10 h-10" />
                </div>
                <h3 className="font-display font-medium text-headline-medium tracking-normal text-on-background leading-tight mb-1">
                  Kamogelo Mosia
                </h3>
                <p className="text-body-medium text-on-surface-variant font-normal">
                  Interaction & Dev
                </p>
              </div>

              <div className="h-px bg-[var(--border-light)] my-1 mx-2" />

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
                      className={`text-left px-5 py-4 w-full rounded-none flex items-center gap-4 transition-colors cursor-pointer border-0 ${
                        isActive
                          ? "bg-primary-container text-primary"
                          : "bg-transparent hover:bg-surface-container text-on-background"
                      }`}
                    >
                      <div className={`shrink-0 flex items-center justify-center ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className={`text-title-small font-medium leading-tight mb-0.5 ${isActive ? 'text-primary font-bold' : ''}`}>
                          {item.label}
                        </span>
                        {!isActive && (
                           <span className="text-body-small text-on-surface-variant leading-tight">
                             {item.desc}
                           </span>
                        )}
                      </div>
                    </button>
                  );
                })}

              </div>
            </div>

            {/* Footer Connect links */}
            <div className="mt-auto pt-6 px-2 pb-2">
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors shrink-0 cursor-pointer"
                  title="GitHub Profile"
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
                <a
                  href="mailto:kamogelomosiah@gmail.com"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-container hover:opacity-90 text-primary transition-colors shrink-0 cursor-pointer"
                  title="Direct Contact"
                >
                  <MaterialIcon name="mail" className="text-headline-small" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
