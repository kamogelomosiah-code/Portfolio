/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./components/Sidebar";
import ChatInterface from "./components/ChatInterface";
import ProjectsPage from "./components/ProjectsPage";
import CvPage from "./components/CvPage";
import ContactPage from "./components/ContactPage";
import MenuDrawer from "./components/MenuDrawer";
import SettingsModal from "./components/SettingsModal";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"chat" | "projects" | "cv" | "contact">("chat");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("#FF3B30");
  const [selectedModel, setSelectedModel] = useState("deepseek-ai/DeepSeek-V4-Pro:novita");

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  return (
    <div className="flex bg-white h-dvh text-black w-full font-sans antialiased relative overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Page Area - Automatically shifts on desktop, full-screen on mobile */}
      <div className="flex-1 h-dvh md:pl-20 lg:pl-24 w-full relative flex flex-col">
        <AnimatePresence mode="wait">
          {currentTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 w-full h-full flex flex-col">
              <ChatInterface 
                onOpenSettings={() => setSettingsOpen(true)} 
                selectedModel={selectedModel} 
                setSelectedModel={setSelectedModel}
                onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
              />
            </motion.div>
          )}
          {currentTab === "projects" && (
            <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <ProjectsPage onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
            </motion.div>
          )}
          {currentTab === "cv" && (
            <motion.div key="cv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <CvPage onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
            </motion.div>
          )}
          {currentTab === "contact" && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <ContactPage onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-out Menu Drawer and Toggle */}
      <MenuDrawer
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
}
