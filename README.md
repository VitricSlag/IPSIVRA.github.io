# IPSIVRA — sovereign AI

> _ipse_ (Latin): *self, oneself.* The model lives on your device. Conversations live in your browser. Nothing leaves.

IPSIVRA is a local-first AI chat app. The LLM runs entirely in your browser via
WebGPU using [`@mlc-ai/web-llm`](https://github.com/mlc-ai/web-llm); messages
are persisted to IndexedDB. There is no backend, no telemetry, no auth, no
analytics. After the model weights are cached on first run, the app works
fully offline.

This isn't a wrapper around someone else's API. It is the model, on your GPU,
typing back at you.

## What you get

- Streaming chat with multiple models (default: **Phi-3.5 Mini Instruct**;
  also Gemma 2 2B, Qwen 2.5 7B, Llama 3.1 8B).
- Per-conversation system prompts.
- IndexedDB-backed conversation history (Dexie).
- Markdown + syntax-highlighted code blocks (highlight.js).
- WebGPU detection with a clear fallback if your browser cannot run it.
- Live tokens-per-second readout, abortable generation, mobile drawer.
- Dark by default, sober monospace identity for technical surfaces.

## Run locally

Requires Node 20+ and a WebGPU-capable browser (Chrome/Edge 113+, Safari 18+,
or Firefox Nightly with WebGPU enabled). Default model needs ~3 GB of free
VRAM and ~4 GB of free RAM during generation.

```bash
npm install
npm run dev
```

Open the URL Vite prints. On first launch, pick a model — the weights download
from the HuggingFace MLC mirror and are cached in your browser. Subsequent
loads work offline.

## Build & deploy your own fork

The site is configured for GitHub Pages at `/ipsivra/`. To deploy your own
fork:

1. Fork this repo.
2. If your repo isn't named `ipsivra`, edit `vite.config.ts` and set `base`
   to match your repo path (e.g. `/my-fork/`).
3. In repo settings, set **Pages → Source** to **GitHub Actions**.
4. Push to `main`. The workflow at `.github/workflows/deploy.yml` builds and
   publishes via `actions/upload-pages-artifact` + `actions/deploy-pages`.

```bash
npm run build       # produces dist/
npm run preview     # preview the production build locally
```

## Browser requirements

| Browser | Minimum | Notes |
|---|---|---|
| Chrome / Edge | 113 | Desktop only for stable WebGPU |
| Safari | 18 | macOS Sequoia / iOS 18 |
| Firefox | Nightly | enable `dom.webgpu.enabled` |

If `navigator.gpu` is missing, IPSIVRA shows a gate screen with links rather
than failing silently.

## Privacy posture

- No network calls except to fetch model weights from HuggingFace on first load.
- No analytics, no telemetry, no cookies, no auth.
- Conversations are stored in IndexedDB on your device; clearing site data
  deletes them.
- The system prompt makes the assistant aware it has no internet access — it
  is a local oracle, not a tool-using agent (yet).

## Architecture

```
src/
  components/
    ChatView.tsx          message list + composer
    Message.tsx           markdown + code highlighting (lazy-loaded)
    ModelPicker.tsx       model dropdown + download progress
    Sidebar.tsx           conversation list, drawer on mobile
    StatsBar.tsx          model · tokens/sec · message count
    SystemPromptEditor.tsx
    WebGPUGate.tsx        fallback when navigator.gpu is missing
  hooks/
    useEngine.ts          load + stream + abort, with InitProgress events
    useConversations.ts   Dexie-backed CRUD + live messages
  lib/
    llm.ts                WebLLM wrapper (engine is dynamically imported)
    db.ts                 Dexie schema
    types.ts              shared types + model catalog
    tools/                stub for future agentic tools (function calling, RAG)
  App.tsx
  main.tsx
```

The engine wrapper exposes `loadModel`, `generate(...)` (async generator), and
`unloadEngine`. To extend with tool use, vector memory, or RAG, drop modules
into `src/lib/tools/` and wire them through the generator in `lib/llm.ts`.
WebLLM itself is dynamically imported so the initial JS shell stays under
~100 KB gzipped — you don't pay for the runtime until you load a model.

## Roadmap (out of scope for the MVP)

- Function calling / tool use (`lib/tools/`).
- Local vector memory for long-term context.
- RAG over user-supplied files (PDFs, markdown).
- Per-conversation generation params (temperature, top_p).
- Export / import conversations as JSON.

## License

MIT.
