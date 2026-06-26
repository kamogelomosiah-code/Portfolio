import React, { useState } from "react";
import { X, Check, Zap, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const COLORS = [
  { name: "Blue (Material)", value: "#1A73E8" },
  { name: "Green", value: "#1E8E3E" },
  { name: "Red", value: "#D93025" },
  { name: "Yellow", value: "#F9AB00" },
  { name: "Purple", value: "#9333EA" },
  { name: "Pink", value: "#EC4899" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Orange", value: "#F97316" },
  { name: "Teal", value: "#14B8A6" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export default function SettingsModal({ isOpen, onClose, accentColor, setAccentColor, selectedModel, setSelectedModel }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--text-main)]/40 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-main)] rounded-none shadow-2xl max-w-[400px] w-full relative overflow-hidden flex flex-col border border-[var(--border-light)]"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <h2 className="text-[24px] font-medium text-[var(--text-main)] tracking-normal font-display">Settings</h2>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-none transition-colors text-[var(--text-muted)] cursor-pointer border-0 bg-transparent">
                  <X size={24} />
                </button>
              </div>

              <div className="px-6 py-4 flex flex-col gap-8 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <h3 className="text-[14px] font-medium text-[var(--text-muted)] tracking-wide uppercase">Theme Accent Color</h3>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={`w-12 h-12 rounded-none flex items-center justify-center border-2 transition-all cursor-pointer hover:opacity-90 ${
                          accentColor === color.value ? "border-[var(--text-main)] scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {accentColor === color.value && <Check size={20} className="text-white drop-shadow-sm" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <h3 className="text-[14px] font-medium text-[var(--text-muted)] tracking-wide uppercase">AI Mode</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: "swift", name: "Swift", icon: Zap, desc: "Fast responses for everyday use.", color: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20" },
                      { id: "fusion", name: "Fusion", icon: Cpu, desc: "Uses multiple AI models to reason and verify answers for maximum accuracy.", color: "text-[var(--color-accent)] bg-[var(--color-accent-light)]" }
                    ].map((model) => {
                      const Icon = model.icon;
                      const isSelected = selectedModel === model.id;
                      return (
                        <label 
                          key={model.id} 
                          className={`flex flex-col gap-1 p-4 rounded-none cursor-pointer transition-all border ${
                            isSelected 
                              ? "border-[var(--color-accent)] bg-[var(--bg-card)] shadow-sm" 
                              : "border-[var(--border-light)] bg-[var(--bg-card)] hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="ai-model"
                                value={model.id}
                                checked={isSelected}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-5 h-5 text-[var(--color-accent)] focus:ring-[var(--color-accent)] border-gray-300 cursor-pointer"
                              />
                              <div className={`w-7 h-7 flex items-center justify-center rounded-none shrink-0 ${model.color}`}>
                                <Icon size={14} className="stroke-[2.5]" />
                              </div>
                              <span className="text-[15px] font-bold text-[var(--text-main)]">{model.name}</span>
                            </div>
                          </div>
                          <span className="text-[13px] text-[var(--text-muted)] pl-8 font-normal leading-relaxed mt-1">{model.desc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 flex justify-end">
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 bg-transparent text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] rounded-none font-medium text-[14px] transition-colors cursor-pointer border-0"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
