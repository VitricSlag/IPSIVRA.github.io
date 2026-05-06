import { useEffect, useState, type CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/common";
import { Check, Copy, User, Sparkles } from "lucide-react";
import type { Message as MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MessageProps {
  message: MessageType;
  streaming?: boolean;
}

export function Message({ message, streaming }: MessageProps): JSX.Element {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-4 sm:px-6",
        isUser ? "bg-transparent" : "bg-muted/30",
      )}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-card text-foreground",
        )}
        aria-hidden
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
          <span>{isUser ? "You" : "IPSIVRA"}</span>
          {message.tokensPerSec !== undefined && (
            <span>· {message.tokensPerSec.toFixed(1)} tok/s</span>
          )}
        </div>
        {isUser ? (
          <div className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed">
            {message.content}
          </div>
        ) : (
          <div className="markdown break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: CodeBlock,
              }}
            >
              {message.content || (streaming ? "" : "")}
            </ReactMarkdown>
            {streaming && (
              <span
                className="ml-0.5 inline-block h-3.5 w-1.5 align-middle bg-foreground/70 animate-blink"
                aria-hidden
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: CSSProperties;
}

function CodeBlock({
  inline,
  className,
  children,
}: CodeBlockProps): JSX.Element {
  const code = String(children ?? "").replace(/\n$/, "");
  const langMatch = /language-(\w+)/.exec(className ?? "");
  const lang = langMatch?.[1];
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);

  if (inline || !code.includes("\n")) {
    return <code className={className}>{children}</code>;
  }

  let highlighted = code;
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(code, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(code).value;
    }
  } catch {
    highlighted = escapeHtml(code);
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // ignore
    }
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1 text-[11px] font-mono text-muted-foreground">
        <span>{lang ?? "code"}</span>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-background"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="hljs !rounded-none !border-0 !my-0 overflow-x-auto">
        <code
          className={className}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
