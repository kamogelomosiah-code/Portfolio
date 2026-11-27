import { MessageSquare, Code2, FileText, Mail, Database, History, Webhook } from "lucide-react";
import type { NavTab } from "../types/profile";

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; icon: typeof MessageSquare; title: string }> = [
  { id: "chat", label: "Chat", icon: MessageSquare, title: "Ask Kamo's AI" },
  { id: "projects", label: "Projects", icon: Code2, title: "View Projects" },
  { id: "cv", label: "CV", icon: FileText, title: "Curriculum Vitae" },
  { id: "contact", label: "Contact", icon: Mail, title: "Contact Kamogelo" },
  { id: "data", label: "Data", icon: Database, title: "Teach AI via JSON & Forms" },
  { id: "changelog", label: "Updates", icon: History, title: "System Updates" },
  { id: "api", label: "API", icon: Webhook, title: "My API: live demo" },
];

export default function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Page navigation"
      className="shrink-0 border-t border-outline-variant bg-surface z-30 print:hidden select-none"
    >
      {/* Mobile: 7-column quick tab bar */}
      <div className="grid grid-cols-7 md:hidden h-14 px-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon, title }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              title={title}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors cursor-pointer min-h-[44px] whitespace-nowrap shrink-0 ${
                isActive
                  ? "text-accent-ink font-semibold"
                  : "text-on-surface-variant hover:text-on-background font-medium"
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.75} />
              <span className="text-[10px] leading-none">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: clean centered quick-switch button strip */}
      <div className="hidden md:flex h-12 items-center justify-center gap-1.5 px-4">
        {NAV_ITEMS.map(({ id, label, icon: Icon, title }) => {
          const isActive = currentTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              title={title}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex items-center gap-2 px-3.5 h-8 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-surface-container text-accent-ink font-semibold border border-outline-variant"
                  : "text-on-surface-variant hover:text-on-background hover:bg-surface-container-low font-medium border border-transparent"
              }`}
            >
              <Icon size={15} strokeWidth={isActive ? 2.1 : 1.75} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
