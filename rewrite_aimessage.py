import re

with open('src/components/chat/AIMessage.tsx', 'r') as f:
    code = f.read()

new_code = code.replace('text-on-surface-variant', 'text-gray-400')
new_code = new_code.replace('text-on-background bg-transparent', 'text-gray-100 bg-[#2a2a3c] rounded-2xl rounded-tl-sm border border-white/5 px-5 py-4')
new_code = new_code.replace('border-outline-variant', 'border-white/10')
new_code = new_code.replace('bg-surface-container-high/45', 'bg-black/20')
new_code = new_code.replace('text-on-surface', 'text-white')
new_code = new_code.replace('bg-surface', 'bg-[#1a1a24]')
new_code = new_code.replace('text-primary', 'text-[#4A90E2]')
new_code = new_code.replace('bg-primary/80', 'bg-[#00B4D8]')
new_code = new_code.replace('bg-emerald-500', 'bg-emerald-400')

with open('src/components/chat/AIMessage.tsx', 'w') as f:
    f.write(new_code)
