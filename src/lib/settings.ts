import { db } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Get a setting from DB first, falling back to an environment variable.
 */
export async function getServerSetting(key: string, envFallback?: string): Promise<string | null> {
  const result = await db.select().from(settings).where(eq(settings.key, key)).get()
  if (result?.value) return result.value
  if (envFallback) return process.env[envFallback] ?? null
  return null
}

export async function getGeminiApiKey(): Promise<string | null> {
  return getServerSetting('gemini-api-key', 'GOOGLE_GENERATIVE_AI_API_KEY')
}

export async function getOllamaBaseUrl(): Promise<string> {
  const url = await getServerSetting('ollama-base-url')
  return url || 'http://localhost:11434'
}

export async function getDefaultModel(): Promise<string | null> {
  return getServerSetting('default-model')
}

export async function getDefaultSystemPrompt(): Promise<string | null> {
  return getServerSetting('default-system-prompt')
}
