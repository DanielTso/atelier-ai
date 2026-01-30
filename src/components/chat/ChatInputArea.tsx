'use client'

import { memo, useRef, useState, useEffect } from 'react'
import { Send, Loader2, FileText, Brain } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { PersonaSelector } from '@/components/ui/PersonaSelector'

interface EmbedStatus {
  available: boolean
  provider: 'ollama' | 'gemini' | null
  embeddingCount: number
}

interface ChatInputAreaProps {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
  activeChatId: number | null
  activeProjectId: number | null
  systemPrompt: string | null
  onSystemPromptChange: (prompt: string | null) => void
  onSystemPromptClick: () => void
  onModelChange?: (model: string) => void
}

export const ChatInputArea = memo(function ChatInputArea({
  input,
  onInputChange,
  onSend,
  onFormSubmit,
  onKeyDown,
  isLoading,
  activeChatId,
  activeProjectId,
  systemPrompt,
  onSystemPromptChange,
  onSystemPromptClick,
  onModelChange,
}: ChatInputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [embedStatus, setEmbedStatus] = useState<EmbedStatus | null>(null)

  // Track when loading state changes to detect response completion
  const prevLoading = useRef(isLoading)

  // Check embedding status when chat/project changes, or after a response completes
  useEffect(() => {
    const wasLoading = prevLoading.current
    prevLoading.current = isLoading

    // Refresh on: chat change, or response just finished (wasLoading && !isLoading)
    const responseJustFinished = wasLoading && !isLoading

    if (!activeChatId) {
      setEmbedStatus(null)
      return
    }

    // On initial chat load or after response, fetch status
    // After response, add a delay to let async embed calls complete
    const delay = responseJustFinished ? 3000 : 0
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (activeProjectId) params.set('projectId', String(activeProjectId))
      else params.set('chatId', String(activeChatId))

      fetch(`/api/embed?${params}`)
        .then(r => r.json())
        .then(setEmbedStatus)
        .catch(() => setEmbedStatus(null))
    }, delay)

    return () => clearTimeout(timer)
  }, [activeChatId, activeProjectId, isLoading])

  return (
    <div className="p-4 border-t border-white/10 bg-white/5">
      <div className="max-w-3xl mx-auto">
        {/* Toolbar row with PersonaSelector and System Prompt button */}
        {activeChatId && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <PersonaSelector
              currentPrompt={systemPrompt}
              onSelect={onSystemPromptChange}
              onCustomize={onSystemPromptClick}
              onModelChange={onModelChange}
              disabled={!activeChatId}
              side="top"
            />
            <button
              onClick={onSystemPromptClick}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              title="Edit system prompt"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">System Prompt</span>
            </button>

            {/* Semantic memory status indicator */}
            {embedStatus && (
              <div
                className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-muted-foreground"
                title={embedStatus.available
                  ? `Semantic memory active via ${embedStatus.provider === 'gemini' ? 'Gemini' : 'Ollama'} — ${embedStatus.embeddingCount} embeddings stored`
                  : 'Semantic memory offline — configure Ollama or Gemini API key'}
              >
                <Brain className={`h-3.5 w-3.5 ${embedStatus.available ? 'text-emerald-400' : 'text-muted-foreground/50'}`} />
                <span className="hidden sm:inline">
                  {embedStatus.available
                    ? `${embedStatus.embeddingCount} memories (${embedStatus.provider === 'gemini' ? 'Gemini' : 'Ollama'})`
                    : 'Memory off'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Input form */}
        <form onSubmit={onFormSubmit} className="relative">
          <TextareaAutosize
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!activeChatId || isLoading}
            minRows={1}
            maxRows={6}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50 resize-none"
            placeholder={activeChatId ? "Type a message... (Ctrl+Enter to send)" : "Select a chat to start typing..."}
          />
          <button
            type="submit"
            disabled={isLoading || !input?.trim() || !activeChatId}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-xs text-muted-foreground">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  )
})
