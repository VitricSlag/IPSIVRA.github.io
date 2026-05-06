export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  content: string;
  createdAt: number;
  tokensPerSec?: number;
}

export interface Conversation {
  id: string;
  title: string;
  systemPrompt: string;
  modelId: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelOption {
  id: string;
  label: string;
  approxSizeGB: number;
  notes?: string;
}

export interface InitProgress {
  text: string;
  progress: number;
  timeElapsed: number;
}

export type EngineStatus =
  | { kind: "idle" }
  | { kind: "loading"; modelId: string; progress: InitProgress }
  | { kind: "ready"; modelId: string }
  | { kind: "error"; modelId: string; message: string };

export interface GenerateChunk {
  delta: string;
  done: boolean;
  tokensPerSec?: number;
}

export const DEFAULT_MODEL_ID = "Phi-3.5-mini-instruct-q4f16_1-MLC";

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    label: "Phi-3.5 Mini Instruct",
    approxSizeGB: 2.2,
    notes: "Fast default. ~2.2 GB download, ~3 GB VRAM.",
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    label: "Gemma 2 2B IT",
    approxSizeGB: 1.7,
    notes: "Smallest option. ~1.7 GB download.",
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
    label: "Qwen 2.5 7B Instruct",
    approxSizeGB: 4.5,
    notes: "Stronger. ~4.5 GB download, ~6 GB VRAM.",
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    label: "Llama 3.1 8B Instruct",
    approxSizeGB: 4.8,
    notes: "Highest quality. ~4.8 GB download, ~7 GB VRAM.",
  },
];

export const DEFAULT_SYSTEM_PROMPT =
  "You are IPSIVRA — a sovereign AI running entirely on the user's device. Be precise, technical, and concise. Use markdown for code. Never claim to access the internet or external services.";
