import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageSquare, Code2, FileText, Mail, Database, History, Webhook, Menu, X, Sun, Moon } from "lucide-react";
import type { NavTab } from "../types/profile";

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
  /**
   * "pill" (default): floats at the bottom of the page.
   * "inline": just the round menu button, placed inside another bar (the chat's message bar);
   * the same menu opens upward from it.
   */
  variant?: "pill" | "inline";
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

/**
 * A floating pill at the bottom of the screen. It shows the menu button and the current page.
 * Tapping the menu button grows the pill upward into a grid of every page.
 */
export default function BottomNav({ currentTab, onTabChange, theme, onToggleTheme, variant = "pill" }: BottomNavProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const current = NAV_ITEMS.find((i) => i.id === currentTab) ?? NAV_ITEMS[0];
  const CurrentIcon = current.icon;

  // Close when tapping outside, or on Escape. Move focus to the current page when it opens.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => rootRef.current?.querySelector<HTMLElement>("[aria-current='page']")?.focus(), 60);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const go = (id: NavTab) => {
    onTabChange(id);
    setOpen(false);
    toggleRef.current?.focus();
  };

  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 36 };

  if (variant === "inline") {
    // The round menu button inside another bar; the page menu opens upward above it.
    return (
      <div ref={rootRef} className="relative shrink-0 self-end pb-0.5 print:hidden">
        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              key="menu"
              id="page-menu"
              aria-label="Page navigation"
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.97 }}
              transition={spring}
              style={{ transformOrigin: "bottom left" }}
              className="absolute bottom-full left-0 z-40 mb-3 w-[min(340px,calc(100vw-2rem))] rounded-[24px] border border-outline-variant bg-surface shadow-xl"
            >
              <ul className="m-0 grid list-none grid-cols-4 gap-1 p-2">
                {NAV_ITEMS.map(({ id, label, icon: Icon, title }) => {
                  const active = id === currentTab;
                  return (
                    <li key={id} className="contents">
                      <button
                        type="button"
                        onClick={() => go(id)}
                        title={title}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-0 text-[11px] leading-none transition-colors ${
                          active ? "bg-surface-container font-semibold text-accent-ink" : "bg-transparent font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-background"
                        }`}
                      >
                        <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
                        <span>{label}</span>
                      </button>
                    </li>
                  );
                })}
                {onToggleTheme && (
                  <li className="contents">
                    <button
                      type="button"
                      onClick={onToggleTheme}
                      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                      className="flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-0 bg-transparent text-[11px] font-medium leading-none text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-background"
                    >
                      {theme === "dark" ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
                      <span>{theme === "dark" ? "Light" : "Dark"}</span>
                    </button>
                  </li>
                )}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="page-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          data-testid="menu-button"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-0 bg-surface-container text-on-background transition-colors hover:bg-surface-container-high sm:h-9 sm:w-9"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    );
  }

  return (
    // The spacer keeps page content clear of the pill, so the pill floats above a clean band.
    <div
      className="relative shrink-0 z-40 pointer-events-none print:hidden"
      style={{ height: "calc(76px + env(safe-area-inset-bottom))" }}
    >
      <div
        ref={rootRef}
        className="absolute inset-x-0 flex justify-center px-4"
        style={{ bottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <motion.nav
          layout
          transition={spring}
          aria-label="Page navigation"
          style={{ borderRadius: 30 }}
          className={`pointer-events-auto overflow-hidden border border-outline-variant bg-surface shadow-xl select-none ${
            open ? "w-full max-w-[360px]" : "w-auto"
          }`}
        >
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                key="menu"
                id="page-menu"
                initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                transition={spring}
                className="overflow-hidden"
              >
                <ul className="m-0 grid list-none grid-cols-4 gap-1 p-2 pb-0">
                  {NAV_ITEMS.map(({ id, label, icon: Icon, title }) => {
                    const active = id === currentTab;
                    return (
                      <li key={id} className="contents">
                        <button
                          type="button"
                          onClick={() => go(id)}
                          title={title}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-0 text-[11px] leading-none transition-colors ${
                            active
                              ? "bg-surface-container font-semibold text-accent-ink"
                              : "bg-transparent font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-background"
                          }`}
                        >
                          <Icon size={20} strokeWidth={active ? 2.2 : 1.75} />
                          <span>{label}</span>
                        </button>
                      </li>
                    );
                  })}
                  {onToggleTheme && (
                    <li className="contents">
                      <button
                        type="button"
                        onClick={() => { onToggleTheme(); }}
                        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        className="flex min-h-[64px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-0 bg-transparent text-[11px] font-medium leading-none text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-background"
                      >
                        {theme === "dark" ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
                        <span>{theme === "dark" ? "Light" : "Dark"}</span>
                      </button>
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-1 p-1.5 pr-4">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="page-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-surface-container text-on-background transition-colors hover:bg-surface-container-high"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="flex items-center gap-2 whitespace-nowrap pl-2 text-sm font-medium text-on-background" aria-live="polite">
              <CurrentIcon size={16} className="text-accent-ink" aria-hidden="true" />
              {current.label}
            </span>
          </div>
        </motion.nav>
      </div>
    </div>
  );
}
