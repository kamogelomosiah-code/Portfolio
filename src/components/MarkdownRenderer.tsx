import React from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Check, Copy, Mail } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

// Check if content looks like a draft email, and if so, parse it
function splitAndParseEmail(text: string) {
  const lowerText = text.toLowerCase();
  const subjectIndex = lowerText.indexOf("subject:");
  if (subjectIndex === -1) return null;

  const toIndex = lowerText.indexOf("to:");
  const startIndex = (toIndex !== -1 && toIndex < subjectIndex) ? toIndex : subjectIndex;

  const intro = text.substring(0, startIndex).trim();
  const emailBlock = text.substring(startIndex).trim();

  const subjectMatch = emailBlock.match(/Subject:\s*(.*)/i);
  if (!subjectMatch) return null;

  const subject = subjectMatch[1].trim();
  const toMatch = emailBlock.match(/To:\s*(.*)/i);
  const to = toMatch ? toMatch[1].trim() : "kamogelomosiah@gmail.com";

  // Clean the body of To: and Subject: lines
  let body = emailBlock
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
    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-md my-4 font-sans bg-white dark:bg-neutral-900 transition-all duration-200">
      {/* Mail Header Window Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
        </div>
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Email Composer Draft</span>
        <div className="w-12" /> {/* spacer */}
      </div>

      {/* Mail Address Form fields */}
      <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800/60 text-xs sm:text-sm space-y-2 bg-neutral-50/50 dark:bg-neutral-950/20">
        <div className="flex items-baseline gap-2">
          <span className="text-neutral-400 font-medium w-16 text-right select-none">To:</span>
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">{to}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-neutral-400 font-medium w-16 text-right select-none">Subject:</span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">{subject}</span>
        </div>
      </div>

      {/* Mail Envelope Content Body */}
      <div className="p-5 max-h-[350px] overflow-y-auto bg-white dark:bg-neutral-950 text-neutral-850 dark:text-neutral-200 text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap font-sans border-b border-neutral-100 dark:border-neutral-900">
        {body}
      </div>

      {/* Mail Composer Action bar */}
      <div className="flex items-center justify-end gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-950/40 border-t border-neutral-150 dark:border-neutral-800">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs sm:text-sm font-semibold transition-all cursor-pointer bg-transparent text-neutral-700 dark:text-neutral-300"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy Draft</span>
            </>
          )}
        </button>
        <button
          onClick={handleSend}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--color-accent)] text-white hover:opacity-95 text-xs sm:text-sm font-semibold transition-all cursor-pointer border-0 shadow-sm"
        >
          <Mail size={14} />
          <span>Open Mail App</span>
        </button>
      </div>
    </div>
  );
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  // Pre-process contents:
  // 1. Convert plain text integrals like "integral of x dx" or "\int x dx" if they aren't parsed
  let processedContent = content;

  // Detect and split if there is an email structure
  const emailData = splitAndParseEmail(processedContent);

  // Append a flashing cursor block if currently streaming, keeping it inline
  const textToRender = isStreaming ? `${processedContent}▍` : processedContent;

  const renderMarkdown = (text: string) => {
    return (
      <Markdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-[15.5px] sm:text-[16px] font-normal break-words text-[var(--text-main)]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3.5 space-y-1.5 text-[14.5px] sm:text-[15px] text-[var(--text-main)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3.5 space-y-1.5 text-[14.5px] sm:text-[15px] text-[var(--text-main)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold mt-5 mb-2.5 text-[var(--text-main)] font-display tracking-tight border-b border-[var(--border-light)] pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-semibold mt-4.5 mb-2 text-[var(--text-main)] font-display tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-3.5 mb-1.5 text-[var(--text-main)] font-display">
              {children}
            </h3>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-[13px] font-mono text-[var(--color-accent)] font-semibold">
                {children}
              </code>
            ) : (
              <pre className="p-3.5 my-3.5 rounded-none bg-neutral-950 text-neutral-200 overflow-x-auto text-[13px] sm:text-[13.5px] font-mono border border-neutral-800 shadow-inner">
                <code className={className}>{children}</code>
              </pre>
            );
          },
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] hover:underline font-semibold"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[var(--text-main)]">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="italic text-[var(--text-main)]/90">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-[var(--color-accent)] pl-3.5 italic my-3.5 text-[var(--text-muted)] bg-neutral-50 dark:bg-neutral-900/20 py-1 pr-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3.5 w-full">
              <table className="min-w-full border-collapse border border-[var(--border-light)] text-[14px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-neutral-50 dark:bg-neutral-800/50">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-[var(--border-light)]">{children}</tr>,
          th: ({ children }) => <th className="p-2 border border-[var(--border-light)] font-semibold text-left">{children}</th>,
          td: ({ children }) => <td className="p-2 border border-[var(--border-light)] text-[var(--text-main)]">{children}</td>
        }}
      >
        {text}
      </Markdown>
    );
  };

  if (emailData) {
    return (
      <div className="w-full max-w-full flex flex-col gap-2">
        {emailData.intro ? (
          <div className="w-full">{renderMarkdown(emailData.intro)}</div>
        ) : null}
        <EmailDraftCard to={emailData.to} subject={emailData.subject} body={emailData.body} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      {renderMarkdown(textToRender)}
    </div>
  );
}
