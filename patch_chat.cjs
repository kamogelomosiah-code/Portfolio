const fs = require('fs');
const content = fs.readFileSync('src/components/ChatInterface.tsx', 'utf8');

// 1. Fix the user message container
let newContent = content.replace(
  'className="text-on-background px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-sm border-2 shadow-sm"',
  'className="text-on-background px-4.5 py-3 sm:px-5 sm:py-3.5 rounded-2xl rounded-tr-sm border-2 shadow-sm max-w-full overflow-hidden"'
);

newContent = newContent.replace(
  '<p className="text-[14.5px] sm:text-title-small whitespace-pre-wrap font-normal leading-relaxed break-words">',
  '<p className="text-[14.5px] sm:text-title-small whitespace-pre-wrap font-normal leading-relaxed break-words" style={{ wordBreak: "break-word" }}>'
);

// 2. Add token predictor
newContent = newContent.replace(
  '<span className="text-[11.5px] text-on-surface-variant font-mono hidden sm:inline select-none pr-1">\n                {input.length}/1000\n              </span>',
  `<div className="flex flex-col items-end mr-1 hidden sm:flex">
                <span className="text-[10px] text-primary/80 font-mono select-none font-semibold">
                  ~{Math.ceil(input.trim().length / 4)} tokens
                </span>
                <span className="text-[11.5px] text-on-surface-variant font-mono select-none">
                  {input.length}/1000
                </span>
              </div>`
);

fs.writeFileSync('src/components/ChatInterface.tsx', newContent);
console.log("Patched ChatInterface.tsx");
