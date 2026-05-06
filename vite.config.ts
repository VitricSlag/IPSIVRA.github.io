import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "/IPSIVRA.github.io/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    sourcemap: false,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@mlc-ai/web-llm")) return "webllm";
            if (id.includes("highlight.js")) return "hljs";
            if (id.includes("react-markdown") || id.includes("remark-")
                || id.includes("micromark") || id.includes("mdast")
                || id.includes("hast") || id.includes("unified")
                || id.includes("unist") || id.includes("vfile")
                || id.includes("decode-named-character-reference")
                || id.includes("character-entities")) {
              return "markdown";
            }
            if (id.includes("dexie")) return "dexie";
            if (id.includes("react") || id.includes("scheduler")) {
              return "react";
            }
          }
          return undefined;
        },
      },
    },
  },
  worker: {
    format: "es",
  },
});
