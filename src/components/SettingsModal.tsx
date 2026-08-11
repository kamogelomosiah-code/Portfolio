import React, { useState, useEffect } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { aiService } from '../ai/AIService';
import { AVAILABLE_MODELS } from '../ai/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<string>("openrouter");
  const [model, setModel] = useState<string>("");

  useEffect(() => {
    const current = aiService.getProviderAndModel();
    setProvider(current.provider);
    setModel(current.model);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      aiService.setProviderAndModel(provider, model);
      onClose();
    } catch (e: any) {
      alert("Error saving settings: " + e.message);
    }
  };

  const availableModels = AVAILABLE_MODELS.filter(m => m.provider === provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl border border-outline-variant flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="text-title-large font-bold text-on-surface flex items-center gap-2">
            <MaterialIcon name="settings" className="text-primary" />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div className="space-y-3">
            <h3 className="text-label-large font-bold text-on-surface uppercase tracking-wider">AI Provider</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setProvider("openrouter");
                  setModel(AVAILABLE_MODELS.find(m => m.provider === "openrouter")?.id || "");
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  provider === "openrouter" 
                    ? "border-primary bg-primary-container/20 text-primary" 
                    : "border-outline-variant text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold">OpenRouter</span>
                  {provider === "openrouter" && <MaterialIcon name="check_circle" className="text-primary text-sm" />}
                </div>
                <span className="text-label-small text-on-surface-variant text-left">Cloud AI Models</span>
              </button>

              <button
                onClick={() => {
                  setProvider("webllm");
                  setModel(AVAILABLE_MODELS.find(m => m.provider === "webllm")?.id || "");
                }}
                className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                  provider === "webllm" 
                    ? "border-primary bg-primary-container/20 text-primary" 
                    : "border-outline-variant text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold">WebLLM</span>
                  {provider === "webllm" && <MaterialIcon name="check_circle" className="text-primary text-sm" />}
                </div>
                <span className="text-label-small text-on-surface-variant text-left">Local / Offline</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-label-large font-bold text-on-surface uppercase tracking-wider">AI Model</h3>
            <div className="space-y-2">
              {availableModels.map(m => (
                <label 
                  key={m.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    model === m.id
                      ? "border-primary bg-primary-container/10"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="modelSelection" 
                      value={m.id} 
                      checked={model === m.id}
                      onChange={() => setModel(m.id)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-body-medium font-bold text-on-surface">{m.name}</span>
                      {m.description && <span className="text-label-small text-on-surface-variant">{m.description}</span>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-on-surface font-medium hover:bg-surface-container rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
