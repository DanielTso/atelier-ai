# Glassmorphic Local AI Chat

A beautiful, local-first AI chat interface built with Next.js, Tailwind CSS, and Ollama, now featuring hybrid support for Google Gemini models.

## Features
- **Hybrid AI:** Seamlessly switch between local models (Ollama) and cloud models (Google Gemini).
- **Privacy:** Chats are stored locally in a SQLite database (`sqlite.db`).
- **Organization:** Group chats into Projects with rename and alphabetical sorting.
- **Chat Management:** Context menus for move, rename, archive, and delete operations.
- **Persona System:** Quick persona switching with 6 built-in presets and custom system prompts.
- **Context Management:** Hybrid summarization for long conversations (auto-triggers at 30+ messages).
- **Archive System:** Soft-delete chats with restore capability.
- **UI:** Modern Glassmorphism design with Dark/Light mode.
- **Streaming Cursor:** Animated cursor effect while AI generates responses.
- **Markdown:** Renders code blocks and formatted text with copy button.

## Prerequisites
1.  **Ollama** (Optional): For local models, install and run `ollama serve`.
2.  **Google Gemini API Key** (Optional): For cloud models.
3.  **Node.js**: v18 or higher.

## Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Configure Environment:
    Create a `.env.local` file in the root directory:
    ```bash
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
    ```
3.  Initialize the database:
    ```bash
    npx drizzle-kit push
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test             # Run unit/integration tests (Vitest)
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Run E2E tests (Playwright + Chromium)
npm run test:all     # Run all tests
```

- **Vitest:** 75 unit/integration tests covering utilities, server actions, API routes, and React hooks. Uses in-memory SQLite for isolated DB tests.
- **Playwright:** 8 E2E tests covering chat flow, project management, and command palette.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** SQLite + Drizzle ORM
- **AI:** Vercel AI SDK v6 (`ai@^6.0`, `@ai-sdk/react@^3.0`) + Ollama + Google Generative AI
- **Testing:** Vitest + Testing Library (unit/integration), Playwright (E2E)

## Documentation
- [Version History (Changelog)](./CHANGELOG.md)
- [Project Plan](./PLAN.md)
- [Tech Stack Details](./TECH_STACKS.md)
- [Claude Code Guide](./CLAUDE.md)