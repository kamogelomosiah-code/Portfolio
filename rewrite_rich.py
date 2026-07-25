import re

with open('src/components/RichComponents.tsx', 'r') as f:
    code = f.read()

new_code = code.replace('bg-surface', 'bg-[#1a1a24]')
new_code = new_code.replace('border-outline-variant', 'border-white/10')
new_code = new_code.replace('hover:border-primary dark:hover:border-primary', 'hover:border-[#4A90E2]')
new_code = new_code.replace('text-on-background', 'text-white')
new_code = new_code.replace('text-on-surface-variant', 'text-gray-400')
new_code = new_code.replace('bg-surface-container-low border-2 border-outline', 'bg-black/20 border border-white/10')
new_code = new_code.replace('text-on-surface', 'text-gray-300')
new_code = new_code.replace('text-primary', 'text-[#4A90E2]')
new_code = new_code.replace('hover:text-primary/80', 'hover:text-[#00B4D8]')
new_code = new_code.replace('bg-primary', 'bg-[#4A90E2]')
new_code = new_code.replace('text-on-primary', 'text-white')
new_code = new_code.replace('bg-primary/10', 'bg-[#4A90E2]/10')
new_code = new_code.replace('border-primary/20', 'border-[#4A90E2]/20')
new_code = new_code.replace('bg-primary/20', 'bg-[#4A90E2]/20')
new_code = new_code.replace('border-primary/30', 'border-[#4A90E2]/30')

with open('src/components/RichComponents.tsx', 'w') as f:
    f.write(new_code)
