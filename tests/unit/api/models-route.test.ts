import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('GET /api/models', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function mockSettings(apiKey: string | null = 'test-key', ollamaUrl: string = 'http://localhost:11434') {
    vi.doMock('@/lib/settings', () => ({
      getGeminiApiKey: () => Promise.resolve(apiKey),
      getOllamaBaseUrl: () => Promise.resolve(ollamaUrl),
    }))
  }

  it('returns Gemini models even when Ollama is unavailable', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    mockSettings()

    const { GET } = await import('@/app/api/models/route')
    const response = await GET()
    const data = await response.json()

    expect(data.models.length).toBeGreaterThanOrEqual(3)
    expect(data.models.some((m: { model: string }) => m.model.startsWith('gemini'))).toBe(true)
  })

  it('combines Gemini and Ollama models', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          models: [{ name: 'llama3', model: 'llama3', digest: 'abc123' }],
        }),
    })
    mockSettings()

    const { GET } = await import('@/app/api/models/route')
    const response = await GET()
    const data = await response.json()

    // 3 Gemini + 1 Ollama
    expect(data.models).toHaveLength(4)
    expect(data.models.some((m: { name: string }) => m.name === 'llama3')).toBe(true)
  })

  it('excludes Gemini models when no API key', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    mockSettings(null)

    const { GET } = await import('@/app/api/models/route')
    const response = await GET()
    const data = await response.json()

    expect(data.models.every((m: { model: string }) => !m.model.startsWith('gemini'))).toBe(true)
  })

  it('sets cache-control header', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    mockSettings()

    const { GET } = await import('@/app/api/models/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
  })
})
