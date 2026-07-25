import re

with open('src/components/ChatInterface.tsx', 'r') as f:
    code = f.read()

target = r'''            <div className="text-xs font-medium text-\[#00B4D8\] flex items-center gap-1\.5">
              <span className="w-1\.5 h-1\.5 rounded-full bg-\[#00B4D8\] animate-pulse shadow-\[0_0_8px_#00B4D8\]" />
              Assistant Connected
            </div>'''

new = r'''            <div className={`text-xs font-medium flex items-center gap-1.5 ${isHfConnected === null ? "text-amber-400" : isHfConnected ? "text-emerald-400" : "text-rose-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${isHfConnected === null ? "bg-amber-400" : isHfConnected ? "bg-emerald-400" : "bg-rose-400"}`} />
              {isHfConnected === null ? "Checking Server..." : isHfConnected ? "Server Connected" : "Offline Mode"}
            </div>'''

new_code = re.sub(target, new, code)
if new_code != code:
    print("HF status fixed")
else:
    print("HF status not found")

with open('src/components/ChatInterface.tsx', 'w') as f:
    f.write(new_code)
