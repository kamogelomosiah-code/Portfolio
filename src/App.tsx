/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./components/Sidebar";
import ChatInterface, { Message } from "./components/ChatInterface";
import MenuDrawer from "./components/MenuDrawer";
import SettingsModal from "./components/SettingsModal";
import MobileApp from "./components/MobileApp";

const ProjectsPage = lazy(() => import("./components/ProjectsPage"));
const CvPage = lazy(() => import("./components/CvPage"));
const ContactPage = lazy(() => import("./components/ContactPage"));

const FallbackLoader = () => (
  <div className="flex w-full h-full items-center justify-center bg-[var(--bg-main)]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
  </div>
);

const getDefaultAccentColor = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 5 && currentHour < 12) return "#F9AB00"; // Morning (Yellow)
  if (currentHour >= 12 && currentHour < 17) return "#1A73E8"; // Afternoon (Blue)
  if (currentHour >= 17 && currentHour < 20) return "#D93025"; // Evening (Red)
  return "#9333EA"; // Night (Purple)
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<"chat" | "projects" | "cv" | "contact">("chat");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState(getDefaultAccentColor());
  const [selectedModel, setSelectedModel] = useState("swift");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const testModels = async () => {
      const models = ["swift", "fusion"];
      for (const m of models) {
        try {
          const res = await fetch('/api/ping-model', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: m })
          });
          const data = await res.json();
          if (data.success) {
            setSelectedModel(m);
            break;
          }
        } catch (e) {
          continue;
        }
      }
    };
    testModels();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      // Base mobile width around 375px
      let scale = 1;
      
      if (width < 380) {
        // scale down slightly for very small devices
        scale = Math.max(0.85, width / 400); 
      } else if (width >= 380 && width < 768) {
        // smooth scale for typical mobile
        scale = Math.min(1, width / 390);
      } else if (width >= 2000) {
        // scale up for very large screens
        scale = 1.1;
      }
      
      document.documentElement.style.fontSize = `${16 * scale}px`;
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const updateTimeBasedTheme = () => {
      const currentHour = new Date().getHours();
      // Dark mode between 6 PM (18) and 7 AM (7)
      if (currentHour < 7 || currentHour >= 18) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    updateTimeBasedTheme();
    // Check every minute
    const interval = setInterval(updateTimeBasedTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isMobile) {
    return (
      <MobileApp
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        messages={messages}
        setMessages={setMessages}
      />
    );
  }

  return (
    <div className="flex bg-[var(--bg-card)] h-dvh text-black w-full font-sans antialiased relative overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Page Area - Automatically shifts on desktop, full-screen on mobile */}
      <div className="flex-1 h-dvh md:pl-20 lg:pl-[88px] w-full relative flex flex-col bg-[var(--bg-main)]">
        <AnimatePresence mode="wait">
          {currentTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 w-full h-full flex flex-col">
              <ChatInterface 
                onOpenSettings={() => setSettingsOpen(true)} 
                selectedModel={selectedModel} 
                setSelectedModel={setSelectedModel}
                onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
                messages={messages}
                setMessages={setMessages}
                onViewCv={() => setCurrentTab("cv")}
              />
            </motion.div>
          )}
          {currentTab === "projects" && (
            <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <Suspense fallback={<FallbackLoader />}>
                <ProjectsPage onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "cv" && (
            <motion.div key="cv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <Suspense fallback={<FallbackLoader />}>
                <CvPage onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "contact" && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <Suspense fallback={<FallbackLoader />}>
                <ContactPage onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
              </Suspense>
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
