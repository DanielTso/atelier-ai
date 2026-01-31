'use client'

import { memo, useState, useEffect, useCallback } from "react"
import { Folder, Plus, MessageSquare, FileText, Loader2, CheckCircle2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatFileSize, getFileTypeBadge } from "@/lib/fileUtils"

interface ChatPreview {
  id: number
  title: string
  preview: string | null
  createdAt: Date | null
}

interface Document {
  id: number
  filename: string
  mimeType: string
  fileSize: number
  chunkCount: number | null
  status: string
}

interface ProjectLandingPageProps {
  project: { id: number; name: string }
  chatPreviews: ChatPreview[]
  loading: boolean
  onSelectChat: (chatId: number) => void
  onCreateChat: () => void
  onAddFiles: () => void
}

function formatShortDate(date: Date | null): string {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export const ProjectLandingPage = memo(function ProjectLandingPage({
  project,
  chatPreviews,
  loading,
  onSelectChat,
  onCreateChat,
  onAddFiles,
}: ProjectLandingPageProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(true)

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents?projectId=${project.id}`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
      }
    } catch {
      // Silently fail
    } finally {
      setDocsLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    setDocsLoading(true)
    loadDocuments()
  }, [loadDocuments])

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunkCount ?? 0), 0)
  const readyDocs = documents.filter(d => d.status === 'ready').length
  const processingDocs = documents.filter(d => d.status === 'processing').length
  const allReady = documents.length > 0 && processingDocs === 0
  const progressRatio = documents.length > 0 ? readyDocs / documents.length : 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border/40">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <Folder className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
      </div>

      {/* Two-column grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] overflow-hidden">
        {/* LEFT: Chats */}
        <div className="flex flex-col overflow-hidden lg:border-r border-border/30">
          {/* New Chat Row */}
          <button
            onClick={onCreateChat}
            className="flex items-center gap-3 mx-4 mt-4 px-4 py-3.5 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">New chat in {project.name}</span>
          </button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto mt-2 px-4 pb-4">
            {loading ? (
              <div className="space-y-3 mt-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-40 bg-muted/60 rounded" />
                      <div className="h-3 w-14 bg-muted/40 rounded" />
                    </div>
                    <div className="h-3 w-64 bg-muted/30 rounded mt-2.5" />
                  </div>
                ))}
              </div>
            ) : chatPreviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">No chats yet</p>
                <p className="text-xs mt-1 opacity-70">Start a conversation in this project</p>
              </div>
            ) : (
              <div className="mt-1">
                {chatPreviews.map((chat, idx) => (
                  <button
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors",
                      idx !== chatPreviews.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/60" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-sm text-foreground truncate">
                          {chat.title}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatShortDate(chat.createdAt)}
                        </span>
                      </div>
                      {chat.preview && (
                        <p className="text-xs text-muted-foreground/70 mt-1 truncate">
                          {chat.preview}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Files */}
        <div className="flex flex-col overflow-hidden border-t border-border/30 lg:border-t-0">
          {/* Files header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Files
            </h2>
            <button
              onClick={onAddFiles}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Upload documents"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar + status */}
          {documents.length > 0 && (
            <div className="px-5 pb-3 space-y-1.5">
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    allReady ? "bg-green-500/70" : "bg-amber-500/70"
                  )}
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {allReady ? (
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                  ) : (
                    <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                  )}
                  <span>{allReady ? "Ready" : "Indexing"}</span>
                </div>
                <span>{totalChunks} chunk{totalChunks !== 1 ? 's' : ''} indexed</span>
              </div>
            </div>
          )}

          {/* File cards */}
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {docsLoading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 mt-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse rounded-xl border border-border/30 p-3 h-24" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Upload className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">No files yet</p>
                <button
                  onClick={onAddFiles}
                  className="text-xs mt-1.5 text-primary/80 hover:text-primary transition-colors"
                >
                  Upload documents for RAG
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 mt-1">
                {documents.map(doc => {
                  const badge = getFileTypeBadge(doc.mimeType, doc.filename)
                  return (
                    <button
                      key={doc.id}
                      onClick={onAddFiles}
                      className="text-left rounded-xl border border-border/30 p-3 hover:bg-muted/30 hover:border-border/50 transition-colors group"
                    >
                      <span className={cn(
                        "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mb-2",
                        badge.className
                      )}>
                        {badge.label}
                      </span>
                      <p className="text-sm text-foreground truncate leading-tight">
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                        {doc.status === 'ready' && doc.chunkCount != null && (
                          <span>{doc.chunkCount} chunk{doc.chunkCount !== 1 ? 's' : ''}</span>
                        )}
                        {doc.status === 'processing' && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                            Indexing
                          </span>
                        )}
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
