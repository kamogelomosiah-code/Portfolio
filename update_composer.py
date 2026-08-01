import sys

def main():
    with open('src/components/MobileApp.tsx', 'r') as f:
        lines = f.readlines()
        
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if "{/* Input box with smooth shadow radius */}" in line:
            start_idx = i
        if "{/* Footer info */}" in line and start_idx != -1:
            end_idx = i
            break
            
    if start_idx != -1 and end_idx != -1:
        replacement = """        {/* Input box with minimalistic ChatGPT styling */}
        <div className="w-full bg-surface-container-low rounded-3xl focus-within:ring-2 focus-within:ring-primary/50 transition-all flex items-end p-2 pb-2 relative border border-outline-variant/30 shadow-sm mx-4 mb-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Message Kamo's AI..." 
            className="flex-1 bg-transparent text-on-background py-2.5 px-4 focus:outline-none resize-none placeholder:text-on-surface-variant font-normal text-body-large leading-relaxed border-0 max-h-[200px]"
            disabled={isLoading || isGenerating}
            rows={1}
            style={{ minHeight: "44px" }}
          />

          {/* Right side: Mic and Send */}
          <div className="flex gap-1.5 pb-1 pr-1 shrink-0">
            {supportSpeechRecognition && (
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isLoading || isGenerating}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-0 cursor-pointer ${
                  isRecording
                    ? "bg-rose-500 text-white animate-pulse shadow-md"
                    : "bg-surface-alt text-on-surface hover:bg-surface-container-highest"
                }`}
                title={isRecording ? "Stop Recording" : "Start Voice Input"}
              >
                <MaterialIcon
                  name={isRecording ? "stop" : "mic"}
                  className="text-body-large"
                />
              </button>
            )}

            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading || isGenerating}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border-0 ${
                input.trim() && !isLoading && !isGenerating
                  ? "bg-primary text-on-primary hover:opacity-90 shadow-sm"
                  : "bg-surface-alt text-on-surface-variant opacity-50 cursor-not-allowed"
              }`}
            >
              <MaterialIcon name={isLoading || isGenerating ? "more_horiz" : "arrow_upward"} className="text-title-medium" />
            </button>
          </div>
        </div>
"""
        new_lines = lines[:start_idx] + [replacement] + lines[end_idx:]
        with open('src/components/MobileApp.tsx', 'w') as f:
            f.writelines(new_lines)
        print("Success")
    else:
        print(f"Could not find boundaries: start_idx={start_idx}, end_idx={end_idx}")

if __name__ == "__main__":
    main()
