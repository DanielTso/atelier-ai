# Glassmorphic Local AI Chat

A beautiful, local-first AI chat interface built with Next.js, Tailwind CSS, and Ollama, now featuring hybrid support for Google Gemini models.

## Features
- **Hybrid AI:** Seamlessly switch between local models (Ollama) and cloud models (Google Gemini).
- **Privacy:** Chats are stored locally in a SQLite database (`sqlite.db`).
- **Organization:** Group chats into Projects.
- **UI:** Modern Glassmorphism design with Dark/Light mode.
- **Markdown:** Renders code blocks and formatted text.

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

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4
- **Database:** SQLite + Drizzle ORM
- **AI:** Vercel AI SDK (v3.4) + Ollama + Google Generative AI

## Documentation
- [Version History (Changelog)](./CHANGELOG.md)
- [Project Plan](./PLAN.md)
- [Tech Stack Details](./TECH_STACKS.md)