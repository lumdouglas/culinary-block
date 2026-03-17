---
name: ai-sdk
description: 'Answer questions about the AI SDK and help build AI-powered features. Use when developers: (1) Ask about AI SDK functions like generateText, streamText, ToolLoopAgent, embed, or tools, (2) Want to build AI agents, chatbots, RAG systems, or text generation features, (3) Have questions about AI providers (OpenAI, Anthropic, Google, etc.), streaming, tool calling, structured output, or embeddings, (4) Use React hooks like useChat or useCompletion. Triggers on: "AI SDK", "Vercel AI SDK", "generateText", "streamText", "add AI to my app", "build an agent", "tool calling", "structured output", "useChat".'
---

## This Project — Existing AI Features

Before building anything new, check these files:

| File | Status | Notes |
|------|--------|-------|
| `app/api/chat/route.ts` | Partial — exists, not wired to UI | Main chat API route |
| `components/shared/chat-assistant.tsx` | Partial — not rendered on any page | Chat UI component |
| `growth-engine/` | Partial — autonomous agent scaffolding | Uses `@ai-sdk/google` + `ai` |

**Default provider:** `@ai-sdk/google` is already installed. Use Google AI unless user specifies otherwise.  
Import: `import { google } from '@ai-sdk/google'`

**Packages already in `package.json`:**
- `ai@^6.0.70` — Vercel AI SDK core
- `@ai-sdk/google@^3.0.21` — Google AI provider
- `@ai-sdk/react@^3.0.72` — React hooks (`useChat`, `useCompletion`)

---

## Prerequisites

Before searching docs, check if `node_modules/ai/docs/` exists. If not, install only the `ai` package: `npm install ai`.

Do not install other packages at this stage.

## Critical: Do Not Trust Internal Knowledge

Everything you know about the AI SDK is outdated or wrong. Your training data contains obsolete APIs, deprecated patterns, and incorrect usage.

**When working with the AI SDK:**

1. Ensure `ai` package is installed (see Prerequisites)
2. Search `node_modules/ai/docs/` and `node_modules/ai/src/` for current APIs
3. If not found locally, search ai-sdk.dev documentation (instructions below)
4. Never rely on memory — always verify against source code or docs
5. **`useChat` has changed significantly** — check `node_modules/ai/docs/` for the current API before writing client code
6. **Always fetch current model IDs** — run `curl -s https://ai-gateway.vercel.sh/v1/models | jq -r '[.data[] | select(.id | startswith("google/")) | .id] | reverse | .[]'` to get newest Google models first
7. Run typecheck after changes: `npm run build` or `tsc --noEmit`
8. **Be minimal** — only specify options that differ from defaults

If you cannot find documentation to support your answer, state that explicitly.

## Finding Documentation

### ai@6.0.34+

Search bundled docs and source in `node_modules/ai/`:

- **Docs**: `grep "query" node_modules/ai/docs/`
- **Source**: `grep "query" node_modules/ai/src/`

Provider packages include docs at `node_modules/@ai-sdk/<provider>/docs/`.

### Earlier versions

1. Search: `https://ai-sdk.dev/api/search-docs?q=your_query`
2. Fetch `.md` URLs from results (e.g., `https://ai-sdk.dev/docs/agents/building-agents.md`)

## When Typecheck Fails

Search `node_modules/ai/src/` and `node_modules/ai/docs/` for the failing property or function name. Many type errors are caused by deprecated APIs (e.g., `parameters` renamed to `inputSchema`).

## Building and Consuming Agents

### Creating Agents

Always use the `ToolLoopAgent` pattern. Search `node_modules/ai/docs/` for current agent creation APIs.

**Type Safety**: When consuming agents with `useChat`, always use `InferAgentUIMessage<typeof agent>` for type-safe tool results.

### Consuming Agents in Next.js App Router

1. Streaming route: use `app/api/chat/route.ts` as the entry point
2. Client UI: use `useChat` from `@ai-sdk/react` in a `'use client'` component
3. Never call streaming APIs directly from server components — stream from the API route

## References

- https://ai-sdk.dev/docs — Official AI SDK documentation
- `node_modules/ai/docs/` — Bundled docs (most current for installed version)
- `node_modules/@ai-sdk/google/docs/` — Google provider docs