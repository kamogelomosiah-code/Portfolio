import React, { useState } from "react";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const COLORS = [
  { name: "Watermelon Red", value: "#FF3B30" },
  { name: "Watermelon Green", value: "#32CD32" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Orange", value: "#F97316" },
  { name: "Emerald", value: "#10B981" },
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm w-full relative overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-black">Settings</h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 text-black flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-medium text-gray-700">Theme Accent Color</h3>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setAccentColor(color.value)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer shadow-sm hover:scale-110 ${
                          accentColor === color.value ? "border-gray-900 scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {accentColor === color.value && <Check size={16} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-medium text-gray-700">AI Model Settings</h3>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: "deepseek-ai/DeepSeek-V4-Pro:novita", name: "DeepSeek V4 Pro" },
                      { id: "meta-llama/Llama-3.1-8B-Instruct:novita", name: "Llama 3.1 8B Instruct" },
                      { id: "openai/gpt-oss-120b:groq", name: "GPT OSS 120B" },
                    ].map((model) => (
                      <label key={model.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-300 cursor-pointer transition-colors bg-gray-50/50">
                        <input
                          type="radio"
                          name="ai-model"
                          value={model.id}
                          checked={selectedModel === model.id}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-4 h-4 text-black focus:ring-black border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-800">{model.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
