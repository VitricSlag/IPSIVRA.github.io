import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send, Square } from "lucide-react";
import type { Message as MessageType } from "@/lib/types";
import { cn } from "@/lib/utils";

const Message = lazy(() =>
  import("./Message").then((m) => ({ default: m.Message })),
);

interface ChatViewProps {
  messages: MessageType[];
  streamingId: string | null;
  generating: boolean;
  modelReady: boolean;
  onSubmit: (text: string) => void;
  onAbort: () => void;
  placeholder?: string;
}

export function ChatView({
  messages,
  streamingId,
  generating,
  modelReady,
  onSubmit,
  onAbort,
  placeholder,
}: ChatViewProps): JSX.Element {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingId]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }, [input]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !modelReady || generating) return;
    onSubmit(text);
    setInput("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mx-auto max-w-3xl">
            <Suspense fallback={<div className="px-6 py-6 text-xs text-muted-foreground font-mono">Rendering…</div>}>
              {messages.map((m) => (
                <Message
                  key={m.id}
                  message={m}
                  streaming={m.id === streamingId}
                />
              ))}
            </Suspense>
            <div className="h-4" />
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="border-t bg-card px-3 py-3 sm:px-6"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={
              placeholder ??
              (modelReady
                ? "Message IPSIVRA…  (Enter to send, Shift+Enter for newline)"
                : "Load a model to begin.")
            }
            disabled={!modelReady}
            className={cn(
              "flex-1 resize-none rounded-md border bg-background px-3 py-2.5 text-sm",
              "leading-relaxed",
              "focus:outline-none focus:ring-1 focus:ring-ring",
              "disabled:opacity-60",
            )}
          />
          {generating ? (
            <button
              type="button"
              onClick={onAbort}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                "border border-destructive/40 bg-destructive/10 text-destructive",
                "hover:bg-destructive/20 transition-colors",
              )}
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!modelReady || input.trim().length === 0}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                "bg-primary text-primary-foreground",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                "transition-colors",
              )}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function EmptyState(): JSX.Element {
  return (
    <div className="flex h-full items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="ipsivra-wordmark text-2xl mb-3">IPSIVRA</div>
        <p className="text-sm text-muted-foreground mb-6">
          Sovereign AI. The model runs on your device. Conversations live in
          your browser. Nothing is sent to a server.
        </p>
        <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
          <p>· WebGPU inference via @mlc-ai/web-llm</p>
          <p>· IndexedDB persistence</p>
          <p>· Works offline once weights are cached</p>
        </div>
      </div>
    </div>
  );
}
