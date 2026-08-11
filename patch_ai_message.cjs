const fs = require('fs');
const content = fs.readFileSync('src/components/chat/AIMessage.tsx', 'utf8');

let newContent = content.replace(
  'import { AppIcon } from "../AppIcon";',
  'import { AppIcon } from "../AppIcon";\nimport { Copy, Check } from "lucide-react";'
);

newContent = newContent.replace(
  'const [localStatus, setLocalStatus]',
  'const [copied, setCopied] = useState(false);\n  const [localStatus, setLocalStatus]'
);

const copyHandler = `  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  useEffect(() => {`;

newContent = newContent.replace('  useEffect(() => {', copyHandler);

const copyButtonHTML = `{localStatus === "sent" && (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant hover:text-primary bg-surface-container-high/45 px-2.5 py-1 rounded-full select-none shadow-sm transition-colors cursor-pointer border-0"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  
                  {(msg as any).meta && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-on-surface-variant bg-surface-container-high/45 px-2.5 py-1 rounded-full select-none shadow-sm">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-primary">{(msg as any).meta.engine}</span>
                      <span className="opacity-40">•</span>
                      <span>Model: <span className="text-on-surface font-semibold">{(msg as any).meta.model}</span></span>
                      {(msg as any).meta.status && (
                        <>
                          <span className="opacity-40">•</span>
                          <span>Status: <span className="text-on-surface">{(msg as any).meta.status}</span></span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}`;

newContent = newContent.replace(
  /\{localStatus === "sent" && \(msg as any\)\.meta && \(\s*<div className="mt-2\.5[\s\S]*?<\/div>\s*\)\}/m,
  copyButtonHTML
);

fs.writeFileSync('src/components/chat/AIMessage.tsx', newContent);
console.log("Patched AIMessage.tsx");
