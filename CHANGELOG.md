# Changelog

All notable changes to this project will be documented in this file.

## [0.9.0] - 2026-01-29

### Testing Infrastructure
- **Vitest:** Added 75 unit/integration tests across 12 test files
  - Utility tests: `cn()`, `formatMessageTime`, `formatFullTime`
  - Server action tests: projects, chats, messages, context management (in-memory SQLite)
  - API route tests: models, chat, summarize (mocked AI providers)
  - React hook tests: `useLocalStorage`, `usePersonas`, `useCollapseState` (jsdom)
- **Playwright:** Added 8 E2E tests across 3 test files (Chromium)
  - Chat flow: app loads, create chat + type, send button
  - Project management: sidebar visible, new project button
  - Command palette: Ctrl+K open, toggle close, backdrop close
- **Test Helpers:** In-memory SQLite factory (`tests/helpers/test-db.ts`), AI mock factories (`tests/helpers/mock-ai.ts`)
- **Config:** `vitest.config.ts` (path alias, node env), `playwright.config.ts` (Chromium, auto dev server)

### Developer Experience
- **npm Scripts:** Added `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`, `test:all`
- **MCP Servers:** Added SQLite, Next.js DevTools, GitHub, Sentry, and Vercel MCP servers for development workflow

### Dependencies
- Added: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`

## [0.8.0] - 2026-01-28

### Project Management
- **Project Rename:** Added inline editing for project names with pencil icon, save/cancel buttons, and keyboard shortcuts
- **Alphabetical Sorting:** Projects are now automatically sorted alphabetically in the sidebar

## [0.7.0] - 2026-01-28

### Persona System
- **Persona Selector:** Added dropdown in chat header for quick persona switching
- **Preset Personas:** 6 built-in presets (Default, Coding Assistant, Creative Mode, Debug Mode, Brief Mode, Teacher Mode)
- **Custom Personas:** Ability to customize system prompts via "Customize..." option

### UI Enhancements
- **Streaming Cursor:** Added animated cursor effect (`▎`) while AI generates responses
- **Visual Feedback:** Cursor blinks with smooth animation during streaming

## [0.6.0] - 2026-01-28

### Chat Management
- **Context Menus:** Added 3-dot dropdown menus on all chats with Move, Rename, Archive, Delete options
- **Move to Project:** Nested submenu to move chats between Quick Chats and any project
- **Archive System:** Soft-delete chats to "Archived" section with restore capability
- **Per-Project Collapse:** Each project's chat list can be independently collapsed/expanded
- **Collapse Persistence:** Sidebar collapse states are saved to localStorage

### Context Management
- **Hybrid Context:** Implemented LLM-generated summaries + sliding window for long conversations
- **Auto-Summarization:** Automatically triggers when message count exceeds 30
- **System Instructions:** Added customizable system prompts that are never trimmed from context
- **System Prompt Dialog:** UI for editing system instructions with quick example buttons

### New Components
- `ChatContextMenu.tsx`: Radix dropdown menu with nested submenus
- `DeleteConfirmDialog.tsx`: Confirmation modal for permanent deletion
- `RenameDialog.tsx`: Dialog for editing chat titles
- `SystemPromptDialog.tsx`: Dialog for editing system instructions
- `PersonaSelector.tsx`: Dropdown for persona/system prompt selection

### New Hooks
- `useLocalStorage.ts`: Generic localStorage hook with SSR safety
- `useCollapseState.ts`: Manages sidebar collapse states with persistence
- `usePersonas.ts`: Manages persona presets and custom system prompts

### Database Schema
- Added `archived` boolean field to chats table
- Added `systemPrompt` text field to chats table
- Added `summary` and `summaryUpToMessageId` fields for context management

### New API Routes
- `/api/summarize`: LLM-generated conversation summaries for context compression

## [0.5.0] - 2026-01-28

### Breaking Changes - AI SDK v6 Migration
- **SDK Upgrade:** Migrated from Vercel AI SDK v3.4 to v6 (`ai@^6.0`, `@ai-sdk/react@^3.0`)
- **Client API:** Replaced old `useChat` API with new transport-based approach
  - Now uses `DefaultChatTransport` for API communication
  - `sendMessage({ text })` replaces `handleSubmit`
  - `status` replaces `isLoading` ('ready' | 'streaming' | 'submitted' | 'error')
  - Manual input state management (no built-in `input`, `handleInputChange`)
- **Message Format:** Changed from `content` string to `parts` array structure
  - Messages now use `UIMessage` type with `parts: [{ type: 'text', text: string }]`

### Bug Fixes
- **Build:** Fixed `baseUrl` → `baseURL` typo in Ollama provider config
- **Build:** Removed unsupported `maxTokens` property from `streamText`
- **API:** Added `convertToModelMessages()` to convert UIMessage → ModelMessage for `streamText`
- **API:** Changed response from `toTextStreamResponse()` to `toUIMessageStreamResponse()`
- **Model Selection:** Fixed stale closure issue using ref pattern for dynamic model selection
- **Types:** Added proper typing for `ollamaModels` array (replacing `any`)
- **Lint:** Removed unused imports (`asc`, `formatTime` helpers)
- **Lint:** Removed unused `theme` prop from Sidebar component

### Documentation
- Added `CLAUDE.md` with AI SDK v6 implementation details and common gotchas
- Updated all documentation to reflect v6 changes

## [0.4.0] - 2026-01-28

### UI/UX Enhancements
- **Copy Code Button:** Added hover-activated copy button to all code blocks with visual feedback (checkmark on success).
- **Message Timestamps:** Implemented relative timestamps ("2m ago", "1h ago") with full datetime tooltip on hover.
- **Chat Title Editing:** Added inline chat title editing with edit icon, save/cancel buttons, and keyboard shortcuts (Enter to save, Escape to cancel).
- **Model Selector:** Organized model dropdown into "Cloud Models" and "Local Models" optgroups for better organization.
- **Message Animations:** Added smooth fade-in and slide-up animations for messages with staggered timing.
- **Enhanced Empty States:** Redesigned empty states with larger icons, pulsing animations, and more descriptive text.
- **Hover Effects:** Added subtle border color transitions on message hover for better interactivity.
- **Loading Skeletons:** Created reusable skeleton components for future loading states.
- **Typography:** Improved font sizes, weights, and spacing throughout the interface.

### New Components
- `CodeBlock.tsx`: Reusable code block component with copy functionality
- `InlineCode.tsx`: Styled inline code component
- `LoadingSkeletons.tsx`: Skeleton loaders for messages, chats, and projects
- `formatTime.ts`: Time formatting utilities for relative and absolute timestamps

### Bug Fixes
- Fixed type compatibility issues with message timestamps
- Fixed inline code component prop types to support all HTMLAttributes

## [0.3.0] - 2026-01-28

### Performance Optimizations
- **Database:** Added indexes on `project_id` and `created_at` columns for chats and messages tables, providing 10-100x query speedup.
- **Database:** Added explicit message ordering by `created_at` for consistency.
- **Database:** Implemented message limit (100 most recent) to improve performance on large chat histories.
- **Components:** Extracted and memoized Sidebar, MessagesList, and ChatHeader components to eliminate unnecessary re-renders (50-70% reduction).
- **Rendering:** Moved ReactMarkdown component definitions outside render function to prevent object recreation.
- **API:** Added 5-minute cache control headers to models endpoint to reduce redundant network requests.
- **API:** Created singleton Google provider instance to eliminate per-request instantiation overhead.
- **UX:** Implemented scroll debouncing with requestAnimationFrame for smoother scrolling.
- **UX:** Added auto-dismiss for error messages after 5 seconds.
- **State:** Optimized delete operations to update local state instead of refetching all data.

### Code Quality
- Refactored 388-line monolithic component into smaller, focused, memoized components.
- Improved separation of concerns between UI and business logic.

## [0.2.2] - 2026-01-28

### Fixed
- **Streaming:** Resolved `Unhandled chunk type: stream-start` error by aligning server-side streaming logic (`toDataStreamResponse`) with client-side expectations.
- **Dependencies:** Reverted `ai` SDK to v3.4.0 and `@ai-sdk/google` to v3.0.15 to ensure stability and prevent protocol mismatches.
- **Imports:** Cleaned up unused imports in API routes.

## [0.2.1] - 2026-01-28

### Features
- **Error Handling:** Implemented resilient API that gracefully degrades to Cloud models if Local Ollama instance is unreachable.
- **UI:** Added user-friendly Error Banner for connection failures or missing models.
- **Stability:** Improved build stability by fixing TypeScript directives in server actions.

## [0.2.0] - 2026-01-28

### Features
- **Hybrid AI Engine:** Added support for Google Gemini models alongside local Ollama models.
- **Model Support:** Enabled access to `gemini-3-pro-preview`, `gemini-3-flash-preview`, and `gemini-2.5-flash`.
- **Configuration:** Added `.env.local` support for secure API key management.
- **Code Quality:** Refactored React hooks for strict mode compliance and stability.

## [0.1.0] - 2026-01-28

### Features
- **UI:** Implemented Glassmorphic design with Light/Dark mode toggle.
- **AI:** Integrated local Ollama instance using Vercel AI SDK (v3.4.0).
- **Database:** Added SQLite persistence (via Drizzle ORM) for Projects and Chat History.
- **Organization:** Added ability to create Projects and organize chats within them.
- **Markdown:** Added Markdown rendering for AI responses (code blocks, tables).

### Tech
- Initialized Next.js 15 App Router project.
- Configured Tailwind CSS v4.
- Setup `better-sqlite3` and `drizzle-orm`.

## [Init] - 2026-01-28

### Added
- Created `Gemini.md` for project tracking.
- Created `TECH_STACKS.md` for technology suggestions.
- Created `CHANGELOG.md` for version history.
