"use client"

import { memo, useState, useRef, useEffect } from "react"
import { MessageSquare, Edit2, Check, X } from "lucide-react"
import { ModelSelect } from "@/components/ui/ModelSelect"

interface Model {
  name: string
  model: string
  digest: string
}

interface ChatHeaderProps {
  chatId: number | null
  chatTitle: string | undefined
  models: Model[]
  selectedModel: string
  onModelChange: (model: string) => void
  onTitleChange?: (id: number, title: string) => void
}

export const ChatHeader = memo(function ChatHeader({
  chatId,
  chatTitle,
  models,
  selectedModel,
  onModelChange,
  onTitleChange,
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(chatTitle || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Sync local edit state when prop changes (valid draft-state pattern)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditedTitle(chatTitle || "")
  }, [chatTitle])

  const handleSave = () => {
    if (chatId && editedTitle.trim() && onTitleChange) {
      onTitleChange(chatId, editedTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedTitle(chatTitle || "")
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MessageSquare className="h-5 w-5 text-primary shrink-0" />
        {isEditing && chatId ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-white/10 border border-primary/50 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={50}
            />
            <button
              onClick={handleSave}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Save"
            >
              <Check className="h-4 w-4 text-green-400" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Cancel"
            >
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group flex-1 min-w-0">
            <span className="font-medium truncate">
              {chatTitle || "Select a Chat"}
            </span>
            {chatId && onTitleChange && (
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                title="Edit chat title"
              >
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Model:</span>
        <ModelSelect
          models={models}
          value={selectedModel}
          onChange={onModelChange}
        />
      </div>
    </header>
  )
})
