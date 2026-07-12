const fs = require('fs');

let content = fs.readFileSync('src/components/MobileApp.tsx', 'utf-8');

// 1. Add AIMessage import
if (!content.includes('AIMessage')) {
  content = content.replace('import MarkdownRenderer from "./MarkdownRenderer";', 'import MarkdownRenderer from "./MarkdownRenderer";\nimport { AIMessage } from "./chat/AIMessage";');
}

// 2. Replace handleSend
const handleSendStart = content.indexOf('  const handleSend = async (text: string) => {');
const handleSendEnd = content.indexOf('  };\n\n  const handleUploadClick', handleSendStart);
if (handleSendStart !== -1 && handleSendEnd !== -1) {
  const newHandleSend = `  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      text: text.trim(), 
      status: "sending"
    };
    const agentMsgId = (Date.now() + 1).toString();
    const initialAgentMsg: Message = {
      id: agentMsgId,
      role: "agent",
      text: "",
      status: "loading"
    };

    const updatedMessages = [...messages, userMsg, initialAgentMsg];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setActiveClarifications([]);

    // Scroll to new agent message
    setTimeout(() => {
      const el = document.getElementById(\`msg-\${agentMsgId}\`);
      if (el && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: el.offsetTop - 20,
          behavior: 'smooth'
        });
      }
    }, 50);

    if (isHfConnected === false) {
      setTimeout(() => {
        let replyText = getOfflineResponse(text);
        let uiBlock: Message["uiBlock"] = null;

        if (replyText.includes("[UI:PROJECTS]")) {
          uiBlock = "projects";
          replyText = replyText.replace("[UI:PROJECTS]", "").trim();
        } else if (replyText.includes("[UI:SKILLS]")) {
          uiBlock = "skills";
          replyText = replyText.replace("[UI:SKILLS]", "").trim();
        } else if (replyText.includes("[UI:CV]")) {
          uiBlock = "cv";
          replyText = replyText.replace("[UI:CV]", "").trim();
        }

        setMessages(prev => prev.map(m => {
          if (m.id === userMsg.id) return { ...m, status: "sent" as const };
          if (m.id === agentMsgId) return { ...m, status: "streaming" as const, text: replyText, uiBlock };
          return m;
        }));
        setIsLoading(false);
      }, 600);
      return;
    }

    try {
      const history = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const token = await getAccessToken();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers['Authorization'] = \`Bearer \${token}\`;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ history, message: text.trim(), model: selectedModel }),
      });
      
      const data = await res.json();
      let replyText = data.text || "Sorry, I had trouble processing that.";
      let uiBlock: Message["uiBlock"] = null;

      let followUps: string[] = [];
      const clarifyMatch = replyText.match(/\\[CLARIFY:\\s*([^\\]]+)\\]/);
      if (clarifyMatch) {
        followUps = clarifyMatch[1].split("|").map((q: string) => q.trim()).filter(Boolean);
        replyText = replyText.replace(/\\[CLARIFY:\\s*([^\\]]+)\\]/, "").trim();
      }

      if (replyText.includes("[UI:PROJECTS]")) {
        uiBlock = "projects";
        replyText = replyText.replace("[UI:PROJECTS]", "").trim();
      } else if (replyText.includes("[UI:SKILLS]")) {
        uiBlock = "skills";
        replyText = replyText.replace("[UI:SKILLS]", "").trim();
      } else if (replyText.includes("[UI:CV]")) {
        uiBlock = "cv";
        replyText = replyText.replace("[UI:CV]", "").trim();
      }

      setMessages(prev => prev.map(m => {
        if (m.id === userMsg.id) return { ...m, status: "sent" as const };
        if (m.id === agentMsgId) return { ...m, status: "streaming" as const, text: replyText, uiBlock };
        return m;
      }));

      if (followUps.length > 0) {
        setActiveClarifications(followUps);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(m => {
        if (m.id === userMsg.id) return { ...m, status: "error" as const };
        if (m.id === agentMsgId) return { ...m, status: "error" as const, text: "An error occurred." };
        return m;
      }));
      setIsLoading(false);
    }
`;
  content = content.substring(0, handleSendStart) + newHandleSend + content.substring(handleSendEnd);
}

// 3. Replace AI Rendering block
// In MobileApp.tsx, it starts at `) : (`
// just before `<div className="flex items-start gap-3 w-full">`
// up to `)}` before `</div>` before `); })}`
const aiRenderStart = content.indexOf('<div className="flex items-start gap-3 w-full">');
if (aiRenderStart !== -1) {
  const aiRenderEnd = content.indexOf(')}', content.indexOf('<div className="mt-3 w-full">', aiRenderStart));
  // Let's use a regex specifically for MobileApp.tsx
}

// It's safer to regex the exact MobileApp AI message section
content = content.replace(/<div className="flex items-start gap-3 w-full">[\s\S]*?\{msg.uiBlock === "cv" && <DownloadCV onViewCv=\{\(\) => setActiveTab\("cv"\)\} \/>\}\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/, `<AIMessage
                                msg={msg}
                                isFirstInGroup={isFirstInGroup}
                                onStreamingComplete={(id) => {
                                  setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "sent" } : m));
                                }}
                                renderUIBlock={(uiBlock) => (
                                  <>
                                    {uiBlock === "projects" && <ProjectCards />}
                                    {uiBlock === "skills" && <SkillChips />}
                                    {uiBlock === "cv" && <DownloadCV onViewCv={() => setActiveTab("cv")} />}
                                  </>
                                )}
                              />`);

// Remove old isLoading indicator in MobileApp.tsx
const oldLoadingIndicator = content.match(/\{\/\* While AI is responding \*\/\}\n\s*\{isLoading && \([\s\S]*?<\/div>\n\s*\)\}/);
if (oldLoadingIndicator) {
  content = content.replace(oldLoadingIndicator[0], '');
}

// Add scroll refs and scroll handle logic to MobileApp
if (!content.includes('const [isAtBottom')) {
  content = content.replace('const [introStage, setIntroStage] = useState<"initial" | "options">("initial");', 'const [introStage, setIntroStage] = useState<"initial" | "options">("initial");\n  const [isAtBottom, setIsAtBottom] = useState(true);\n  const lastScrollY = useRef(0);');
}

const handleScrollMobile = `  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    lastScrollY.current = scrollTop;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
  };`;
if (!content.includes('const handleScroll')) {
  content = content.replace('// Smart Clarification', handleScrollMobile + '\n\n  // Smart Clarification');
}

// Attach onScroll to MobileApp chat container
// className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 relative scroll-smooth scrollbar-hide pt-4"
content = content.replace(/className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 relative scroll-smooth scrollbar-hide pt-4"/, 'className="flex-1 overflow-y-auto px-4 pb-4 space-y-5 relative scroll-smooth scrollbar-hide pt-4"\n                      onScroll={handleScroll}');

fs.writeFileSync('src/components/MobileApp.tsx', content);
