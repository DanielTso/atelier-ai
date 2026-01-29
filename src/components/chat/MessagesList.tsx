"use client"

import { memo } from "react"
import { Folder, MessageSquare } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { motion, AnimatePresence } from "framer-motion"
import * as Tooltip from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { CodeBlock, InlineCode } from "./CodeBlock"
import { MessageActions } from "./MessageActions"
import { TypingIndicator } from "@/components/ui/TypingIndicator"
import { formatMessageTime, formatFullTime } from "@/lib/formatTime"

interface MessagesListProps {
  messages: UIMessage[]
  isLoading: boolean
  activeChatId: number | null
  selectedModel: string
  onDeleteMessage?: (id: string) => void
}

// Helper to extract text content from message parts
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('')
}

// Move markdown components outside to prevent recreation on every render
const MARKDOWN_COMPONENTS = {
  pre: ({children, ...props}: React.HTMLAttributes<HTMLPreElement>) => (
    <CodeBlock className="overflow-auto w-full my-2 bg-black/50 p-3 rounded-lg" {...props}>
      {children}
    </CodeBlock>
  ),
  code: ({inline, ...props}: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) =>
    inline ? <InlineCode {...props} /> : <code {...props} />,
}

// Message animation variants
const messageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

export const MessagesList = memo(function MessagesList({
  messages,
  isLoading,
  activeChatId,
  selectedModel,
  onDeleteMessage,
}: MessagesListProps) {
  if (!activeChatId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-4 animate-in fade-in duration-500">
        <div className="relative">
          <Folder className="h-16 w-16 mb-4 opacity-10" />
          <div className="absolute inset-0 h-16 w-16 mb-4 opacity-5 animate-pulse">
            <Folder className="h-16 w-16" />
          </div>
        </div>
        <p className="text-lg font-medium text-foreground/60 mb-2">No Chat Selected</p>
        <p className="text-sm text-center max-w-md">
          Create a new project and chat to start your conversation with AI models
        </p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-4 animate-in fade-in duration-500">
        <div className="relative">
          <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
          <div className="absolute inset-0 h-16 w-16 mb-4 opacity-5 animate-pulse">
            <MessageSquare className="h-16 w-16" />
          </div>
        </div>
        <p className="text-lg font-medium text-foreground/60 mb-2">Start Your Conversation</p>
        <p className="text-sm text-center max-w-md">
          Type your message below to chat with <span className="text-primary font-medium">{selectedModel || "your AI"}</span>
        </p>
      </div>
    )
  }

  // For now, use current time as a fallback since we don't have createdAt from the DB
  // In a real app, you'd pass createdAt from the message
  const now = new Date()

  // Find the last assistant message for streaming cursor
  const lastAssistantIndex = messages.reduce((lastIdx, m, idx) =>
    m.role === 'assistant' ? idx : lastIdx, -1)

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-4">
        <AnimatePresence initial={false}>
          {messages.map((m, index) => {
            // Show streaming cursor on last assistant message while loading
            const isStreamingMessage = isLoading && m.role === 'assistant' && index === lastAssistantIndex

            return (
            <motion.div
              key={m.id}
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-4 group",
                m.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold",
                m.role === 'user' ? "bg-blue-500/20 text-blue-500" : "bg-primary/20 text-primary"
              )}>
                {m.role === 'user' ? 'You' : 'AI'}
              </div>
              <div className={cn(
                "flex flex-col gap-1 max-w-[80%]",
                m.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-4 rounded-2xl border transition-all hover:border-white/20 relative",
                  m.role === 'user'
                    ? "bg-primary/20 border-primary/10 rounded-tr-none"
                    : "bg-white/5 border-white/10 rounded-tl-none"
                )}>
                  <div className={cn(
                    "prose dark:prose-invert text-base max-w-none break-words",
                    isStreamingMessage && "streaming-cursor"
                  )}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={MARKDOWN_COMPONENTS}
                    >
                      {getMessageText(m)}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Timestamp and Actions Row */}
                <div className={cn(
                  "flex items-center gap-2 px-1",
                  m.role === 'user' ? "flex-row-reverse" : ""
                )}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <span className="text-xs text-muted-foreground/60 cursor-default">
                        {formatMessageTime(now)}
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 px-3 py-1.5 text-xs bg-popover border border-white/10 rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95"
                        sideOffset={5}
                      >
                        {formatFullTime(now)}
                        <Tooltip.Arrow className="fill-popover" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>

                  <MessageActions
                    messageText={getMessageText(m)}
                    messageRole={m.role as 'user' | 'assistant'}
                    onDelete={onDeleteMessage ? () => onDeleteMessage(m.id) : undefined}
                  />
                </div>
              </div>
            </motion.div>
          )})}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">
                AI
              </div>
              <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 flex items-center">
                <TypingIndicator />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tooltip.Provider>
  )
})
