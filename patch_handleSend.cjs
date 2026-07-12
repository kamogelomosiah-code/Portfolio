const fs = require('fs');

let content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf-8');

// We need to replace handleSend logic.
// It's safer to just replace the whole handleSend function.

const newHandleSend = `
  const handleSend = async (text: string) => {
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
    setIsLoading(true); // Keep for backwards compatibility, but not used in UI ideally
    setActiveClarifications([]);

    // Scroll to new agent message
    setTimeout(() => {
      const el = document.getElementById(\`msg-\${agentMsgId}\`);
      if (el && scrollContainerRef.current) {
        // Animate smooth scroll to the start of the message
        scrollContainerRef.current.scrollTo({
          top: el.offsetTop - 20, // Add some padding
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

      // Extract clarifying follow-up questions
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
  };
`;

content = content.replace(/const handleSend = async \([\s\S]*?\} catch \(error\) \{[\s\S]*?setIsLoading\(false\);\n    \}\n  \};/, newHandleSend.trim());
fs.writeFileSync('src/components/ChatInterface.tsx', content);
