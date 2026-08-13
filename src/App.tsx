/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./components/Sidebar";
import ChatInterface, { Message } from "./components/ChatInterface";
import MenuDrawer from "./components/MenuDrawer";
import MobileApp from "./components/MobileApp";

const ProjectsPage = lazy(() => import("./components/ProjectsPage"));
const CvPage = lazy(() => import("./components/CvPage"));
const ContactPage = lazy(() => import("./components/ContactPage"));
const ChangelogPage = lazy(() => import("./components/ChangelogPage"));
const ActionPlanner = lazy(() => import("./components/ActionPlanner").then(module => ({ default: module.ActionPlanner })));

const FallbackLoader = () => (
  <div className="flex w-full h-full items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
  </div>
);


import { useLocalLLM } from "./hooks/useLocalLLM";

export default function App() {
  const { status: llmStatus, isLargeReady } = useLocalLLM();
  const [currentTab, setCurrentTab] = useState<"chat" | "projects" | "cv" | "contact" | "changelog" | "planner">("chat");
  const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedModel, setSelectedModel] = useState("tiny");
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem("chat_messages");
      if (saved) {
        const parsed: Message[] = JSON.parse(saved);
        // Fix any stuck messages that were loading/streaming during reload
        return parsed.map(m => {
          if (m.status === "loading" || m.status === "streaming" || m.status === "sending") {
            return { ...m, status: m.text ? "sent" : "error" };
          }
          return m;
        });
      }
    } catch (e) {
      console.error("Failed to load messages from storage", e);
    }
    return [];
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem("chat_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save messages to storage", e);
    }
  }, [messages]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  
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
      const root = document.documentElement;

      // Always dark mode
      root.classList.add('dark');

      // Remove existing themes
      root.classList.remove('theme-morning', 'theme-afternoon', 'theme-evening', 'theme-night');

      // Add appropriate theme
      if (currentHour >= 5 && currentHour < 12) {
        root.classList.add('theme-morning');
      } else if (currentHour >= 12 && currentHour < 17) {
        root.classList.add('theme-afternoon');
      } else if (currentHour >= 17 && currentHour < 20) {
        root.classList.add('theme-evening');
      } else {
        root.classList.add('theme-night');
      }
    };
    
    updateTimeBasedTheme();
    const interval = setInterval(updateTimeBasedTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isMobile) {
    return (
      <MobileApp
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        messages={messages}
        setMessages={setMessages}
        llmStatus={llmStatus}
        isLargeReady={isLargeReady}
      />
    );
  }

  return (
    <div className="flex bg-surface h-dvh text-on-background w-full font-sans antialiased relative overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Page Area - Automatically shifts on desktop, full-screen on mobile */}
      <div className="flex-1 h-dvh md:pl-20 lg:pl-[88px] w-full relative flex flex-col bg-background">
        <AnimatePresence mode="wait">
          {currentTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 w-full h-full flex flex-col">
              <ChatInterface 
                selectedModel={selectedModel} 
                setSelectedModel={setSelectedModel}
                onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
                messages={messages}
                setMessages={setMessages}
                onViewCv={() => setCurrentTab("cv")}
                onViewProjects={() => setCurrentTab("projects")}
                llmStatus={llmStatus}
                isLargeReady={isLargeReady}
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

          {currentTab === "planner" && (
            <motion.div key="planner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <Suspense fallback={<FallbackLoader />}>
                <ActionPlanner onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "changelog" && (
            <motion.div key="changelog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 md:static md:flex-1 h-full w-full">
              <Suspense fallback={<FallbackLoader />}>
                <ChangelogPage onBackToChat={() => setCurrentTab("chat")} onToggleDrawer={() => setDrawerOpen(!drawerOpen)} />
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
    </div>
  );
}
