"use client"

import { MessageSquare, Folder, Plus, Settings, Sun, Moon, Send, Loader2, Trash2, AlertCircle } from "lucide-react"
import { useTheme } from "next-themes"
import { useChat } from "ai/react"
import { useEffect, useState, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { getProjects, createProject, getChats, createChat, getChatMessages, saveMessage, deleteProject } from "./actions"

interface OllamaModel {
  name: string
  model: string
  digest: string
}

// Types matching DB schema roughly
type Project = { id: number; name: string }
type Chat = { id: number; projectId: number | null; title: string }

export default function Home() {
  const { setTheme, theme } = useTheme()
  const [models, setModels] = useState<OllamaModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Data State
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<number | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error: chatError } = useChat({
    api: "/api/chat",
    body: { model: selectedModel },
    onFinish: async (message) => {
      if (activeChatId) {
        await saveMessage(activeChatId, 'assistant', message.content)
      }
    }
  })

  // Sync chat errors to UI
  useEffect(() => {
    if (chatError) {
      setError(chatError.message)
    }
  }, [chatError])
  
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
         setError("No models found. Ensure Ollama is running.")
      }
    } catch (e) { 
      console.error(e)
      setError("Failed to load models. Is Ollama running?")
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

  const loadChats = useCallback(async (pid: number) => {
    try {
      const c = await getChats(pid)
      setChats(c)
    } catch (e) {
      console.error(e)
      setError("Failed to load chats.")
    }
  }, [])

  const loadMessages = useCallback(async (cid: number) => {
    try {
      const msgs = await getChatMessages(cid)
      // Convert DB messages to AI SDK format
      setMessages(msgs.map(m => ({
        id: m.id.toString(),
        role: m.role as 'user' | 'assistant',
        content: m.content
      })))
    } catch (e) {
      console.error(e)
      setError("Failed to load messages.")
    }
  }, [setMessages])

  // Load Projects on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProjects()
    fetchModels()
  }, [loadProjects, fetchModels])

  // Load Chats when Project Changes
  useEffect(() => {
    if (activeProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadChats(activeProjectId)
    } else {
      setChats([])
    }
  }, [activeProjectId, loadChats])

  // Load Messages when Chat Changes
  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId)
    } else {
      setMessages([])
    }
  }, [activeChatId, loadMessages, setMessages])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleCreateProject = async () => {
    const name = prompt("Project Name:")
    if (!name) return
    try {
      const [newP] = await createProject(name)
      setProjects([...projects, newP])
      setActiveProjectId(newP.id)
    } catch (e) {
      console.error(e)
      setError("Failed to create project.")
    }
  }

  const handleCreateChat = async () => {
    if (!activeProjectId) {
      alert("Select a project first")
      return
    }
    try {
      const [newC] = await createChat(activeProjectId, "New Chat")
      setChats([newC, ...chats])
      setActiveChatId(newC.id)
    } catch (e) {
      console.error(e)
      setError("Failed to create chat.")
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeChatId) return
    setError(null)
    
    try {
      // Save user message immediately
      await saveMessage(activeChatId, 'user', input)
      handleSubmit(e)
    } catch (e) {
      console.error(e)
      setError("Failed to send message.")
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden p-4 gap-4">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col glass-panel rounded-2xl p-4 transition-all">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Gemini Local
          </h1>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>

        <button 
          onClick={handleCreateProject}
          className="flex items-center gap-2 w-full p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-medium mb-4"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {projects.map((p) => (
            <div key={p.id} className="space-y-1">
              <div 
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group",
                  activeProjectId === p.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"
                )}
                onClick={() => {
                   setActiveProjectId(p.id)
                   setActiveChatId(null) // Reset chat when switching project
                }}
              >
                 <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="text-sm font-medium truncate max-w-[120px]">{p.name}</span>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); deleteProject(p.id).then(() => { loadProjects(); if(activeProjectId === p.id) setActiveProjectId(null); }) }}
                   className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                 >
                   <Trash2 className="h-3 w-3" />
                 </button>
              </div>
              
              {/* Nested Chats */}
              {activeProjectId === p.id && (
                 <div className="ml-4 pl-2 border-l border-white/10 space-y-1">
                    <button 
                      onClick={handleCreateChat}
                      className="flex items-center gap-2 w-full p-1.5 text-xs text-muted-foreground hover:text-primary transition-colors text-left"
                    >
                      <Plus className="h-3 w-3" /> New Chat
                    </button>
                    {chats.map(c => (
                      <div 
                        key={c.id}
                        onClick={() => setActiveChatId(c.id)}
                        className={cn(
                          "flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs truncate transition-colors",
                          activeChatId === c.id ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span className="truncate">{c.title}</span>
                      </div>
                    ))}
                 </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <button className="flex items-center gap-2 p-2 w-full rounded-lg hover:bg-white/5 text-sm text-muted-foreground transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">
               {activeChatId ? chats.find(c => c.id === activeChatId)?.title : "Select a Chat"}
            </span>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-xs text-muted-foreground">Model:</span>
             <select 
               value={selectedModel}
               onChange={(e) => setSelectedModel(e.target.value)}
               className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary [&>option]:text-black [&>option]:dark:text-white"
             >
               {models.length === 0 && <option>Loading...</option>}
               {models.map((m) => (
                 <option key={m.digest} value={m.model}>
                   {m.name}
                 </option>
               ))}
             </select>
          </div>
        </header>

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
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
           {!activeChatId ? (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Folder className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a project and chat to begin.</p>
             </div>
           ) : messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p>Start a conversation with {selectedModel || "your local AI"}</p>
             </div>
           ) : (
             <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-4">
                {messages.map((m) => (
                  <div key={m.id} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "")}>
                     <div className={cn(
                       "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                       m.role === 'user' ? "bg-blue-500/20 text-blue-500" : "bg-primary/20 text-primary"
                     )}>
                        {m.role === 'user' ? 'You' : 'AI'}
                     </div>
                     <div className={cn(
                       "p-4 rounded-2xl border max-w-[80%]",
                       m.role === 'user' 
                         ? "bg-primary/20 border-primary/10 rounded-tr-none" 
                         : "bg-white/5 border-white/10 rounded-tl-none"
                     )}>
                        <div className="prose dark:prose-invert text-sm max-w-none break-words">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              pre: ({...props}) => <pre className="overflow-auto w-full my-2 bg-black/50 p-2 rounded-lg" {...props} />,
                              code: ({...props}) => <code className="bg-black/30 rounded px-1" {...props} />
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
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
           )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative">
            <input 
              value={input}
              onChange={handleInputChange}
              disabled={!activeChatId || isLoading}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground disabled:opacity-50"
              placeholder={activeChatId ? "Type a message..." : "Select a chat to start typing..."}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim() || !activeChatId}
              className="absolute right-2 top-2 p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50"
            >
               {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <div className="text-center mt-2">
             <p className="text-[10px] text-muted-foreground">AI can make mistakes. Check important info.</p>
          </div>
        </div>
      </main>
    </div>
  )
}