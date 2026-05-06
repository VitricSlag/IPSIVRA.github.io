import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { ChatView } from "@/components/ChatView";
import { ModelPicker } from "@/components/ModelPicker";
import { Sidebar } from "@/components/Sidebar";
import { StatsBar } from "@/components/StatsBar";
import { SystemPromptEditor } from "@/components/SystemPromptEditor";
import { WebGPUGate } from "@/components/WebGPUGate";
import { useEngine } from "@/hooks/useEngine";
import { useConversations, useMessages } from "@/hooks/useConversations";
import {
  DEFAULT_MODEL_ID,
  MODEL_OPTIONS,
  type Conversation,
  type Message as MessageType,
} from "@/lib/types";
import { cn, truncate } from "@/lib/utils";

const ACTIVE_KEY = "ipsivra:activeId";
const THEME_KEY = "ipsivra:theme";
const MODEL_KEY = "ipsivra:model";

type Theme = "dark" | "light";

function readTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
}

export default function App(): JSX.Element {
  const engine = useEngine();
  const convs = useConversations();

  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [activeId, setActiveId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null,
  );
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_MODEL_ID;
    return localStorage.getItem(MODEL_KEY) ?? DEFAULT_MODEL_ID;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  const [lastTokensPerSec, setLastTokensPerSec] = useState<number | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const messages = useMessages(activeId);

  const activeConversation = useMemo<Conversation | null>(
    () =>
      convs.conversations?.find((c) => c.id === activeId) ?? null,
    [convs.conversations, activeId],
  );

  // Theme
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Persist active conversation
  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeId]);

  // Persist selected model
  useEffect(() => {
    localStorage.setItem(MODEL_KEY, selectedModel);
  }, [selectedModel]);

  // Once conversations load, pick a default if none active
  useEffect(() => {
    if (!convs.conversations) return;
    if (
      activeId &&
      convs.conversations.some((c) => c.id === activeId)
    ) {
      return;
    }
    if (convs.conversations.length > 0) {
      setActiveId(convs.conversations[0]!.id);
    } else {
      void (async () => {
        const id = await convs.createConversation(selectedModel);
        setActiveId(id);
      })();
    }
  }, [convs.conversations, activeId, convs, selectedModel]);

  // Sync selected model with active conversation
  useEffect(() => {
    if (activeConversation) setSelectedModel(activeConversation.modelId);
  }, [activeConversation]);

  const handleSelectModel = useCallback(
    async (modelId: string) => {
      setSelectedModel(modelId);
      if (activeConversation && messages.length === 0) {
        await convs.setModelForConversation(activeConversation.id, modelId);
      }
      setError(null);
      try {
        await engine.load(modelId);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [activeConversation, messages.length, convs, engine],
  );

  const handleCreateConversation = useCallback(async () => {
    const id = await convs.createConversation(selectedModel);
    setActiveId(id);
    setSidebarOpen(false);
  }, [convs, selectedModel]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await convs.deleteConversation(id);
      if (id === activeId) setActiveId(null);
    },
    [convs, activeId],
  );

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
    setSidebarOpen(false);
  }, []);

  const handleSetSystemPrompt = useCallback(
    async (next: string) => {
      if (!activeConversation) return;
      await convs.setSystemPrompt(activeConversation.id, next);
    },
    [activeConversation, convs],
  );

  // Submission / streaming
  const submitInFlight = useRef(false);
  const handleSubmit = useCallback(
    async (text: string) => {
      if (submitInFlight.current) return;
      if (!activeConversation) return;
      if (engine.status.kind !== "ready") {
        setError("Model is not loaded yet.");
        return;
      }
      submitInFlight.current = true;
      try {
        const isFirstMessage = messages.length === 0;
        await convs.appendMessage(activeConversation.id, "user", text);

        if (isFirstMessage) {
          await convs.renameConversation(
            activeConversation.id,
            truncate(text, 40),
          );
        }

        const assistantId = await convs.appendMessage(
          activeConversation.id,
          "assistant",
          "",
        );
        setStreamingMessage({ id: assistantId, content: "" });

        const history: { role: MessageType["role"]; content: string }[] = [];
        if (activeConversation.systemPrompt.trim().length > 0) {
          history.push({
            role: "system",
            content: activeConversation.systemPrompt,
          });
        }
        for (const m of messages) {
          history.push({ role: m.role, content: m.content });
        }
        history.push({ role: "user", content: text });

        let acc = "";
        engine.stream(activeConversation.modelId, history, {
          onDelta: (delta) => {
            acc += delta;
            setStreamingMessage({ id: assistantId, content: acc });
          },
          onDone: ({ tokensPerSec }) => {
            setLastTokensPerSec(tokensPerSec);
            void convs.updateMessage(assistantId, {
              content: acc,
              tokensPerSec,
            });
            void convs.touchConversation(activeConversation.id);
            setStreamingMessage(null);
          },
          onError: (err) => {
            setError(err.message);
            void convs.updateMessage(assistantId, {
              content: acc + `\n\n_Error: ${err.message}_`,
            });
            setStreamingMessage(null);
          },
        });
      } finally {
        submitInFlight.current = false;
      }
    },
    [activeConversation, engine, messages, convs],
  );

  const handleAbort = useCallback(() => {
    engine.abort();
  }, [engine]);

  // Compose displayed messages (substitute streaming content into the placeholder)
  const displayedMessages = useMemo<MessageType[]>(() => {
    if (!streamingMessage) return messages;
    return messages.map((m) =>
      m.id === streamingMessage.id
        ? { ...m, content: streamingMessage.content }
        : m,
    );
  }, [messages, streamingMessage]);

  if (!engine.webgpuSupported) return <WebGPUGate />;

  const modelLabel =
    MODEL_OPTIONS.find((m) => m.id === selectedModel)?.label ?? selectedModel;

  const statusText = (() => {
    switch (engine.status.kind) {
      case "idle":
        return "Awaiting model";
      case "loading":
        return `Loading ${Math.round(engine.status.progress.progress * 100)}%`;
      case "ready":
        return engine.isGenerating ? "Generating" : "Ready";
      case "error":
        return "Error";
    }
  })();

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Sidebar — desktop */}
      <div className="hidden md:flex">
        <Sidebar
          conversations={convs.conversations ?? []}
          activeId={activeId}
          onSelect={handleSelectConversation}
          onCreate={handleCreateConversation}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80vw]">
            <Sidebar
              conversations={convs.conversations ?? []}
              activeId={activeId}
              onSelect={handleSelectConversation}
              onCreate={handleCreateConversation}
              onDelete={handleDeleteConversation}
              onClose={() => setSidebarOpen(false)}
              isMobile
            />
          </div>
        </div>
      )}

      <main className="flex h-full min-w-0 flex-1 flex-col">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          modelId={selectedModel}
          status={engine.status}
          onSelectModel={handleSelectModel}
          onOpenSidebar={() => setSidebarOpen(true)}
          modelLocked={engine.isGenerating}
        />

        {error && (
          <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {activeConversation && (
          <SystemPromptEditor
            value={activeConversation.systemPrompt}
            onSave={handleSetSystemPrompt}
          />
        )}

        {engine.status.kind !== "ready" && messages.length === 0 ? (
          <ModelGate
            status={engine.status}
            selectedModel={selectedModel}
            onLoad={() => void handleSelectModel(selectedModel)}
          />
        ) : (
          <ChatView
            messages={displayedMessages}
            streamingId={streamingMessage?.id ?? null}
            generating={engine.isGenerating}
            modelReady={engine.status.kind === "ready"}
            onSubmit={(t) => void handleSubmit(t)}
            onAbort={handleAbort}
          />
        )}

        <StatsBar
          modelLabel={modelLabel}
          tokensPerSec={lastTokensPerSec}
          totalMessages={messages.length}
          status={statusText}
        />
      </main>
    </div>
  );
}

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  modelId: string;
  status: ReturnType<typeof useEngine>["status"];
  onSelectModel: (modelId: string) => void;
  onOpenSidebar: () => void;
  modelLocked: boolean;
}

