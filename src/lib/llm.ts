import type {
  ChatCompletionMessageParam,
  InitProgressCallback,
  MLCEngineInterface,
} from "@mlc-ai/web-llm";
import type { GenerateChunk, InitProgress, Role } from "./types";

export interface LoadOptions {
  modelId: string;
  onProgress: (progress: InitProgress) => void;
  signal?: AbortSignal;
}

export interface GenerateOptions {
  modelId: string;
  messages: { role: Role; content: string }[];
  signal?: AbortSignal;
  temperature?: number;
}

let engine: MLCEngineInterface | null = null;
let loadedModelId: string | null = null;
let loadingPromise: Promise<MLCEngineInterface> | null = null;

export function isWebGPUSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export function currentModelId(): string | null {
  return loadedModelId;
}

async function loadWebLLM(): Promise<typeof import("@mlc-ai/web-llm")> {
  return import("@mlc-ai/web-llm");
}

export async function loadModel(opts: LoadOptions): Promise<void> {
  if (loadedModelId === opts.modelId && engine) return;

  if (loadingPromise) {
    await loadingPromise;
    if (loadedModelId === opts.modelId) return;
  }

  if (engine) {
    try {
      await engine.unload();
    } catch {
      // ignore
    }
    engine = null;
    loadedModelId = null;
  }

  const cb: InitProgressCallback = (report) => {
    opts.onProgress({
      text: report.text,
      progress: report.progress,
      timeElapsed: report.timeElapsed,
    });
  };

  const webllm = await loadWebLLM();
  loadingPromise = webllm.CreateMLCEngine(opts.modelId, {
    initProgressCallback: cb,
  });
  try {
    engine = await loadingPromise;
    loadedModelId = opts.modelId;
  } finally {
    loadingPromise = null;
  }
}

export async function* generate(
  opts: GenerateOptions,
): AsyncGenerator<GenerateChunk, void, void> {
  if (!engine || loadedModelId !== opts.modelId) {
    throw new Error("Engine not ready for the requested model.");
  }

  const messages: ChatCompletionMessageParam[] = opts.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    stream_options: { include_usage: true },
    temperature: opts.temperature ?? 0.7,
  });

  const onAbort = () => {
    void engine?.interruptGenerate();
  };
  if (opts.signal) {
    if (opts.signal.aborted) {
      void engine.interruptGenerate();
      return;
    }
    opts.signal.addEventListener("abort", onAbort, { once: true });
  }

  let lastTokensPerSec: number | undefined;
  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content ?? "";
      const usage = chunk.usage as
        | { extra?: { decode_tokens_per_s?: number } }
        | undefined;
      const tps = usage?.extra?.decode_tokens_per_s;
      if (typeof tps === "number") lastTokensPerSec = tps;
      if (delta.length > 0) {
        yield { delta, done: false };
      }
    }
    yield { delta: "", done: true, tokensPerSec: lastTokensPerSec };
  } finally {
    if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
  }
}

export async function unloadEngine(): Promise<void> {
  if (engine) {
    try {
      await engine.unload();
    } catch {
      // ignore
    }
  }
  engine = null;
  loadedModelId = null;
}
