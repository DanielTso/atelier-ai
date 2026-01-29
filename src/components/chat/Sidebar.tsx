import { memo } from "react"
import { Folder, Plus, Settings, Sun, Moon, Trash2, MessageSquare } from "lucide-react"
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
  onThemeToggle: () => void
  onCreateProject: () => void
  onCreateChat: () => void
  onSelectProject: (id: number) => void
  onSelectChat: (id: number) => void
  onDeleteProject: (id: number) => void
}

export const Sidebar = memo(function Sidebar({
  projects,
  activeProjectId,
  chats,
  activeChatId,
  onThemeToggle,
  onCreateProject,
  onCreateChat,
  onSelectProject,
  onSelectChat,
  onDeleteProject,
}: SidebarProps) {
  return (
    <aside className="w-64 flex flex-col glass-panel rounded-2xl p-4 transition-all">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Gemini Local
        </h1>
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>

      <button
        onClick={onCreateProject}
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
                  className="flex items-center gap-2 w-full p-1.5 text-xs text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  <Plus className="h-3 w-3" /> New Chat
                </button>
                {chats.map(c => (
                  <div
                    key={c.id}
                    onClick={() => onSelectChat(c.id)}
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
  )
})
