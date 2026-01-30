"use client"

import { Send, Loader2, AlertCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getProjects, createProject, getChats, getAllProjectChats, createChat, getChatMessages, saveMessage, deleteProject, updateProjectName, updateChatTitle, getStandaloneChats, createStandaloneChat, deleteChat, moveChatToProject, archiveChat, restoreChat, getArchivedChats, getMessageCount, getChatWithContext, updateChatSystemPrompt } from "./actions"
import { Sidebar } from "@/components/chat/Sidebar"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { MessagesList, type ChatMessage } from "@/components/chat/MessagesList"
import { CommandPalette } from "@/components/ui/CommandPalette"
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog"
import { RenameDialog } from "@/components/ui/RenameDialog"
import { SystemPromptDialog } from "@/components/ui/SystemPromptDialog"
import { SettingsDialog } from "@/components/ui/SettingsDialog"
import { useAppearanceSettings } from "@/hooks/useAppearanceSettings"
import { useLocalStorage } from "@/hooks/useLocalStorage"

interface Model {
  name: string
  model: string
  digest: string
}

// Types matching DB schema roughly
type Project = { id: number; name: string }
type Chat = { id: number; projectId: number | null; title: string; archived?: boolean | null }

export default function Home() {
  const { setTheme, theme } = useTheme()
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Use ref to always get current model in transport body function
  const selectedModelRef = useRef(selectedModel)
  selectedModelRef.current = selectedModel

  // Data State
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [standaloneChats, setStandaloneChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)

  // Ref for activeChatId (must be after state declaration)
  const activeChatIdRef = useRef(activeChatId)
  activeChatIdRef.current = activeChatId

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Archived chats state
  const [archivedChats, setArchivedChats] = useState<Chat[]>([])

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ id: number; title: string } | null>(null)
  const [systemPromptDialogOpen, setSystemPromptDialogOpen] = useState(false)
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState<string | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar-collapsed', false)

  // Appearance settings
  const { fontSize, setFontSize, messageDensity, setMessageDensity } = useAppearanceSettings()

  // Create transport with body as function to always get current values
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      model: selectedModelRef.current,
      chatId: activeChatIdRef.current,
    }),
  }), [])

  // Context management configuration
  const SUMMARIZATION_THRESHOLD = 30 // Trigger summarization when message count exceeds this
  const MESSAGES_TO_KEEP = 10 // Keep this many recent messages after summarization

  const triggerSummarization = useCallback(async (chatId: number, messageCount: number) => {
    if (messageCount <= SUMMARIZATION_THRESHOLD) return

    // Calculate cutoff: summarize all but the most recent MESSAGES_TO_KEEP
    const messages = await getChatMessages(chatId)
    if (messages.length <= MESSAGES_TO_KEEP) return

    const cutoffIndex = messages.length - MESSAGES_TO_KEEP
    const cutoffMessageId = messages[cutoffIndex - 1]?.id

    if (!cutoffMessageId) return

    console.log(`[Summarization] Triggering for chat ${chatId}, cutoff at message ${cutoffMessageId}`)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          cutoffMessageId,
          model: selectedModelRef.current,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`[Summarization] Complete: ${result.summarizedMessageCount} messages summarized`)
        toast.success('Conversation summarized for better context management')
      }
    } catch (error) {
      console.error('[Summarization] Error:', error)
    }
  }, [])

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error: chatError
  } = useChat({
    transport,
    onFinish: async ({ message }) => {
      console.log('[onFinish] Message received:', message)
      const currentChatId = activeChatIdRef.current

      // Extract text content from message parts
      const textContent = message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join('')

      if (currentChatId && textContent.trim()) {
        await saveMessage(currentChatId, 'assistant', textContent)
        console.log('[onFinish] Assistant message saved to DB')

        // Check if summarization is needed
        const messageCount = await getMessageCount(currentChatId)
        if (messageCount > SUMMARIZATION_THRESHOLD) {
          triggerSummarization(currentChatId, messageCount)
        }
      }
    }
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Debug: log messages changes
  useEffect(() => {
    console.log('[useChat] status:', status)
    console.log('[useChat] Messages count:', messages.length)
    console.log('[useChat] Messages:', messages)
    console.log('[useChat] input value:', input)
  }, [status, messages, input])

  // Sync chat errors to UI
  useEffect(() => {
    if (chatError) {
      setError(chatError.message)
    }
  }, [chatError])

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timeout)
    }
  }, [error])

  // Helper Functions defined with useCallback
  const fetchModels = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch("/api/models")
      if (!res.ok) throw new Error("Failed to fetch models")

      const data = await res.json()
      if (data.models) setModels(data.models)
      if (data.models?.length > 0) {
         setSelectedModel(data.models[0].model)
      } else {
         setError("No models found. Please check your Gemini API key or start Ollama.")
      }
    } catch (e) {
      console.error(e)
      setError("Failed to load models. Please check your configuration.")
    }
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      const p = await getProjects()
      setProjects(p)
    } catch (e) {
      console.error(e)
      setError("Failed to load projects.")
    }
  }, [])

  const loadStandaloneChats = useCallback(async () => {
    try {
      const c = await getStandaloneChats()
      setStandaloneChats(c)
    } catch (e) {
      console.error(e)
      setError("Failed to load chats.")
    }
  }, [])

  const loadArchivedChats = useCallback(async () => {
    try {
      const c = await getArchivedChats()
      setArchivedChats(c)
    } catch (e) {
      console.error(e)
      setError("Failed to load archived chats.")
    }
  }, [])

  const loadAllProjectChats = useCallback(async () => {
    try {
      const c = await getAllProjectChats()
      setChats(c)
    } catch (e) {
      console.error(e)
      setError("Failed to load chats.")
    }
  }, [])

  const loadMessages = useCallback(async (cid: number) => {
    try {
      const msgs = await getChatMessages(cid)
      // Convert DB messages to AI SDK UIMessage format with parts
      setMessages(msgs.map(m => ({
        id: m.id.toString(),
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.content }],
        createdAt: m.createdAt ?? new Date(),
      })))
    } catch (e) {
      console.error(e)
      setError("Failed to load messages.")
    }
  }, [setMessages])

  // Load Projects and all chats on mount
  useEffect(() => {
    loadProjects()
    loadStandaloneChats()
    loadAllProjectChats()
    loadArchivedChats()
    fetchModels()
  }, [loadProjects, loadStandaloneChats, loadAllProjectChats, loadArchivedChats, fetchModels])

  // Load Messages and System Prompt when Chat Changes
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId)
      // Load system prompt for this chat
      getChatWithContext(activeChatId).then(chat => {
        setCurrentSystemPrompt(chat?.systemPrompt ?? null)
      })
    } else {
      setMessages([])
      setCurrentSystemPrompt(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId])

  // Auto-scroll with requestAnimationFrame for smoother scrolling
  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    const animationId = requestAnimationFrame(() => {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
    })

    return () => cancelAnimationFrame(animationId)
  }, [messages])

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(open => !open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCreateProject = async () => {
    const name = prompt("Project Name:")
    if (!name) return
    try {
      const [newP] = await createProject(name)
      setProjects([...projects, newP])
      setActiveProjectId(newP.id)
      toast.success("Project created")
    } catch (e) {
      console.error(e)
      setError("Failed to create project.")
    }
  }

  const handleCreateChat = async () => {
    if (!activeProjectId) {
      toast.error("Select a project first")
      return
    }
    try {
      const [newC] = await createChat(activeProjectId, "New Chat")
      setChats([newC, ...chats])
      setActiveChatId(newC.id)
      toast.success("Chat created")
    } catch (e) {
      console.error(e)
      setError("Failed to create chat.")
    }
  }

  const handleCreateStandaloneChat = async () => {
    try {
      const [newC] = await createStandaloneChat("New Chat")
      setStandaloneChats([newC, ...standaloneChats])
      setActiveChatId(newC.id)
      setActiveProjectId(null) // Clear project selection
      toast.success("Chat created")
    } catch (e) {
      console.error(e)
      setError("Failed to create chat.")
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !activeChatId || isLoading) return

    console.log('[Form] Submit triggered')
    console.log('[Form] input value:', input)
    console.log('[Form] activeChatId:', activeChatId)
    console.log('[Form] selectedModel:', selectedModel)
    console.log('[Form] status:', status)

    const userMessage = input.trim()
    setInput("")

    await sendMessage({ text: userMessage })
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSendMessage()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage()
    }
    // Clear on Escape
    if (e.key === 'Escape') {
      setInput("")
      textareaRef.current?.blur()
    }
  }

  // Save user messages to database when messages array changes
  useEffect(() => {
    if (messages.length === 0 || !activeChatId) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'user') {
      // Extract text content from message parts
      const textContent = lastMessage.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map(part => part.text)
        .join('')
      // Save user message to database
      saveMessage(activeChatId, 'user', textContent)
        .then(() => console.log('[useEffect] User message saved to DB'))
        .catch(err => console.error('[useEffect] Error saving user message:', err))
    }
  }, [messages, activeChatId])

  const handleDeleteProject = useCallback(async (id: number) => {
    await deleteProject(id)
    setProjects(projects.filter(p => p.id !== id))
    if (activeProjectId === id) setActiveProjectId(null)
    toast.success("Project deleted")
  }, [projects, activeProjectId])

  const handleRenameProject = useCallback(async (id: number, name: string) => {
    try {
      await updateProjectName(id, name)
      setProjects(projects.map(p => p.id === id ? { ...p, name } : p))
      toast.success("Project renamed")
    } catch (e) {
      console.error(e)
      setError("Failed to rename project.")
    }
  }, [projects])

  const handleRequestDelete = useCallback((id: number) => {
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTargetId) return
    await deleteChat(deleteTargetId)
    setChats(chats.filter(c => c.id !== deleteTargetId))
    setStandaloneChats(standaloneChats.filter(c => c.id !== deleteTargetId))
    setArchivedChats(archivedChats.filter(c => c.id !== deleteTargetId))
    if (activeChatId === deleteTargetId) setActiveChatId(null)
    setDeleteTargetId(null)
    toast.success("Chat deleted")
  }, [deleteTargetId, chats, standaloneChats, archivedChats, activeChatId])

  const handleRequestRename = useCallback((id: number) => {
    const chat = [...chats, ...standaloneChats, ...archivedChats].find(c => c.id === id)
    if (chat) {
      setRenameTarget({ id: chat.id, title: chat.title })
      setRenameDialogOpen(true)
    }
  }, [chats, standaloneChats, archivedChats])

  const handleConfirmRename = useCallback(async (newTitle: string) => {
    if (!renameTarget) return
    await updateChatTitle(renameTarget.id, newTitle)
    setChats(chats.map(c => c.id === renameTarget.id ? { ...c, title: newTitle } : c))
    setStandaloneChats(standaloneChats.map(c => c.id === renameTarget.id ? { ...c, title: newTitle } : c))
    setArchivedChats(archivedChats.map(c => c.id === renameTarget.id ? { ...c, title: newTitle } : c))
    setRenameTarget(null)
    toast.success("Chat renamed")
  }, [renameTarget, chats, standaloneChats, archivedChats])

  const handleMoveChat = useCallback(async (chatId: number, projectId: number | null) => {
    await moveChatToProject(chatId, projectId)
    // Refresh all chat lists
    loadStandaloneChats()
    loadAllProjectChats()
    toast.success(projectId ? "Chat moved to project" : "Chat moved to Quick Chats")
  }, [loadAllProjectChats, loadStandaloneChats])

  const handleArchiveChat = useCallback(async (chatId: number) => {
    await archiveChat(chatId)
    setChats(chats.filter(c => c.id !== chatId))
    setStandaloneChats(standaloneChats.filter(c => c.id !== chatId))
    if (activeChatId === chatId) setActiveChatId(null)
    loadArchivedChats()
    toast.success("Chat archived")
  }, [chats, standaloneChats, activeChatId, loadArchivedChats])

  const handleRestoreChat = useCallback(async (chatId: number) => {
    await restoreChat(chatId)
    loadArchivedChats()
    loadStandaloneChats()
    loadAllProjectChats()
    toast.success("Chat restored")
  }, [loadArchivedChats, loadStandaloneChats, loadAllProjectChats])

  const handleSelectProject = useCallback((id: number) => {
    setActiveProjectId(id)
    setActiveChatId(null) // Reset chat when switching project
  }, [])

  const handleSelectStandaloneChat = useCallback((id: number) => {
    setActiveProjectId(null) // Clear project when selecting standalone chat
    setActiveChatId(id)
  }, [])

  const handleUpdateChatTitle = useCallback(async (id: number, title: string) => {
    try {
      await updateChatTitle(id, title)
      // Update local state for both types of chats
      setChats(chats.map(c => c.id === id ? { ...c, title } : c))
      setStandaloneChats(standaloneChats.map(c => c.id === id ? { ...c, title } : c))
    } catch (e) {
      console.error(e)
      setError("Failed to update chat title.")
    }
  }, [chats, standaloneChats])

  const handleSaveSystemPrompt = useCallback(async (prompt: string | null) => {
    if (!activeChatId) return
    try {
      await updateChatSystemPrompt(activeChatId, prompt)
      setCurrentSystemPrompt(prompt)
      toast.success(prompt ? "System instruction saved" : "System instruction cleared")
    } catch (e) {
      console.error(e)
      setError("Failed to update system instruction.")
    }
  }, [activeChatId])

  // Get the current chat title from either chats or standaloneChats
  const currentChatTitle = activeChatId
    ? chats.find(c => c.id === activeChatId)?.title || standaloneChats.find(c => c.id === activeChatId)?.title
    : undefined

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden p-4 gap-4",
      fontSize === 'small' && 'text-sm',
      fontSize === 'large' && 'text-lg',
    )}>
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        chats={chats}
        activeChatId={activeChatId}
        standaloneChats={standaloneChats}
        archivedChats={archivedChats}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        onCreateProject={handleCreateProject}
        onCreateChat={handleCreateChat}
        onCreateStandaloneChat={handleCreateStandaloneChat}
        onSelectProject={handleSelectProject}
        onSelectChat={setActiveChatId}
        onSelectStandaloneChat={handleSelectStandaloneChat}
        onRenameProject={handleRenameProject}
        onDeleteProject={handleDeleteProject}
        onMoveChat={handleMoveChat}
        onRenameChat={handleRequestRename}
        onArchiveChat={handleArchiveChat}
        onRestoreChat={handleRestoreChat}
        onDeleteChat={handleRequestDelete}
        onOpenSettings={() => setSettingsDialogOpen(true)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden relative">
        <ChatHeader
          chatId={activeChatId}
          chatTitle={currentChatTitle}
          models={models}
          selectedModel={selectedModel}
          systemPrompt={currentSystemPrompt}
          onModelChange={setSelectedModel}
          onTitleChange={handleUpdateChatTitle}
          onSystemPromptChange={handleSaveSystemPrompt}
          onSystemPromptClick={() => setSystemPromptDialogOpen(true)}
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto hover:text-red-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className={cn(
          "flex-1 overflow-y-auto p-6",
          messageDensity === 'compact' && 'space-y-2',
          messageDensity === 'comfortable' && 'space-y-6',
          messageDensity === 'spacious' && 'space-y-10',
        )}>
          <MessagesList
            messages={messages as ChatMessage[]}
            isLoading={isLoading}
            activeChatId={activeChatId}
            selectedModel={selectedModel}
          />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto relative">
            <TextareaAutosize
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
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
      </main>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onNewChat={handleCreateStandaloneChat}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        models={models}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        projects={projects}
        standaloneChats={standaloneChats}
        chats={chats}
        onSelectProject={handleSelectProject}
        onSelectChat={setActiveChatId}
        onSelectStandaloneChat={handleSelectStandaloneChat}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Chat"
        description="Are you sure you want to delete this chat? This action cannot be undone."
        onConfirm={handleConfirmDelete}
      />

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentTitle={renameTarget?.title ?? ""}
        onRename={handleConfirmRename}
      />

      {/* System Prompt Dialog */}
      <SystemPromptDialog
        open={systemPromptDialogOpen}
        onOpenChange={setSystemPromptDialogOpen}
        currentPrompt={currentSystemPrompt}
        onSave={handleSaveSystemPrompt}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        models={models}
        onSettingsChanged={fetchModels}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        messageDensity={messageDensity}
        onMessageDensityChange={setMessageDensity}
      />
    </div>
  )
}
