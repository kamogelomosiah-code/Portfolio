/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import ChatInterface, { Message } from "./components/ChatInterface";
import BottomNav from "./components/BottomNav";
import MobileApp from "./components/MobileApp";
import defaultProfile from "../me.json";
import type { NavTab, ProfileData } from "./types/profile";

const ProjectsPage = lazy(() => import("./components/ProjectsPage"));
const CvPage = lazy(() => import("./components/CvPage"));
const ContactPage = lazy(() => import("./components/ContactPage"));
const ProfileDataPage = lazy(() => import("./components/ProfileDataPage"));
const ChangelogPage = lazy(() => import("./components/ChangelogPage"));
const ApiPage = lazy(() => import("./components/ApiPage"));

const FallbackLoader = () => (
  <div className="flex w-full h-full items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-outline-variant border-t-primary" />
  </div>
);

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("chat");
  const [selectedModel, setSelectedModel] = useState("tiny");
  const [profile, setProfile] = useState<ProfileData>(defaultProfile as ProfileData);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("app_theme");
      if (stored === "light" || stored === "dark") return stored;
    }
    return "dark";
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem("chat_messages");
      if (saved) {
        const parsed: Message[] = JSON.parse(saved);
        return parsed.map((m, idx) => {
          if (m.status === "loading" || m.status === "streaming" || m.status === "sending") {
            if (m.role === "agent") {
              const prevUserMsg = parsed.slice(0, idx).reverse().find((msg) => msg.role === "user");
              return {
                ...m,
                status: "error" as const,
                text: m.text || "I couldn't reach the AI just now. Your message wasn't lost, so you can try again.",
                meta: {
                  ...m.meta,
                  failedUserText: prevUserMsg?.text || m.meta?.failedUserText || "",
                },
              };
            }
            return { ...m, status: "error" as const };
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
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && !Array.isArray(data) && data.name) {
          setProfile(data as ProfileData);
        }
      })
      .catch(() => {
        // Keep bundled defaultProfile when offline
      });
  }, []);

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
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("app_theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  if (isMobile) {
    return (
      <MobileApp
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        messages={messages}
        setMessages={setMessages}
        profile={profile}
        onProfileSaved={setProfile}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="flex flex-col bg-background h-dvh text-on-background w-full font-sans antialiased relative overflow-hidden">
      <div className="flex-1 min-h-0 w-full relative flex flex-col bg-background overflow-hidden">
        <AnimatePresence mode="wait">
          {currentTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 w-full h-full flex flex-col overflow-hidden"
            >
              <ChatInterface
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                messages={messages}
                setMessages={setMessages}
                onNavigateTab={setCurrentTab}
                profile={profile}
                theme={theme}
                onToggleTheme={toggleTheme}
                menu={<BottomNav variant="inline" currentTab={currentTab} onTabChange={setCurrentTab} theme={theme} onToggleTheme={toggleTheme} />}
              />
            </motion.div>
          )}
          {currentTab === "projects" && (
            <motion.div
              key="projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 h-full w-full flex flex-col overflow-hidden"
            >
              <Suspense fallback={<FallbackLoader />}>
                <ProjectsPage onBackToChat={() => setCurrentTab("chat")} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "cv" && (
            <motion.div
              key="cv"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 h-full w-full flex flex-col overflow-hidden"
            >
              <Suspense fallback={<FallbackLoader />}>
                <CvPage onBackToChat={() => setCurrentTab("chat")} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 h-full w-full flex flex-col overflow-hidden"
            >
              <Suspense fallback={<FallbackLoader />}>
                <ContactPage onBackToChat={() => setCurrentTab("chat")} profile={profile} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "data" && (
            <motion.div
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 h-full w-full flex flex-col overflow-hidden"
            >
              <Suspense fallback={<FallbackLoader />}>
                <ProfileDataPage
                  profile={profile}
                  onProfileSaved={setProfile}
                  onBackToChat={() => setCurrentTab("chat")}
                />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "changelog" && (
            <motion.div
              key="changelog"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 h-full w-full flex flex-col overflow-hidden"
            >
              <Suspense fallback={<FallbackLoader />}>
                <ChangelogPage onBackToChat={() => setCurrentTab("chat")} />
              </Suspense>
            </motion.div>
          )}
          {currentTab === "api" && (
            <motion.div
              key="api"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 h-full w-full flex flex-col overflow-hidden"
            >
              <Suspense fallback={<FallbackLoader />}>
                <ApiPage onBackToChat={() => setCurrentTab("chat")} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* On the chat page the menu sits inside the message bar; other pages get the floating pill. */}
      {currentTab !== "chat" && <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} theme={theme} onToggleTheme={toggleTheme} />}
    </div>
  );
}
