# Implemented Tech Stack

This document outlines the final technology choices used in the "Glassmorphic Local AI Chat" application.

## Core Framework
*   **Next.js 16 (App Router):** Chosen for its robust server-side rendering, API route capabilities, and seamless integration with Vercel AI SDK.
*   **TypeScript:** Used throughout for type safety and developer productivity.

## User Interface (UI)
*   **Tailwind CSS v4:** For utility-first styling and easy implementation of the "Glassmorphism" aesthetic.
*   **Lucide React:** For lightweight, consistent iconography.
*   **Next-Themes:** For reliable Dark/Light mode switching.
*   **React Markdown:** To render AI responses with proper formatting (code blocks, bold text, etc.).

## AI & Streaming
*   **Vercel AI SDK (v3.4):** A powerful library for handling streaming responses from LLMs. We specifically chose v3.4 for stability and compatibility.
*   **Ollama AI Provider:** For connecting to locally hosted models (Llama 3, Mistral, etc.) via `ollama-ai-provider`.
*   **Google Generative AI SDK:** For integrating Gemini cloud models (Gemini 3, Gemini 2.5, Gemini 1.5).

## Data Persistence
*   **SQLite (better-sqlite3):** A high-performance, serverless SQL database perfect for local, private data storage.
*   **Drizzle ORM:** A lightweight, type-safe ORM for interacting with the SQLite database.

## Deployment / Runtime
*   **Node.js:** The runtime environment.
*   **Localhost:** Primarily designed to run locally on the user's machine to ensure data privacy and access to local Ollama instances.