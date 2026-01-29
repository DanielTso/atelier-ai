import { memo } from "react"
import { Loader2, Folder, MessageSquare } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { CodeBlock, InlineCode } from "./CodeBlock"

interface MessagesListProps {
  messages: UIMessage[]
  isLoading: boolean
  activeChatId: number | null
  selectedModel: string
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

export const MessagesList = memo(function MessagesList({
  messages,
  isLoading,
  activeChatId,
  selectedModel,
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

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-4">
      {messages.map((m, index) => (
        <div
          key={m.id}
          className={cn(
            "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
            m.role === 'user' ? "flex-row-reverse" : ""
          )}
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
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
              "p-4 rounded-2xl border transition-all hover:border-white/20",
              m.role === 'user'
                ? "bg-primary/20 border-primary/10 rounded-tr-none"
                : "bg-white/5 border-white/10 rounded-tl-none"
            )}>
              <div className="prose dark:prose-invert text-sm max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={MARKDOWN_COMPONENTS}
                >
                  {getMessageText(m)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            AI
          </div>
          <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  )
})
