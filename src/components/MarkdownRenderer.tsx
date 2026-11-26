import React from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import scss from "react-syntax-highlighter/dist/esm/languages/prism/scss";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Mail, Download } from "lucide-react";

SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("scss", scss);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("css", css);

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const codeText = String(children).replace(/\n$/, "");
  const isHtml = language === "html" || language === "xml";
  const [showPreview, setShowPreview] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${language === "text" ? "txt" : language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl overflow-hidden my-3 border border-outline-variant bg-neutral-950 font-sans">
      <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">
            {language}
          </span>
          {isHtml && (
            <div className="flex bg-neutral-800 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  !showPreview ? "bg-neutral-700 text-white" : "bg-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  showPreview ? "bg-neutral-700 text-white" : "bg-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Preview
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="text-neutral-400 hover:text-white transition-colors flex items-center justify-center p-1.5 rounded bg-transparent cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="text-neutral-400 hover:text-white transition-colors flex items-center justify-center p-1.5 rounded bg-transparent cursor-pointer"
            title="Download file"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      <div className="w-full relative overflow-hidden bg-neutral-950">
        {showPreview && isHtml ? (
          <div className="w-full h-full min-h-[200px] bg-white overflow-auto relative">
            <iframe
              srcDoc={codeText}
              className="w-full h-full min-h-[300px] border-0"
              title="HTML Preview"
              sandbox="allow-scripts"
            />
          </div>
        ) : (
          <div className="p-0 m-0 overflow-x-auto text-xs sm:text-[13px]">
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                background: "transparent",
                padding: "0.875rem 1rem",
              }}
            >
              {codeText}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

function splitAndParseEmail(text: string) {
  const lowerText = text.toLowerCase();
  const subjectIndex = lowerText.indexOf("subject:");
  if (subjectIndex === -1) return null;

  const toIndex = lowerText.indexOf("to:");
  const startIndex = toIndex !== -1 && toIndex < subjectIndex ? toIndex : subjectIndex;

  const intro = text.substring(0, startIndex).trim();
  const emailBlock = text.substring(startIndex).trim();

  const subjectMatch = emailBlock.match(/Subject:\s*(.*)/i);
  if (!subjectMatch) return null;

  const subject = subjectMatch[1].trim();
  const toMatch = emailBlock.match(/To:\s*(.*)/i);
  const to = toMatch ? toMatch[1].trim() : "kamogelomosiah@gmail.com";

  const body = emailBlock
    .replace(/To:\s*.*[\r\n]*/i, "")
    .replace(/Subject:\s*.*[\r\n]*/i, "")
    .trim();

  return { intro, to, subject, body };
}

interface EmailDraftCardProps {
  to: string;
  subject: string;
  body: string;
}

export function EmailDraftCard({ to, subject, body }: EmailDraftCardProps) {
  const [copied, setCopied] = React.useState(false);

  const fullEmailText = `Subject: ${subject}\nTo: ${to}\n\n${body}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullEmailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="w-full border border-outline-variant rounded-xl overflow-hidden my-3 font-sans bg-surface">
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low border-b border-outline-variant">
        <span className="font-mono text-xs font-medium text-on-surface-variant">Email Draft</span>
      </div>

      <div className="p-3.5 border-b border-outline-variant text-xs sm:text-sm space-y-1.5 bg-surface-container-low/50">
        <div className="flex items-baseline gap-2">
          <span className="text-on-surface-variant font-medium w-14 shrink-0">To:</span>
          <span className="font-medium text-on-surface">{to}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-on-surface-variant font-medium w-14 shrink-0">Subject:</span>
          <span className="font-semibold text-on-surface">{subject}</span>
        </div>
      </div>

      <div className="p-4 max-h-[320px] overflow-y-auto bg-surface text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
        {body}
      </div>

      <div className="flex items-center justify-end gap-2.5 px-4 py-3 bg-surface-container-low border-t border-outline-variant">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-outline-variant hover:bg-surface-container text-xs font-medium transition-colors cursor-pointer bg-surface text-on-surface"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy Draft</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleSend}
          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-primary text-on-primary hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer"
        >
          <Mail size={13} />
          <span>Open Mail App</span>
        </button>
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  let processedContent = content;

  processedContent = processedContent.replace(/\\\\\[/g, "$$\n").replace(/\\\\\]/g, "\n$$");
  processedContent = processedContent.replace(/\\\[/g, "$$\n").replace(/\\\]/g, "\n$$");
  processedContent = processedContent.replace(/\\\\\(/g, " $ ").replace(/\\\\\)/g, " $ ");
  processedContent = processedContent.replace(/\\\(/g, " $ ").replace(/\\\)/g, " $ ");

  const emailData = splitAndParseEmail(processedContent);
  const textToRender = isStreaming ? `${processedContent}▍` : processedContent;

  const renderMarkdown = (text: string) => (
    <Markdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => (
          <p className="mb-2.5 last:mb-0 leading-relaxed text-[15px] font-normal break-words text-on-background">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-5 mb-3 space-y-1 text-[14.5px] text-on-background">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 mb-3 space-y-1 text-[14.5px] text-on-background">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => (
          <h1 className="text-lg sm:text-xl font-semibold mt-5 mb-2 text-on-background tracking-tight border-b border-outline-variant pb-1.5">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base sm:text-lg font-semibold mt-4 mb-1.5 text-on-background tracking-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm sm:text-base font-semibold mt-3 mb-1 text-on-background">
            {children}
          </h3>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline ? (
            <code className="px-1.5 py-0.5 rounded bg-surface-container text-[13px] font-mono text-accent-ink font-medium">
              {children}
            </code>
          ) : (
            <CodeBlock className={className}>{children}</CodeBlock>
          );
        },
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-ink hover:underline font-medium"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold text-on-background">{children}</strong>,
        em: ({ children }) => <em className="italic text-on-background/90">{children}</em>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-primary pl-3.5 italic my-3 text-on-surface-variant py-0.5">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 w-full">
            <table className="min-w-full border-collapse border border-outline-variant text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-surface-container-low">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-outline-variant">{children}</tr>,
        th: ({ children }) => <th className="p-2 border border-outline-variant font-semibold text-left">{children}</th>,
        td: ({ children }) => <td className="p-2 border border-outline-variant text-on-background">{children}</td>,
      }}
    >
      {text}
    </Markdown>
  );

  if (emailData) {
    return (
      <div className="w-full max-w-full flex flex-col gap-2">
        {emailData.intro ? <div className="w-full">{renderMarkdown(emailData.intro)}</div> : null}
        <EmailDraftCard to={emailData.to} subject={emailData.subject} body={emailData.body} />
      </div>
    );
  }

  return <div className="w-full max-w-full">{renderMarkdown(textToRender)}</div>;
}
