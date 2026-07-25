import re

with open('src/components/ChatInterface.tsx', 'r') as f:
    code = f.read()

target = r'''                    <motion.div 
                      initial=\{\{ opacity: 0, y: 10 \}\}
                      animate=\{\{ opacity: 1, y: 0 \}\}
                      id=\{\`message-\$\{msg\.id\}\`\}
                      key=\{msg\.id\} 
                      className=\{\`flex w-full \$\{isUser \? "justify-end" : "justify-start"\}\`\}
                    \>
                      <div className=\{\`flex flex-col max-w-\[85%\] sm:max-w-\[75%\] \$\{isUser \? "items-end" : "items-start"\}\`\}\>
                        <div className="flex items-center gap-2 mb-1\.5 px-1"\>
                          \{\!isUser && <div className="w-5 h-5 rounded-full bg-gradient-to-br from-\[#4A90E2\] to-\[#00B4D8\] flex items-center justify-center text-\[10px\] font-bold text-white"\>K</div\>\}
                          <span className="text-\[13px\] font-medium text-gray-400"\>\{isUser \? "You" : "Kamogelo"\}</span\>
                          <span className="text-\[11px\] text-gray-500"\>\{new Date\(\)\.toLocaleTimeString\(\[\], \{hour: '2-digit', minute:'2-digit'\}\)\}</span\>
                        </div\>
                        <div 
                          className=\{\`px-5 py-3\.5 rounded-2xl shadow-sm \$\{isUser \? "bg-\[#4A90E2\] text-white rounded-tr-sm" : "bg-\[#2a2a3c\] text-gray-100 rounded-tl-sm border border-white/5"\}\`\}
                        \>
                          <p className="text-\[15px\] whitespace-pre-wrap font-normal leading-relaxed break-words"\>
                            \{msg\.text\}
                          </p\>
                        </div\>
                        \{msg\.status === "error" && \(
                          <button onClick=\{\(\) => handleSend\(msg\.text\)\} className="mt-2 text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 transition-colors"\>
                            <MaterialIcon name="error" className="text-\[14px\]" /> Failed to send\. Retry
                          </button\>
                        \)\}
                      </div\>
                    </motion\.div\>'''

new = r'''                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      id={`message-${msg.id}`}
                      key={msg.id} 
                      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {isUser ? (
                        <div className="flex flex-col max-w-[85%] sm:max-w-[75%] items-end">
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <span className="text-[13px] font-medium text-gray-400">You</span>
                          </div>
                          <div className="px-5 py-3.5 rounded-2xl shadow-sm bg-[#4A90E2] text-white rounded-tr-sm">
                            <p className="text-[15px] whitespace-pre-wrap font-normal leading-relaxed break-words">
                              {msg.text}
                            </p>
                          </div>
                          {msg.status === "error" && (
                            <button onClick={() => handleSend(msg.text)} className="mt-2 text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1 transition-colors">
                              <MaterialIcon name="error" className="text-[14px]" /> Failed to send. Retry
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col max-w-full sm:max-w-full items-start w-full">
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#00B4D8] flex items-center justify-center text-[10px] font-bold text-white">K</div>
                            <span className="text-[13px] font-medium text-gray-400">Kamogelo</span>
                          </div>
                          <AIMessage
                            msg={msg}
                            isFirstInGroup={true}
                            onStreamingComplete={(id) => {
                              setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "sent" } : m));
                            }}
                            renderUIBlock={(uiBlock) => (
                              <>
                                {uiBlock === "projects" && <ProjectCards />}
                                {uiBlock === "skills" && <SkillChips />}
                                {uiBlock === "cv" && <DownloadCV onViewCv={onViewCv} />}
                              </>
                            )}
                          />
                        </div>
                      )}
                    </motion.div>'''

new_code = re.sub(target, new, code)
if new_code != code:
    print("Agent message fixed")
else:
    print("Agent message not found")

with open('src/components/ChatInterface.tsx', 'w') as f:
    f.write(new_code)
