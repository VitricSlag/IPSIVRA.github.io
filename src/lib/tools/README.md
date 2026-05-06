# lib/tools — extension point

Reserved for future agentic tool implementations (function calling, RAG, vector
memory). Each tool should export a JSON-schema spec and a local handler so the
engine wrapper in `../llm.ts` can dispatch tool calls without ever leaving the
device.

Suggested shape:

```ts
export interface Tool<Args, Result> {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  run(args: Args): Promise<Result>;
}
```