function Header(props: HeaderProps): JSX.Element {
  return (
    <header className="flex items-center justify-between gap-3 border-b bg-card px-3 py-2 sm:px-4">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={props.onOpenSidebar}
          className="rounded-md p-2 hover:bg-accent md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <div className="ipsivra-wordmark text-sm leading-none">IPSIVRA</div>
          <div className="mt-0.5 hidden truncate text-[10px] text-muted-foreground sm:block">
            sovereign AI — runs on your device
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ModelPicker
          modelId={props.modelId}
          status={props.status}
          disabled={props.modelLocked}
          onSelect={props.onSelectModel}
        />
        <button
          type="button"
          onClick={props.onToggleTheme}
          className="rounded-md border p-2 hover:bg-accent"
          aria-label="Toggle theme"
        >
          {props.theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </header>
  );
}

interface ModelGateProps {
  status: ReturnType<typeof useEngine>["status"];
  selectedModel: string;
  onLoad: () => void;
}

function ModelGate({
  status,
  selectedModel,
  onLoad,
}: ModelGateProps): JSX.Element {
  const opt = MODEL_OPTIONS.find((m) => m.id === selectedModel);

  if (status.kind === "loading") {
    const pct = Math.round(status.progress.progress * 100);
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="ipsivra-wordmark mb-2 text-sm">Loading weights</div>
          <p className="mb-4 text-xs text-muted-foreground font-mono">
            {status.progress.text}
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">
            {pct}%
          </div>
        </div>
      </div>
    );
  }

  if (status.kind === "error") {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="ipsivra-wordmark mb-2 text-sm text-destructive">
            Load failed
          </div>
          <p className="mb-4 text-xs font-mono text-muted-foreground">
            {status.message}
          </p>
          <button
            type="button"
            onClick={onLoad}
            className={cn(
              "rounded-md border bg-card px-3 py-1.5 text-sm",
              "hover:bg-accent transition-colors",
            )}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="ipsivra-wordmark mb-2 text-base">IPSIVRA</div>
        <p className="mb-1 text-sm text-muted-foreground">
          local by design — sovereign AI
        </p>
        <p className="mb-6 text-xs text-muted-foreground">
          Load{" "}
          <span className="font-mono">{opt?.label ?? selectedModel}</span> to
          start. ~{opt?.approxSizeGB.toFixed(1)} GB downloads on first use,
          cached after.
        </p>
        <button
          type="button"
          onClick={onLoad}
          className={cn(
            "rounded-md bg-primary px-4 py-2 text-sm font-medium",
            "text-primary-foreground hover:opacity-90 transition",
          )}
        >
          Load model
        </button>
      </div>
    </div>
  );
}

