import { memo, useState, useRef, useEffect, useMemo } from "react"
import { Folder, Plus, Settings, Sun, Moon, MessageSquare, ChevronDown, MessageCircle, Archive, Pencil, Check, X, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import * as Tooltip from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"
import { ChatContextMenu } from "./ChatContextMenu"
import { useCollapseState } from "@/hooks/useCollapseState"

interface Project {
  id: number
  name: string
}

interface Chat {
  id: number
  projectId: number | null
  title: string
  archived?: boolean | null
}

interface SidebarProps {
  projects: Project[]
  activeProjectId: number | null
  chats: Chat[]
  activeChatId: number | null
  standaloneChats: Chat[]
  archivedChats: Chat[]
  collapsed: boolean
  onToggleCollapse: () => void
  onThemeToggle: () => void
  onCreateProject: () => void
  onCreateChat: () => void
  onCreateStandaloneChat: () => void
  onSelectProject: (id: number) => void
  onSelectChat: (id: number) => void
  onSelectStandaloneChat: (id: number) => void
  onRenameProject: (id: number, name: string) => void
  onDeleteProject: (id: number) => void
  onMoveChat: (chatId: number, projectId: number | null) => void
  onRenameChat: (chatId: number) => void
  onArchiveChat: (chatId: number) => void
  onRestoreChat: (chatId: number) => void
  onDeleteChat: (chatId: number) => void
  onOpenSettings: () => void
}

export const Sidebar = memo(function Sidebar({
  projects,
  activeProjectId,
  chats,
  activeChatId,
  standaloneChats,
  archivedChats,
  collapsed,
  onToggleCollapse,
  onThemeToggle,
  onCreateProject,
  onCreateChat,
  onCreateStandaloneChat,
  onSelectProject,
  onSelectChat,
  onSelectStandaloneChat,
  onRenameProject,
  onDeleteProject,
  onMoveChat,
  onRenameChat,
  onArchiveChat,
  onRestoreChat,
  onDeleteChat,
  onOpenSettings,
}: SidebarProps) {
  // State for inline project editing
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [editedProjectName, setEditedProjectName] = useState("")
  const projectInputRef = useRef<HTMLInputElement>(null)

  // Sort projects alphabetically
  const sortedProjects = useMemo(() =>
    [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  )

  // Focus input when editing starts
  useEffect(() => {
    if (editingProjectId && projectInputRef.current) {
      projectInputRef.current.focus()
      projectInputRef.current.select()
    }
  }, [editingProjectId])

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id)
    setEditedProjectName(project.name)
  }

  const saveProjectName = () => {
    if (editingProjectId && editedProjectName.trim()) {
      onRenameProject(editingProjectId, editedProjectName.trim())
    }
    setEditingProjectId(null)
  }

  const cancelEditingProject = () => {
    setEditingProjectId(null)
    setEditedProjectName("")
  }

  const handleProjectKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveProjectName()
    } else if (e.key === 'Escape') {
      cancelEditingProject()
    }
  }

  const {
    quickChatsCollapsed,
    projectsCollapsed,
    archivedCollapsed,
    toggleQuickChats,
    toggleProjects,
    toggleArchived,
    toggleProjectChats,
    isProjectCollapsed,
  } = useCollapseState()

  // Helper for tooltip in collapsed mode
  const CollapsedButton = ({ label, icon: Icon, onClick, className: btnClass }: { label: string; icon: typeof Plus; onClick: () => void; className?: string }) => (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            onClick={onClick}
            className={cn("p-2 rounded-lg hover:bg-white/10 transition-colors", btnClass)}
          >
            <Icon className="h-5 w-5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="px-2 py-1 text-xs rounded bg-popover border border-white/10 shadow-lg z-50"
          >
            {label}
            <Tooltip.Arrow className="fill-popover" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )

  // Collapsed sidebar — icon-only strip
  if (collapsed) {
    return (
      <aside className="w-14 flex flex-col items-center glass-panel rounded-2xl py-4 px-1 transition-all duration-300 gap-2 shrink-0">
        <CollapsedButton label="Expand sidebar" icon={PanelLeftOpen} onClick={onToggleCollapse} />
        <div className="h-px w-full bg-white/10 my-1" />
        <CollapsedButton label="New Chat" icon={Plus} onClick={onCreateStandaloneChat} className="text-primary" />
        <div className="flex-1" />
        <CollapsedButton label="Toggle theme" icon={Sun} onClick={onThemeToggle} />
        <CollapsedButton label="Settings" icon={Settings} onClick={onOpenSettings} />
      </aside>
    )
  }

  return (
    <aside className="w-64 flex flex-col glass-panel rounded-2xl p-4 transition-all duration-300 shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Gemini Local
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onThemeToggle}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
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
            onClick={toggleQuickChats}
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
                    <ChatContextMenu
                      chatId={c.id}
                      currentProjectId={null}
                      projects={projects}
                      onMove={onMoveChat}
                      onRename={onRenameChat}
                      onArchive={onArchiveChat}
                      onDelete={onDeleteChat}
                    />
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
            onClick={toggleProjects}
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

              {sortedProjects.map((p) => {
                const projectChats = chats.filter(c => c.projectId === p.id)
                const collapsed = isProjectCollapsed(p.id)
                const isEditing = editingProjectId === p.id

                return (
                  <div key={p.id} className="space-y-1">
                    <div
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group",
                        activeProjectId === p.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"
                      )}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <Folder className="h-4 w-4 shrink-0" />
                          <input
                            ref={projectInputRef}
                            type="text"
                            value={editedProjectName}
                            onChange={(e) => setEditedProjectName(e.target.value)}
                            onKeyDown={handleProjectKeyDown}
                            onBlur={saveProjectName}
                            className="flex-1 bg-white/10 border border-primary/50 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
                            maxLength={30}
                          />
                          <button
                            onClick={saveProjectName}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                          >
                            <Check className="h-3 w-3 text-green-400" />
                          </button>
                          <button
                            onClick={cancelEditingProject}
                            className="p-0.5 hover:bg-white/10 rounded transition-colors"
                          >
                            <X className="h-3 w-3 text-red-400" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={() => onSelectProject(p.id)}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleProjectChats(p.id)
                              }}
                              className="hover:bg-white/10 rounded p-0.5 transition-colors"
                            >
                              <ChevronDown className={cn("h-3 w-3 transition-transform", collapsed && "-rotate-90")} />
                            </button>
                            <Folder className="h-4 w-4 shrink-0" />
                            <span className="text-sm font-medium truncate">{p.name}</span>
                            {projectChats.length > 0 && (
                              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                                {projectChats.length}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditingProject(p)
                              }}
                              className="p-1 hover:text-primary"
                              title="Rename project"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteProject(p.id)
                              }}
                              className="p-1 hover:text-red-400"
                              title="Delete project"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {!collapsed && (
                      <div className="ml-4 pl-2 border-l border-white/10 space-y-1">
                        <button
                          onClick={() => {
                            onSelectProject(p.id)
                            onCreateChat()
                          }}
                          className="flex items-center gap-2 w-full p-1.5 text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                        >
                          <Plus className="h-3.5 w-3.5" /> New Chat
                        </button>
                        {projectChats.map(c => (
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
                            <ChatContextMenu
                              chatId={c.id}
                              currentProjectId={p.id}
                              projects={projects}
                              onMove={onMoveChat}
                              onRename={onRenameChat}
                              onArchive={onArchiveChat}
                              onDelete={onDeleteChat}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Archived Section */}
        {archivedChats.length > 0 && (
          <>
            <div className="h-px bg-white/10" />
            <div>
              <button
                onClick={toggleArchived}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", archivedCollapsed && "-rotate-90")} />
                <Archive className="h-3 w-3" />
                Archived
                <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">
                  {archivedChats.length}
                </span>
              </button>

              {!archivedCollapsed && (
                <div className="mt-1 space-y-1 pl-2">
                  {archivedChats.map(c => (
                    <div
                      key={c.id}
                      onClick={() => onSelectStandaloneChat(c.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors group opacity-60 hover:opacity-100",
                        activeChatId === c.id ? "text-primary font-medium bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate flex-1">{c.title}</span>
                      <ChatContextMenu
                        chatId={c.id}
                        currentProjectId={c.projectId}
                        projects={projects}
                        isArchived
                        onMove={onMoveChat}
                        onRename={onRenameChat}
                        onArchive={onArchiveChat}
                        onRestore={onRestoreChat}
                        onDelete={onDeleteChat}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 p-2 w-full rounded-lg hover:bg-white/5 text-sm text-muted-foreground transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  )
})
