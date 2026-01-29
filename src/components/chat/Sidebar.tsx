import { memo, useState } from "react"
import { Folder, Plus, Settings, Sun, Moon, Trash2, MessageSquare, ChevronDown, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Project {
  id: number
  name: string
}

interface Chat {
  id: number
  projectId: number | null
  title: string
}

interface SidebarProps {
  projects: Project[]
  activeProjectId: number | null
  chats: Chat[]
  activeChatId: number | null
  standaloneChats: Chat[]
  onThemeToggle: () => void
  onCreateProject: () => void
  onCreateChat: () => void
  onCreateStandaloneChat: () => void
  onSelectProject: (id: number) => void
  onSelectChat: (id: number) => void
  onSelectStandaloneChat: (id: number) => void
  onDeleteProject: (id: number) => void
  onDeleteChat: (id: number) => void
}

export const Sidebar = memo(function Sidebar({
  projects,
  activeProjectId,
  chats,
  activeChatId,
  standaloneChats,
  onThemeToggle,
  onCreateProject,
  onCreateChat,
  onCreateStandaloneChat,
  onSelectProject,
  onSelectChat,
  onSelectStandaloneChat,
  onDeleteProject,
  onDeleteChat,
}: SidebarProps) {
  const [quickChatsCollapsed, setQuickChatsCollapsed] = useState(false)
  const [projectsCollapsed, setProjectsCollapsed] = useState(false)

  return (
    <aside className="w-64 flex flex-col glass-panel rounded-2xl p-4 transition-all">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Gemini Local
        </h1>
        <button
          onClick={onThemeToggle}
          className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>

      {/* New Chat Button (Standalone) */}
      <button
        onClick={onCreateStandaloneChat}
        className="flex items-center gap-2 w-full p-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-medium mb-4"
      >
        <Plus className="h-4 w-4" />
        New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Quick Chats Section */}
        <div>
          <button
            onClick={() => setQuickChatsCollapsed(!quickChatsCollapsed)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", quickChatsCollapsed && "-rotate-90")} />
            <MessageCircle className="h-3 w-3" />
            Quick Chats
            {standaloneChats.length > 0 && (
              <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                {standaloneChats.length}
              </span>
            )}
          </button>

          {!quickChatsCollapsed && (
            <div className="mt-1 space-y-1 pl-2">
              {standaloneChats.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 px-2 py-1">No quick chats yet</p>
              ) : (
                standaloneChats.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectStandaloneChat(c.id)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors group",
                      activeChatId === c.id ? "text-primary font-medium bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate flex-1">{c.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteChat(c.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Projects Section */}
        <div>
          <button
            onClick={() => setProjectsCollapsed(!projectsCollapsed)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", projectsCollapsed && "-rotate-90")} />
            <Folder className="h-3 w-3" />
            Projects
            {projects.length > 0 && (
              <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                {projects.length}
              </span>
            )}
          </button>

          {!projectsCollapsed && (
            <div className="mt-1 space-y-1 pl-2">
              <button
                onClick={onCreateProject}
                className="flex items-center gap-2 w-full p-2 text-sm text-muted-foreground hover:text-primary transition-colors text-left"
              >
                <Plus className="h-3.5 w-3.5" /> New Project
              </button>

              {projects.map((p) => (
                <div key={p.id} className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group",
                      activeProjectId === p.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"
                    )}
                    onClick={() => onSelectProject(p.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span className="text-sm font-medium truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteProject(p.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {activeProjectId === p.id && (
                    <div className="ml-4 pl-2 border-l border-white/10 space-y-1">
                      <button
                        onClick={onCreateChat}
                        className="flex items-center gap-2 w-full p-1.5 text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                      >
                        <Plus className="h-3.5 w-3.5" /> New Chat
                      </button>
                      {chats.map(c => (
                        <div
                          key={c.id}
                          className={cn(
                            "flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm transition-colors group",
                            activeChatId === c.id ? "text-primary font-medium bg-primary/5" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div
                            className="flex items-center gap-2 flex-1 truncate"
                            onClick={() => onSelectChat(c.id)}
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{c.title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteChat(c.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <button className="flex items-center gap-2 p-2 w-full rounded-lg hover:bg-white/5 text-sm text-muted-foreground transition-colors">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  )
})
