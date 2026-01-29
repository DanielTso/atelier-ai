# Project Plan: Glassmorphic Local AI Chat

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (with `backdrop-blur` for Glassmorphism)
- **Icons:** Lucide React
- **AI Integration:** Vercel AI SDK (Ollama Provider) or direct Fetch
- **Database:** SQLite (via `better-sqlite3` and `drizzle-orm` for type safety and speed)
- **Theme:** `next-themes` for Dark/Light mode

## Hardware Context
- **GPU:** AMD 6650XT (8GB)
- **RAM:** 32GB
- **Recommended Models:**
    - **General:** `llama3` (8B) or `mistral` (7B) - Fast, fits in VRAM.
    - **Coding:** `deepseek-coder` (6.7B or similar).
    - **Vision:** `llava` (7B or 13B) - Fits in 8GB (just barely for 13B, 7B is safe).

## Phases

### Phase 1: Initialization & UI Scaffold
**Goal:** A running Next.js app with the basic visual structure (Sidebar + Chat Area) and Theme switching.
- [x] Initialize Next.js project.
- [x] Install dependencies (`lucide-react`, `next-themes`, `clsx`, `tailwind-merge`).
- [x] Configure Tailwind for Glassmorphism (extend colors, background images).
- [x] Create Layout: Sidebar (Projects/History) + Main (Chat).
- [x] Implement Dark/Light mode toggle.
- [x] **Test:** App starts, Theme toggle works, responsive layout.

### Phase 2: Ollama Integration
**Goal:** Chat with the local LLM.
- [x] Install `ai` SDK and `ollama-ai-provider` (or create custom API route).
- [x] Create `api/chat` route for streaming responses.
- [x] Create `api/models` route to fetch installed models from Ollama (`GET /api/tags`).
- [x] Implement `ChatInterface` component with Input and Message list.
- [x] Implement Model Selector (Dropdown).
- [x] **Test:** Can select a model, send a message, and receive a streaming response.

### Phase 3: Data Persistence (SQLite)
**Goal:** Save Projects and Chat History.
- [x] Set up `drizzle-orm` and `better-sqlite3`.
- [x] Define Schema: `Project` (id, name, icon), `Chat` (id, projectId, title), `Message` (id, chatId, role, content).
- [x] Create Server Actions or API routes for CRUD operations.
- [x] Connect UI: Create Project -> New Chat -> Save Messages.
- [x] **Test:** Data persists across restarts. "Folders" (Projects) organize chats correctly.

### Phase 4: Polish & Refinement
**Goal:** Beautiful Glassmorphism and specialized features.
- [x] Enhance UI: Add nice background gradients/blobs to emphasize glass effect.
- [x] Markdown support for AI responses (Code blocks with syntax highlighting).
- [x] Error handling (Ollama not running, model not found).
- [x] **Test:** Full end-to-end usage flow. Verified DB persistence via script.

## Next Step
User Manual Acceptance Testing.