import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestDb, testDb } from '../../helpers/test-db'

// Mock db
vi.mock('@/db', () => ({
  get db() {
    return testDb
  },
}))

// Mock AI SDK
const mockStreamText = vi.fn().mockReturnValue({
  toUIMessageStreamResponse: () => new Response('streamed', { status: 200 }),
})
const mockConvertToModelMessages = vi.fn().mockResolvedValue([
  { role: 'user', content: 'Hello' },
])

vi.mock('ai', () => ({
  streamText: (...args: unknown[]) => mockStreamText(...args),
  convertToModelMessages: (...args: unknown[]) => mockConvertToModelMessages(...args),
}))

const mockGoogleFn = vi.fn((model: string) => ({ modelId: model, provider: 'google' }))
vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: () => mockGoogleFn,
}))

const mockOllamaFn = vi.fn((model: string) => ({ modelId: model, provider: 'ollama' }))
vi.mock('ai-sdk-ollama', () => ({
  createOllama: () => mockOllamaFn,
}))

import { createProject, createChat, updateChatSystemPrompt, updateChatSummary } from '@/app/actions'

describe('POST /api/chat', () => {
  beforeEach(() => {
    createTestDb()
    vi.clearAllMocks()
    // Set API key so google provider is created
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-key'
  })

  async function postChat(body: Record<string, unknown>) {
    // Re-import to pick up fresh mocks each time
    vi.resetModules()

    // Re-apply mocks after resetModules
    vi.doMock('@/db', () => ({
      get db() { return testDb },
    }))
    vi.doMock('ai', () => ({
      streamText: (...args: unknown[]) => mockStreamText(...args),
      convertToModelMessages: (...args: unknown[]) => mockConvertToModelMessages(...args),
    }))
    vi.doMock('@ai-sdk/google', () => ({
      createGoogleGenerativeAI: () => mockGoogleFn,
    }))
    vi.doMock('ai-sdk-ollama', () => ({
      createOllama: () => mockOllamaFn,
    }))
    vi.doMock('@/lib/settings', () => ({
      getGeminiApiKey: () => Promise.resolve('test-key'),
      getOllamaBaseUrl: () => Promise.resolve('http://localhost:11434'),
    }))

    const { POST } = await import('@/app/api/chat/route')
    return POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    )
  }

  it('routes gemini models to Google provider', async () => {
    const response = await postChat({
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
      model: 'gemini-3-flash-preview',
    })
    expect(response.status).toBe(200)
    expect(mockGoogleFn).toHaveBeenCalledWith('gemini-3-flash-preview')
  })

  it('routes non-gemini models to Ollama provider', async () => {
    const response = await postChat({
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
      model: 'llama3',
    })
    expect(response.status).toBe(200)
    expect(mockOllamaFn).toHaveBeenCalledWith('llama3')
  })

  it('injects summary context when chat has summary', async () => {
    const [project] = await createProject('P')
    const [chat] = await createChat(project.id, 'Chat')
    await updateChatSummary(chat.id, 'Previous context summary', 1)

    const response = await postChat({
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Continue' }] }],
      model: 'gemini-3-flash-preview',
      chatId: chat.id,
    })
    expect(response.status).toBe(200)
    // convertToModelMessages should have been called with summary + ack + recent messages
    expect(mockConvertToModelMessages).toHaveBeenCalled()
    const passedMessages = mockConvertToModelMessages.mock.calls[0][0]
    expect(passedMessages[0].id).toBe('summary-context')
    expect(passedMessages[1].id).toBe('summary-ack')
  })

  it('passes system prompt when chat has one', async () => {
    const [project] = await createProject('P')
    const [chat] = await createChat(project.id, 'Chat')
    await updateChatSystemPrompt(chat.id, 'Be helpful')

    const response = await postChat({
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
      model: 'gemini-3-flash-preview',
      chatId: chat.id,
    })
    expect(response.status).toBe(200)
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({ system: 'Be helpful' })
    )
  })

  it('returns 500 on error', async () => {
    mockStreamText.mockImplementationOnce(() => {
      throw new Error('Model error')
    })

    const response = await postChat({
      messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
      model: 'gemini-3-flash-preview',
    })
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('Model error')
  })
})
