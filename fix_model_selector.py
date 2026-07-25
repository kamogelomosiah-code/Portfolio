import re

with open('src/components/ChatInterface.tsx', 'r') as f:
    code = f.read()

target = r'''                  <div ref={endOfMessagesRef} className="h-4" />
                </div>
              \)\}
            </div>
        </div>

        \{/\* Custom Composer fixed at bottom \*/\}'''

replacement = r'''                  <div ref={endOfMessagesRef} className="h-4" />
                </div>
              )}
              
              <div className="w-full flex justify-center mt-2 mb-2 pointer-events-auto pb-4">
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-medium rounded-full shadow-sm transition-all border-none cursor-pointer"
                >
                  <MaterialIcon name="auto_awesome" className="text-[14px]" />
                  {selectedModel === 'large' ? 'Sonnet 5 Thinking' : 'Claude 3.5 Haiku'}
                </button>
              </div>
            </div>
        </div>

        {/* Custom Composer fixed at bottom */}'''

new_code = re.sub(target, replacement, code, flags=re.DOTALL)
if new_code != code:
    print("Model selector applied!")
    code = new_code
else:
    print("Model selector not found")

with open('src/components/ChatInterface.tsx', 'w') as f:
    f.write(code)
