import re

with open('src/components/ChatInterface.tsx', 'r') as f:
    code = f.read()

target = r'''                        <div className="flex flex-col max-w-full sm:max-w-full items-start w-full"\>
                          <div className="flex items-center gap-2 mb-1\.5 px-1"\>
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-\[#4A90E2\] to-\[#00B4D8\] flex items-center justify-center text-\[10px\] font-bold text-white"\>K</div\>
                            <span className="text-\[13px\] font-medium text-gray-400"\>Kamogelo</span\>
                          </div\>
                          <AIMessage'''

new = r'''                        <div className="flex flex-col max-w-full sm:max-w-full items-start w-full">
                          <AIMessage'''

new_code = re.sub(target, new, code)
if new_code != code:
    print("Wrapper fixed")
else:
    print("Wrapper not found")

with open('src/components/ChatInterface.tsx', 'w') as f:
    f.write(new_code)
