import React, { useState, useRef, useEffect } from "react";
import { MaterialIcon } from "../MaterialIcon";
import { askSupportAssistant } from "../../ai/support";
import { MarkdownRenderer } from "../MarkdownRenderer";

interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

export function SupportAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [useWebLookup, setUseWebLookup] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, progressStatus]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isGenerating) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: textToSend.trim() };
    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput("");
    setIsGenerating(true);
    setProgressStatus("Preparing...");

    const assistantMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      await askSupportAssistant(
        userMessage.content,
        history,
        (status) => {
          setProgressStatus(status);
        },
        (chunk) => {
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId ? { ...m, content: chunk } : m
          ));
        },
        useWebLookup
      );
      
    } catch (err: any) {
      console.error(err);
      setMessages(prev => prev.map(m => 
        m.id === assistantMsgId ? { ...m, content: `**Error:** ${err?.message || "Failed to get response."}` } : m
      ));
    } finally {
      setIsGenerating(false);
      setProgressStatus("");
    }
  };

  return (
    <div className="flex h-full bg-background font-sans">
      
      {/* Left Sidebar - Agent Console */}
      <div className="w-80 border-r border-outline-variant bg-surface flex-col hidden md:flex h-full">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D97757] flex items-center justify-center shadow-sm">
              <MaterialIcon name="support_agent" className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-title-medium font-bold text-on-surface leading-tight">Support Copilot</h1>
              <p className="text-label-small text-on-surface-variant font-medium">Internal Knowledge Base</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status Panel */}
          <div>
            <h3 className="text-label-small uppercase tracking-wider text-on-surface-variant font-bold mb-3 px-2">System Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="memory" className="text-on-surface-variant" />
                  <span className="text-body-medium text-on-surface font-medium">Local WebLLM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-label-small text-on-surface-variant">Ready</span>
                </div>
              </div>
              
              <label className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="public" className="text-on-surface-variant" />
                  <span className="text-body-medium text-on-surface font-medium">Live Web Lookup</span>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={useWebLookup} onChange={(e) => setUseWebLookup(e.target.checked)} />
                  <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D97757]"></div>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-label-small uppercase tracking-wider text-on-surface-variant font-bold mb-3 px-2">Quick Actions</h3>
            <div className="space-y-1">
              {[
                { icon: "password", label: "Password Reset Policy", query: "What is the policy for password resets for Claude?" },
                { icon: "credit_card", label: "Billing & Subscriptions", query: "Customer cannot access Claude Pro after payment. Draft an email." },
                { icon: "speed", label: "Rate Limits", query: "What are the rate limits for the Claude API?" },
                { icon: "gavel", label: "Account Suspensions", query: "User account suspended. How to appeal?" }
              ].map((action, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(action.query)}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-surface-container-low text-on-surface transition-colors"
                >
                  <MaterialIcon name={action.icon} className="text-on-surface-variant text-lg" />
                  <span className="text-body-medium font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Internal Docs */}
          <div>
            <h3 className="text-label-small uppercase tracking-wider text-on-surface-variant font-bold mb-3 px-2">Reference</h3>
            <div className="space-y-1">
               <a href="#" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low text-on-surface-variant transition-colors">
                 <div className="flex items-center gap-3">
                   <MaterialIcon name="description" className="text-lg" />
                   <span className="text-body-medium font-medium">Anthropic Docs</span>
                 </div>
                 <MaterialIcon name="open_in_new" className="text-sm" />
               </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-surface-container-lowest relative">
        {/* Mobile Header */}
        <div className="md:hidden px-4 py-3 border-b border-outline-variant bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D97757] flex items-center justify-center">
              <MaterialIcon name="support_agent" className="text-white text-sm" />
            </div>
            <h1 className="text-title-medium font-bold text-on-surface">Support Copilot</h1>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-surface-container py-1.5 px-3 rounded-full border border-outline-variant">
            <input type="checkbox" checked={useWebLookup} onChange={(e) => setUseWebLookup(e.target.checked)} className="w-3.5 h-3.5 text-[#D97757]" />
            <span className="text-label-medium text-on-surface font-medium">Web</span>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth pb-32">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto pb-10">
              <div className="w-20 h-20 rounded-3xl bg-surface-container border border-outline-variant flex items-center justify-center mb-6 shadow-sm">
                <MaterialIcon name="forum" className="text-on-surface-variant text-4xl" />
              </div>
              <h2 className="text-headline-small font-bold text-on-surface mb-3">How can I help you support our customers today?</h2>
              <p className="text-body-large text-on-surface-variant mb-8">
                I can assist with account issues, troubleshooting Claude features, diagnosing API errors, or drafting professional customer emails.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {[
                  "User can't log into Claude after changing email.",
                  "Draft an email for a user who can't access Pro.",
                  "What are the rate limits for the API?",
                  "Explain the new Artifacts feature."
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="p-4 rounded-2xl bg-surface hover:bg-surface-container border border-outline-variant transition-colors text-on-surface flex flex-col gap-2 group shadow-sm"
                  >
                    <MaterialIcon name="lightbulb" className="text-[#D97757] opacity-70 group-hover:opacity-100 transition-opacity" style={{ fontSize: '20px' }} />
                    <span className="text-body-medium font-medium">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                 <div className="w-8 h-8 rounded-full bg-[#D97757] flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                   <MaterialIcon name="smart_toy" className="text-white text-sm" />
                 </div>
              )}
              <div className={`max-w-[90%] md:max-w-[80%] rounded-3xl p-5 ${msg.role === 'user' ? 'bg-[#D97757] text-white rounded-tr-sm shadow-sm' : 'bg-surface text-on-surface rounded-tl-sm border border-outline-variant shadow-sm'}`}>
                <div className={`prose ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} max-w-none text-body-large`}>
                  <MarkdownRenderer content={msg.content} />
                </div>
              </div>
            </div>
          ))}

          {progressStatus && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-[#D97757] flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                <MaterialIcon name="smart_toy" className="text-white text-sm" />
              </div>
              <div className="max-w-[85%] md:max-w-[75%] rounded-3xl p-5 bg-surface text-on-surface-variant rounded-tl-sm border border-outline-variant shadow-sm flex items-center gap-3">
                <MaterialIcon name="sync" className="animate-spin text-[#D97757]" />
                <span className="text-body-medium font-medium">{progressStatus}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-10" />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest to-transparent pt-10">
          <div className="max-w-4xl mx-auto flex items-end gap-2 bg-surface rounded-3xl p-2 pl-4 border border-outline-variant focus-within:border-[#D97757] focus-within:ring-1 focus-within:ring-[#D97757] transition-all shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask a support question or request an email draft..."
              className="flex-1 max-h-40 min-h-[44px] bg-transparent resize-none outline-none text-body-large text-on-surface py-3 px-1 placeholder-on-surface-variant"
              rows={1}
            />
            <button 
              onClick={() => handleSend()}
              disabled={!input.trim() || isGenerating}
              className="w-12 h-12 bg-[#D97757] text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant transition-colors flex-shrink-0"
            >
              <MaterialIcon name={isGenerating ? "stop" : "arrow_upward"} />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-[11px] text-on-surface-variant font-medium">Powered by WebLLM Llama 3.2 1B Instruct</span>
          </div>
        </div>
      </div>
    </div>
  );
}

