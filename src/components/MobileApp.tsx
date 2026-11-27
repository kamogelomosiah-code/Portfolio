import React, { useState, lazy, Suspense } from "react";
import ChatInterface, { Message } from "./ChatInterface";
import BottomNav from "./BottomNav";
import type { NavTab, ProfileData } from "../types/profile";

const ProjectsPage = lazy(() => import("./ProjectsPage"));
const CvPage = lazy(() => import("./CvPage"));
const ContactPage = lazy(() => import("./ContactPage"));
const ProfileDataPage = lazy(() => import("./ProfileDataPage"));
const ChangelogPage = lazy(() => import("./ChangelogPage"));
const ApiPage = lazy(() => import("./ApiPage"));

const FallbackLoader = () => (
  <div className="flex w-full h-full items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-outline-variant border-t-primary" />
  </div>
);

interface MobileAppProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  profile: ProfileData;
  onProfileSaved: (updated: ProfileData) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export default function MobileApp({
  selectedModel,
  setSelectedModel,
  messages,
  setMessages,
  profile,
  onProfileSaved,
  theme = "dark",
  onToggleTheme,
}: MobileAppProps) {
  const [activeTab, setActiveTab] = useState<NavTab>("chat");

  return (
    <div className="flex flex-col h-dvh w-full bg-background text-on-background font-sans overflow-hidden relative">
      <main className="flex-1 min-h-0 w-full overflow-hidden relative bg-background flex flex-col">
        {activeTab === "chat" && (
          <ChatInterface
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            messages={messages}
            setMessages={setMessages}
            onNavigateTab={setActiveTab}
            profile={profile}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        )}

        {activeTab === "projects" && (
          <Suspense fallback={<FallbackLoader />}>
            <ProjectsPage onBackToChat={() => setActiveTab("chat")} />
          </Suspense>
        )}

        {activeTab === "cv" && (
          <Suspense fallback={<FallbackLoader />}>
            <CvPage onBackToChat={() => setActiveTab("chat")} />
          </Suspense>
        )}

        {activeTab === "contact" && (
          <Suspense fallback={<FallbackLoader />}>
            <ContactPage onBackToChat={() => setActiveTab("chat")} profile={profile} />
          </Suspense>
        )}

        {activeTab === "data" && (
          <Suspense fallback={<FallbackLoader />}>
            <ProfileDataPage
              profile={profile}
              onProfileSaved={onProfileSaved}
              onBackToChat={() => setActiveTab("chat")}
            />
          </Suspense>
        )}

        {activeTab === "changelog" && (
          <Suspense fallback={<FallbackLoader />}>
            <ChangelogPage onBackToChat={() => setActiveTab("chat")} />
          </Suspense>
        )}

        {activeTab === "api" && (
          <Suspense fallback={<FallbackLoader />}>
            <ApiPage onBackToChat={() => setActiveTab("chat")} />
          </Suspense>
        )}
      </main>

      <BottomNav currentTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
