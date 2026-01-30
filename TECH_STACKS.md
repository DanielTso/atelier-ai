# Implemented Tech Stack

This document outlines the final technology choices used in the "Glassmorphic Local AI Chat" application.

## Core Framework
*   **Next.js 16 (App Router):** Chosen for its robust server-side rendering, API route capabilities, and seamless integration with Vercel AI SDK.
*   **TypeScript:** Used throughout for type safety and developer productivity.

## User Interface (UI)
*   **Tailwind CSS v4:** For utility-first styling and easy implementation of the "Glassmorphism" aesthetic.
*   **Lucide React:** For lightweight, consistent iconography.
*   **Next-Themes:** For reliable Dark/Light mode switching (also used in Settings Appearance tab).
*   **React Markdown:** To render AI responses with proper formatting (code blocks, bold text, etc.).
*   **Radix UI:** Headless UI primitives for accessible components.
    *   `@radix-ui/react-dropdown-menu` - Context menus with nested submenus
    *   `@radix-ui/react-dialog` - Modal dialogs (delete confirm, rename, system prompt, settings)
    *   `@radix-ui/react-select` - Accessible select dropdowns (model selector in settings)
    *   `@radix-ui/react-tooltip` - Tooltips for message timestamps and collapsed sidebar icons
*   **Framer Motion:** For smooth message animations and transitions.

## AI & Streaming
*   **Vercel AI SDK v6 (`ai@^6.0`, `@ai-sdk/react@^3.0`):** A powerful library for handling streaming responses from LLMs. Upgraded to v6 for latest features.
    *   Uses `DefaultChatTransport` for API communication
    *   Uses `UIMessage` format with `parts` array (not `content` string)
    *   Server uses `convertToModelMessages()` and `toUIMessageStreamResponse()`
*   **Ollama AI Provider (`ai-sdk-ollama`):** For connecting to locally hosted models (Llama 3, Mistral, Qwen, etc.).
*   **Google Generative AI SDK (`@ai-sdk/google`):** For integrating Gemini cloud models (Gemini 3, Gemini 2.5, etc.).

## Data Persistence
*   **SQLite (better-sqlite3):** A high-performance, serverless SQL database perfect for local, private data storage.
*   **Drizzle ORM:** A lightweight, type-safe ORM for interacting with the SQLite database.

## Settings & Configuration
*   **Hybrid storage strategy:**
    *   **Server-accessible settings** (API keys, provider URLs, default model/prompt) → SQLite `settings` key-value table with DB-first / environment variable fallback.
    *   **Client-only preferences** (theme, font size, message density, sidebar collapse state) → `localStorage` via `useLocalStorage` hook.
*   **Per-request provider creation:** API routes dynamically create Google/Ollama providers per request using DB-stored settings, replacing module-level singletons. Enables runtime configuration changes without server restart.
*   **Collapsible sidebar:** Icon-only strip with Radix tooltips when collapsed, full navigation when expanded. State persisted in localStorage.

## Deployment / Runtime
*   **Node.js:** The runtime environment.
*   **Localhost:** Primarily designed to run locally on the user's machine to ensure data privacy and access to local Ollama instances.