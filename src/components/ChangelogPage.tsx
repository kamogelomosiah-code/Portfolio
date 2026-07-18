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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex-1 h-full w-full bg-background text-on-background flex flex-col overflow-hidden relative"
    >
      {/* Top Navbar - Island Style */}
      <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pointer-events-none pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[calc(env(safe-area-inset-top)+20px)] px-4 sm:px-6">
        <div className="flex items-center justify-between w-full pointer-events-auto bg-surface/90 backdrop-blur-md rounded-xl shadow-md border-2 border-outline-variant/60 px-4 py-2 max-w-3xl">
          <div className="flex items-center gap-2 m-0 p-0">
            <h1 className="font-medium text-title-medium sm:text-title-large md:text-headline-small text-on-background tracking-normal font-display m-0 p-0 ml-1 py-1">System Changelog</h1>
          </div>
        </div>
      </div>

      {/* Main Timeline Scrollable Area */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center pb-32 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+88px)]">
        <div className="w-full max-w-2xl pt-4 sm:pt-8 text-left">
          
          <div className="mb-8 max-w-xl">
            <p className="text-on-surface-variant text-title-small sm:text-title-medium leading-relaxed">
              Tracking core platform system changes, layout iterations, chatbot features, and backend LLM pipeline optimizations.
            </p>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl bg-surface border-2 border-outline-variant shadow-sm w-full max-w-none">
            <MarkdownRenderer content={changelogContent} />
          </div>

        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-surface/90 backdrop-blur-md rounded-full shadow-lg border-2 border-outline-variant/60 px-2 py-2">
          {onToggleDrawer && (
            <button 
              onClick={onToggleDrawer}
              className="md:hidden flex items-center justify-center w-12 h-12 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent"
              title="Menu"
            >
              <Menu size={24} />
            </button>
          )}
          <button 
            onClick={onBackToChat}
            className="flex items-center justify-center gap-2 h-12 px-5 md:px-6 rounded-full hover:bg-background text-on-background transition-colors cursor-pointer border-0 bg-transparent"
            title="Back to Chat"
          >
            <ArrowLeft size={20} />
            <span className="font-medium text-title-small">Back to Chat</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
