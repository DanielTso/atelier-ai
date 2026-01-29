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

- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/google`) - Streaming chat
- **ai-sdk-ollama** - Ollama integration
- **Drizzle ORM** - Type-safe database queries
- **react-markdown** + **remark-gfm** - Markdown rendering
- **next-themes** - Dark/light mode
