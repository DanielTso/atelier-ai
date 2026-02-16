# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Run production server
npm run lint         # Run ESLint
npx drizzle-kit push # Push schema changes to database (local SQLite or remote Turso)
npm test             # Run Vitest unit/integration tests
npm run test:watch   # Run Vitest in watch mode
npm run test:e2e     # Run Playwright E2E tests (starts dev server automatically)
npm run test:all     # Run both Vitest and Playwright
npm run test:coverage # Vitest with coverage
npm run test:e2e:ui  # Playwright with interactive UI
```

Run a single test file:
```bash
npx vitest run tests/unit/lib/utils.test.ts        # Single Vitest file
npx playwright test e2e/chat.spec.ts                # Single Playwright file
npx vitest run tests/unit/api/                      # All tests in a directory
```

Path alias: `@/*` → `./src/*`.

## Environment Setup

Create `.env.local` with:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
DASHSCOPE_API_KEY=your_key_here
```

API keys and Ollama URL can also be configured at runtime via the **Settings dialog** (stored in the `settings` SQLite table). DB values take priority over `.env.local`.

**Note:** `.env*.local` files and `sqlite.db` are gitignored. Never commit secrets or the local database.

Three providers are supported — all optional, the app works with any combination:
- **Google Gemini** (cloud): Requires a Gemini API key
- **Alibaba Cloud Qwen** (cloud): Requires a DashScope API key from [Alibaba Cloud Model Studio](https://modelstudio.console.alibabacloud.com). Uses the US Virginia region endpoint (`dashscope-us.aliyuncs.com`)
- **Ollama** (local): Run `ollama serve` (default port 11434)

### Database (Local vs Vercel/Turso)

The app uses `@libsql/client` + `drizzle-orm/libsql`, which supports both local SQLite files and remote Turso databases. The driver is selected automatically based on environment variables:

- **Local dev** (default): No env vars needed — uses `file:sqlite.db` automatically.
- **Vercel/Production**: Set these env vars (in Vercel dashboard):
  ```
  TURSO_DATABASE_URL=libsql://your-db-name.turso.io
  TURSO_AUTH_TOKEN=your-auth-token
  ```

To push schema to Turso:
```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx drizzle-kit push
```

## Architecture Overview

Atelier AI is a Next.js 16 App Router chat application with hybrid AI backend (Google Gemini cloud + Alibaba Cloud Qwen cloud + Ollama local models). Uses `@libsql/client` for database access — local SQLite (`file:sqlite.db`) in development, remote Turso database on Vercel.

### Data Flow

1. **Client** (`src/app/page.tsx`) — Single-page chat UI using `useChat` from `@ai-sdk/react`. All application state lives here (projects, chats, messages, model selection, attached images). Three main view states: **active chat** (full chat UI with header, messages, input), **project landing page** (two-column layout: chats on left, files panel on right with document cards/progress), **empty state** (centered Atelier AI logo/branding with always-visible input toolbar). Typing in the empty state auto-creates a standalone quick chat on send. Supports multimodal image input — images are sent as `FileUIPart` parts via `sendMessage({ text, files })` and persisted in a `message_attachments` DB table for reload.
2. **Server Actions** (`src/app/actions.ts`) — "use server" functions for all DB reads/writes (CRUD for projects, chats, messages, settings, chat previews).
3. **API Routes**:
   - `POST /api/chat` — Streams LLM responses. Routes to provider based on model name prefix (`gemini` → Google, `qwen` → DashScope, else → Ollama). Applies five-layer context: system prompt → document chunks → semantic retrieval → summary → recent 20 messages. Gemini models have Google Search grounding enabled automatically.
   - `GET /api/models` — Lists available models from all three providers (only includes each provider's models when its API key is configured). Skips Ollama fetch entirely in cloud environments (`isCloudEnvironment()`). Ollama fetch uses 1s timeout. Caches for 5 minutes.
   - `POST /api/summarize` — Compresses older messages into an LLM-generated summary. Auto-triggers at 30+ messages, keeps last 10 in full detail.
   - `POST /api/embed` — Async embedding generation via Ollama `nomic-embed-text` or Gemini `text-embedding-004` (cloud fallback). Called after each message exchange (best-effort).
   - `GET /api/embed` — Returns embedding status (`available`, `provider`, `embeddingCount`) for a chat or project scope.
   - `POST /api/generate-title` — Auto-generates a concise chat title (3-6 words) after the first AI response. Uses the same provider routing as other routes. Best-effort, fires once when message count reaches 2 and title is still "New Chat".
   - `POST /api/extract` — Extracts text from uploaded files (PDF via `unpdf`, DOCX via `mammoth`, text/code via UTF-8) without storing to DB. Used by `ChatInputArea` for text file attachments in chat. Max 10MB, 100K char output limit (truncates if exceeded).
   - `POST /api/documents` — Synchronous document upload + processing. Accepts multipart form (`file` + `projectId`). Extracts text (reuses same logic as `/api/extract`), chunks with sentence-aware overlap (2000 chars/chunk, 400 overlap), embeds each chunk via the Ollama/Gemini pipeline, stores in `document_chunks` table. Returns document record with status.
   - `GET /api/documents` — Lists documents for a project (`?projectId=N`).
   - `DELETE /api/documents` — Deletes a document and its chunks (cascade) (`?id=N`).
   - `POST /api/classify` — LLM-based conversation topic classification. Uses first 10 messages for efficiency, only routes to Gemini or Ollama (not Qwen). Cached per chat in `chatTopics` table.

### Source Layout

- `src/app/page.tsx` — Single-page client; all application state lives here
- `src/app/actions.ts` — Server actions for all DB reads/writes
- `src/app/api/` — API routes (chat, models, embed, summarize, documents, etc.)
- `src/components/chat/` — Chat-specific components (Sidebar, MessagesList, ChatInputArea, ProjectLandingPage, etc.)
- `src/components/ui/` — Reusable UI (dialogs, selectors, command palette)
- `src/components/settings/` — Settings tab components
- `src/hooks/` — Custom hooks (useLocalStorage, usePersonas, useAppearanceSettings, etc.)
- `src/lib/` — Utilities: `settings.ts` (DB-first/env-fallback config), `embeddings.ts` (vector search), `chunking.ts` (document chunker), `fileAttachments.ts` (image/file handling)
- `src/db/` — `schema.ts` (Drizzle schema), `index.ts` (connection)

### Database

SQLite via libSQL (`@libsql/client`) with Drizzle ORM (`drizzle-orm/libsql`). Schema at `src/db/schema.ts`, connection at `src/db/index.ts`. Uses `file:sqlite.db` locally, `TURSO_DATABASE_URL` on Vercel. Drizzle config (`drizzle.config.ts`) uses `dialect: "turso"`.

Ten tables: `projects` → `chats` → `messages` (cascade deletes), `settings` (key-value store), `messageEmbeddings` (vector storage for semantic memory), `documents` (uploaded files per project), `documentChunks` (chunked text with 768-dim embeddings for document RAG), `messageAttachments` (multimodal image/file attachments per message), `personaUsage` (persona/model tracking), `chatTopics` (detected conversation topics). Key chat fields: `archived` (soft delete), `systemPrompt`, `summary`, `summaryUpToMessageId`. Key project fields: `defaultPersonaId`, `defaultModel`. Key document fields: `projectId`, `filename`, `mimeType`, `fileSize`, `charCount`, `chunkCount`, `status` ('processing'|'ready'|'error'), `errorMessage`. Key chunk fields: `documentId`, `projectId`, `chunkIndex`, `content`, `embedding` (nullable JSON 768-dim vector). Key attachment fields: `messageId`, `chatId`, `filename`, `mediaType`, `dataUrl` (base64 data URL), `fileSize`. Settings table: `key` (text PK), `value` (text), `updatedAt` (timestamp).

### State Management

- **Server state**: SQLite via server actions (projects, chats, messages, settings)
- **Server-accessible settings**: API keys, Ollama URL, default model/prompt stored in `settings` table via `src/lib/settings.ts` (DB-first, env-fallback). `isCloudEnvironment()` checks for `TURSO_DATABASE_URL` to skip local-only features (e.g., Ollama fetch in `/api/models`)
- **UI persistence**: `useLocalStorage` hook (sidebar collapse, custom personas, font size, message density). Uses deferred hydration — initializes with default value, reads localStorage in `useEffect` to avoid SSR hydration mismatch
- **Theme**: `next-themes` with class-based dark/light/system switching (configurable in Settings dialog)
- **Refs for closures**: Dynamic values (selectedModel, activeChatId, chats, standaloneChats) use `useRef` to avoid stale closures in `useChat` transport and `onFinish` callback

### Styling

Tailwind CSS v4 with a glassmorphism design system. Key patterns:
- Glass panels: `bg-background/60 backdrop-blur-xl` (defined as `.glass-panel` in `globals.css`)
- Design tokens as CSS custom properties in `globals.css` (HSL format, light/dark variants)
- Animations via Framer Motion (message entrance), CSS keyframes (streaming cursor blink, chunk fade-in), and `SmoothStreamingWrapper` (ResizeObserver height transitions during streaming)
- Radix UI primitives for accessible dialogs, dropdowns, selects, tooltips

### Context Management

The `/api/chat` route builds context using five layers (in order):
1. **System prompt** — Always included, never trimmed
2. **Document retrieval** — If the chat belongs to a project with uploaded documents, finds top-3 similar document chunks (cosine similarity ≥ 0.5) scoped to the project via `findSimilarDocumentChunks()`. Injected as synthetic user/assistant context messages before semantic memory. Lower threshold than messages (0.5 vs 0.7) because document content is more diverse.
3. **Semantic retrieval** — Embeds the latest user message (Ollama `nomic-embed-text` with Gemini `text-embedding-004` cloud fallback, using `'query'` task type), finds top-5 similar past messages (cosine similarity ≥ 0.7) scoped to the current project. Injected as synthetic user/assistant context messages.
4. **Summary** — Compressed older messages (auto-triggers at 30+ messages, keeps last 10 in full)
5. **Recent messages** — Last 20 messages in full detail

All layers degrade gracefully. If both Ollama and Gemini are unavailable, semantic retrieval and document retrieval are silently skipped.

### Google Search Grounding

Gemini models automatically have Google Search enabled via `google.tools.googleSearch({})` passed to `streamText()`. The model decides when to search based on the query. Sources are streamed to the client via `toUIMessageStreamResponse({ sendSources: true })` and rendered as clickable link chips (with globe icon and "SOURCES" label) below assistant messages in `MessagesList`. Source parts have type `source-url` with `sourceId`, `url`, and optional `title`.

### Semantic Memory (Embeddings)

Messages are embedded asynchronously after each exchange via `POST /api/embed`. The pipeline:
1. Client calls `/api/embed` with `{ messageId, chatId, projectId, content }` in the `onFinish` callback
2. Server checks `ensureEmbeddingModel()` — tries Ollama `nomic-embed-text` first, falls back to Gemini `text-embedding-004` if Ollama is unavailable
3. Generates 768-dim float vector via the available provider (Ollama `/api/embeddings` or AI SDK `embed()` with `outputDimensionality: 768`)
4. Stores as JSON-serialized array in `message_embeddings` table

Both providers produce 768-dim vectors, so embeddings from either source are fully cross-compatible for cosine similarity. The `generateEmbedding()` function accepts an optional `taskType` parameter (`'query'` or `'document'`) — Gemini uses this for task-specific optimization (`RETRIEVAL_QUERY` vs `RETRIEVAL_DOCUMENT`); Ollama ignores it.

Retrieval uses brute-force cosine similarity (fast up to ~50K vectors). The `ChatInputArea` toolbar shows a brain icon indicator: green with embedding count and provider name ("Ollama" or "Gemini") when active, gray "Memory off" when neither provider is available.

**Requires at least one of**: `ollama pull nomic-embed-text` (local) or a Gemini API key (cloud fallback).

### Document RAG

Project-scoped document upload and retrieval-augmented generation. Users upload documents via the `ProjectDocumentsDialog` (opened from a `FileText` icon on each project row in the sidebar).

**Upload pipeline** (`POST /api/documents` — synchronous):
1. Accept multipart form (`file` + `projectId`), validate (≤10MB, supported types)
2. Extract text: PDF via `unpdf`, DOCX via `mammoth`, text/code via UTF-8 (reuses same logic as `/api/extract`)
3. Create `documents` record (status: `'processing'`)
4. Chunk text via `chunkText()` from `src/lib/chunking.ts` — 2000 chars/chunk, 400 chars overlap, sentence-boundary aware (breaks at `. `, `.\n`, `! `, `? `, `\n\n` within last 20% of chunk)
5. Save chunks to `document_chunks` table
6. Generate 768-dim embedding for each chunk via `generateEmbedding(content, 'document')` (Ollama/Gemini)
7. Update document status to `'ready'` with `chunkCount`

**Retrieval** (in `/api/chat` route):
- After generating the query embedding, calls `findSimilarDocumentChunks(queryEmbedding, projectId, 3, 0.5)`
- Loads all embedded chunks for the project, computes cosine similarity
- Top-3 chunks above 0.5 threshold injected as `[Relevant information from project documents]` context
- Document context is injected BEFORE semantic message context (documents take priority)

**Supported file types**: PDF, DOCX, TXT, MD, CSV, and common code files.

**UI**: `ProjectDocumentsDialog` (upload/list/delete, opened from sidebar) and `DocumentPreviewDialog` (read-only text preview with chunk overlap deduplication, opened from ProjectLandingPage file cards).

### Multimodal Image Input

Images are sent as `FileUIPart` parts via `sendMessage({ text, files })` and persisted in the `message_attachments` DB table (base64 data URLs). On reload, `loadMessages()` fetches attachments and appends them as `file` parts to UIMessage.

The `/api/chat` route needs no special handling — `convertToModelMessages()` from AI SDK v6 converts `FileUIPart` data URLs into provider-specific formats automatically. Gemini and Qwen have full vision support; Ollama requires multimodal models (llava, bakllava).

## Settings System

### Server Helper (`src/lib/settings.ts`)
```typescript
// DB-first, env-fallback pattern
getGeminiApiKey()        // DB 'gemini-api-key' → env GOOGLE_GENERATIVE_AI_API_KEY
getDashScopeApiKey()     // DB 'dashscope-api-key' → env DASHSCOPE_API_KEY
getOllamaBaseUrl()       // DB 'ollama-base-url' → default 'http://localhost:11434'
getDefaultModel()        // DB 'default-model'
getDefaultSystemPrompt() // DB 'default-system-prompt'
```

### API Route Provider Creation
All API routes (`chat`, `models`, `summarize`, `generate-title`) create providers **per-request** using the settings helper rather than module-level singletons. This allows runtime configuration changes without server restart. Provider routing uses model name prefixes: `gemini` → `@ai-sdk/google`, `qwen` → `@ai-sdk/openai` (DashScope), else → `ai-sdk-ollama`.

### Key UI Behaviors

- **Input toolbar is always visible** — even with no active chat. Sending a message with no chat auto-creates a standalone quick chat.
- **Sidebar collapses** to icon-only mode via `useLocalStorage('sidebar-collapsed', false)`.
- **Project landing page** shows two-column layout (chats left, files/documents right). Documents fetched internally via `GET /api/documents?projectId=N`.
- **Image attachments** via click, clipboard paste (Ctrl+V), or drag-and-drop. Max 10MB. Persisted in `message_attachments` table.

## AI SDK v6 Implementation Details

### Client-Side (`useChat` hook)

```typescript
// Transport with ref-based dynamic body to avoid stale closures
const transport = useMemo(() => new DefaultChatTransport({
  api: '/api/chat',
  body: () => ({ model: selectedModelRef.current }),
}), [])

const { messages, sendMessage, status, setMessages } = useChat({ transport })
```

**SDK v6 differences from older versions:**
- No `input`, `handleInputChange`, `handleSubmit` — manage input state yourself
- No `isLoading` — use `status === 'streaming' || status === 'submitted'`
- Messages use `parts` array, not `content` string
- Send with `sendMessage({ text })`, not form submission

### Server-Side (`/api/chat`)

```typescript
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// UIMessage → ModelMessage conversion required
const modelMessages = await convertToModelMessages(messages as UIMessage[]);

// Gemini models get Google Search grounding via provider-defined tools
const google = createGoogleGenerativeAI({ apiKey });
const googleTools = { google_search: google.tools.googleSearch({}) };

const result = streamText({
  model: selectedModel,
  messages: modelMessages,
  tools: googleTools, // only for Gemini models
});
return result.toUIMessageStreamResponse({ sendSources: true });
```

### Message Format

UIMessage (client-side):
```typescript
// Text-only message
{ id: string, role: 'user' | 'assistant', parts: [{ type: 'text', text: string }] }

// Multimodal message (text + images)
{ id: string, role: 'user', parts: [
  { type: 'text', text: string },
  { type: 'file', mediaType: 'image/png', url: 'data:image/png;base64,...' },
] }
```

Extract text:
```typescript
const text = message.parts
  .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
  .map(part => part.text)
  .join('');
```

Send with images:
```typescript
const fileParts: FileUIPart[] = images.map(img => ({
  type: 'file' as const, mediaType: img.mediaType, url: img.dataUrl,
}))
await sendMessage({ text: userMessage, files: fileParts })
```

### Common Gotchas

1. **Stale closure in transport body**: Use a `ref` for dynamic values like selected model
2. **Message format mismatch**: Use `convertToModelMessages()` on the server
3. **Response format**: Use `toUIMessageStreamResponse({ sendSources: true })` to include Google Search source URLs in the stream
4. **Ollama provider**: Use `baseURL` (not `baseUrl`) in `createOllama()`
5. **libSQL client**: Uses `@libsql/client` (not `better-sqlite3`) — bundles natively in serverless, no `serverExternalPackages` needed
6. **Google Search tool name**: Must be exactly `google_search` in the `tools` object — this is a provider requirement
7. **AI SDK v6 naming**: Use `maxOutputTokens` (not `maxTokens`) in `generateText()`/`streamText()` options
8. **Source parts**: Google Search grounding sends `source-url` parts in `message.parts[]` alongside `text` parts. Deduplicate by URL before rendering.
9. **DashScope provider**: Uses `@ai-sdk/openai` with `createOpenAI({ baseURL: 'https://dashscope-us.aliyuncs.com/compatible-mode/v1', apiKey })`. Must use `.chat(modelName)` (not `provider(modelName)`) to hit the Chat Completions endpoint — the default Responses API (`/responses`) is not supported by DashScope.
10. **Qwen model prefix**: Use `startsWith('qwen')` (not `startsWith('qwen-')`) to match both `qwen-flash`/`qwen-plus` and `qwen3-max`/`qwen3-coder-plus` naming patterns.
11. **DashScope regions**: API keys are region-specific. The hardcoded base URL uses US Virginia (`dashscope-us.aliyuncs.com`). Singapore uses `dashscope-intl.aliyuncs.com`, Beijing uses `dashscope.aliyuncs.com` — keys are not interchangeable between regions.
12. **Multimodal images**: Use `sendMessage({ text, files: FileUIPart[] })` on the client — `convertToModelMessages()` on the server handles `FileUIPart` (data URL → inline base64) automatically. No server route changes needed. Image attachments are persisted in `message_attachments` table and reloaded as `file` parts in the UIMessage `parts` array.

## Testing

### Vitest (Unit + Integration)

Config: `vitest.config.ts`. Tests in `tests/`. Node environment by default; hook tests use `// @vitest-environment jsdom` per-file.

**Test structure:**
- `tests/unit/lib/` — Utility tests (`cn()`, `formatMessageTime`, `formatFullTime`)
- `tests/unit/actions/` — Server action tests (projects, chats, messages, context). Use in-memory SQLite via `tests/helpers/test-db.ts`
- `tests/unit/api/` — API route tests (models, chat, summarize, generate-title). Mock AI SDK providers
- `tests/hooks/` — React hook tests (`useLocalStorage`, `usePersonas`, `useCollapseState`). jsdom environment

**In-memory SQLite pattern:**
```typescript
import { createTestDb, testDb } from '../../helpers/test-db'

vi.mock('@/db', () => ({
  get db() { return testDb },
}))

beforeEach(async () => { await createTestDb() }) // Fresh DB per test (async — uses @libsql/client)
```

**API route tests** require `vi.resetModules()` + `vi.doMock()` + dynamic `import()` to re-register mocks after module reset. Must mock `@/lib/settings`, `@/lib/embeddings`, and AI SDK providers alongside `@/db`. The `@ai-sdk/google` mock must include `tools.googleSearch` on the provider function for the chat route's grounding support.

### Playwright (E2E)

Config: `playwright.config.ts`. Tests in `e2e/`. Chromium only. Auto-starts dev server via `webServer` config.

**Key behaviors:**
- Textarea is always enabled — sending a message with no active chat auto-creates a standalone quick chat
- Command palette opens with `Control+k` (not `Meta+k` on Linux), closes with `Control+k` toggle or backdrop click
- The `CommandPalette` component renders a plain `div`, not a `dialog` element — locate by content (e.g., `getByPlaceholder('Type a command or search...')`)

## Deployment (Vercel + Turso)

Production is deployed on **Vercel** at [atelier-ai.vercel.app](https://atelier-ai.vercel.app). GitHub repo: [DanielTso/atelier-ai](https://github.com/DanielTso/atelier-ai). The Vercel project has these environment variables:
- `TURSO_DATABASE_URL` — libSQL connection URL (e.g., `libsql://your-db.turso.io`)
- `TURSO_AUTH_TOKEN` — Turso database auth token
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key
- `DASHSCOPE_API_KEY` — Alibaba Cloud DashScope API key (for Qwen models)

Deploy with `vercel --prod`. Schema changes must be pushed to Turso separately:
```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx drizzle-kit push
```

## CI (GitHub Actions)

Workflow: `.github/workflows/ci.yml` — runs on push to `master` and on PRs.

**Pipeline** (single job, `ubuntu-latest`, Node 22):
1. `npm run lint` — ESLint
2. `npm run build` — Next.js production build (catches TypeScript errors)
3. `npm test` — Vitest unit/integration tests (in-memory SQLite, no secrets needed)
4. `npm run test:e2e` — Playwright E2E tests (auto-starts dev server, Chromium only)

No secrets required — all tests mock AI providers and use in-memory DB. Playwright report uploaded as artifact (14-day retention).

## Chat Logs

Development session logs are stored in `docs/chatlog-*.md`. Before compacting context or ending a long session, update the relevant chat log with decisions made and work completed, then commit and push.
