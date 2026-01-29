# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npx drizzle-kit push # Push schema changes to SQLite database
```

## Environment Setup

Create `.env.local` with:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

For local models, run Ollama: `ollama serve`

## Architecture Overview

This is a **Next.js 16 App Router** chat application with a hybrid AI backend (Google Gemini + Ollama local models).

### Data Flow

1. **Client** (`src/app/page.tsx`) - Main chat interface using `@ai-sdk/react`'s `useChat` hook
2. **Server Actions** (`src/app/actions.ts`) - Database operations for projects, chats, and messages
3. **API Routes**:
   - `/api/chat` - Streaming LLM responses via Vercel AI SDK's `streamText`
   - `/api/models` - Returns available models (Gemini + local Ollama models)

### Database Layer

- **SQLite** with **Drizzle ORM**
- Schema: `src/db/schema.ts` - Three tables: `projects`, `chats`, `messages`
- DB connection: `src/db/index.ts`
- Schema migrations: `npx drizzle-kit push`

### Component Structure

```
src/components/chat/
├── Sidebar.tsx        # Project/chat navigation
├── ChatHeader.tsx     # Model selector, chat title editing
├── MessagesList.tsx   # Renders chat messages with markdown
├── CodeBlock.tsx      # Syntax-highlighted code blocks with copy button
└── LoadingSkeletons.tsx
```

### AI Provider Selection

In `src/app/api/chat/route.ts`:
- Models starting with `gemini` → Google Generative AI provider
- All other models → Ollama provider (localhost:11434)

### Key Dependencies

- **Vercel AI SDK v6** (`ai@^6.0`, `@ai-sdk/react@^3.0`) - Streaming chat
- **ai-sdk-ollama** - Ollama integration
- **Drizzle ORM** - Type-safe database queries
- **react-markdown** + **remark-gfm** - Markdown rendering
- **next-themes** - Dark/light mode

## AI SDK v6 Implementation Details

### Client-Side (`useChat` hook)

The SDK v6 uses a different API than earlier versions:

```typescript
// Transport handles API communication
const transport = useMemo(() => new DefaultChatTransport({
  api: '/api/chat',
  body: () => ({ model: selectedModelRef.current }), // Use ref to avoid stale closure
}), [])

const { messages, sendMessage, status, setMessages } = useChat({ transport })
```

**Key differences from older SDK:**
- No `input`, `handleInputChange`, `handleSubmit` - manage input state yourself
- No `isLoading` - use `status === 'streaming' || status === 'submitted'`
- Messages use `parts` array instead of `content` string
- Use `sendMessage({ text: input })` to send messages

### Server-Side (`/api/chat`)

```typescript
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

// Client sends UIMessage format, streamText needs ModelMessage format
const modelMessages = await convertToModelMessages(messages as UIMessage[]);

const result = streamText({
  model: selectedModel,
  messages: modelMessages,
});

// Use toUIMessageStreamResponse() for new SDK client
return result.toUIMessageStreamResponse();
```

### Message Format

**UIMessage (client-side):**
```typescript
{ id: string, role: 'user' | 'assistant', parts: [{ type: 'text', text: string }] }
```

**Extract text from UIMessage:**
```typescript
const text = message.parts
  .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
  .map(part => part.text)
  .join('');
```

### Common Gotchas

1. **Stale closure in transport body**: Use a `ref` for dynamic values like selected model
2. **Message format mismatch**: Use `convertToModelMessages()` on the server
3. **Response format**: Use `toUIMessageStreamResponse()` not `toTextStreamResponse()`
4. **Ollama provider**: Use `baseURL` (not `baseUrl`) in `createOllama()`
