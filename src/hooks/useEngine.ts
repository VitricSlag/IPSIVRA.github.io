import { useCallback, useEffect, useRef, useState } from "react";
import {
  currentModelId,
  generate,
  isWebGPUSupported,
  loadModel,
} from "@/lib/llm";
import type { EngineStatus, InitProgress, Role } from "@/lib/types";

interface StreamCallbacks {
  onDelta: (delta: string) => void;
  onDone: (info: { tokensPerSec?: number }) => void;
  onError: (err: Error) => void;
}

export interface UseEngineApi {
  status: EngineStatus;
  webgpuSupported: boolean;
  load: (modelId: string) => Promise<void>;
  stream: (
    modelId: string,
    messages: { role: Role; content: string }[],
    cb: StreamCallbacks,
  ) => void;
  abort: () => void;
  isGenerating: boolean;
}

export function useEngine(): UseEngineApi {
  const [status, setStatus] = useState<EngineStatus>(() => {
    const id = currentModelId();
    return id ? { kind: "ready", modelId: id } : { kind: "idle" };
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [webgpuSupported] = useState<boolean>(() => isWebGPUSupported());
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (modelId: string): Promise<void> => {
    setStatus({
      kind: "loading",
      modelId,
      progress: { text: "Initializing…", progress: 0, timeElapsed: 0 },
    });
    const onProgress = (progress: InitProgress) => {
      setStatus({ kind: "loading", modelId, progress });
    };
    try {
      await loadModel({ modelId, onProgress });
      setStatus({ kind: "ready", modelId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ kind: "error", modelId, message });
      throw err;
    }
  }, []);

  const stream = useCallback(
    (
      modelId: string,
      messages: { role: Role; content: string }[],
      cb: StreamCallbacks,
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);

      void (async () => {
        try {
          for await (const chunk of generate({
            modelId,
            messages,
            signal: controller.signal,
          })) {
            if (chunk.done) {
              cb.onDone({ tokensPerSec: chunk.tokensPerSec });
            } else if (chunk.delta) {
              cb.onDelta(chunk.delta);
            }
          }
        } catch (err) {
          if (controller.signal.aborted) {
            cb.onDone({});
          } else {
            cb.onError(err instanceof Error ? err : new Error(String(err)));
          }
        } finally {
          setIsGenerating(false);
          abortRef.current = null;
        }
      })();
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { status, webgpuSupported, load, stream, abort, isGenerating };
}
