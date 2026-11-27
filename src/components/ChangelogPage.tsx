import { motion } from "motion/react";
import { ArrowLeft, Menu } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import changelogContent from "../../CHANGELOG.md?raw";

interface ChangelogPageProps {
  onBackToChat: () => void;
  onToggleDrawer?: () => void;
}

export default function ChangelogPage({ onBackToChat, onToggleDrawer }: ChangelogPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden"
    >
      <header className="h-14 shrink-0 border-b border-outline-variant bg-surface px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {onToggleDrawer && (
            <button
              type="button"
              onClick={onToggleDrawer}
              className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 h-10 px-2.5 -ml-1 md:ml-0 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-background hover:bg-surface-container transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <span className="text-outline-variant select-none">/</span>
          <h1 className="text-sm sm:text-base font-semibold text-on-background truncate">Updates</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-3xl mx-auto">
          <div className="mb-8 pb-6 border-b border-outline-variant">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-on-background">
              Changelog
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-2 leading-relaxed max-w-xl">
              System changes, UI updates, and backend improvements.
            </p>
          </div>

          <div className="p-5 sm:p-7 rounded-xl bg-surface border border-outline-variant w-full">
            <MarkdownRenderer content={changelogContent} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
