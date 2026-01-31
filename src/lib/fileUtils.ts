export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileTypeBadge(mimeType: string, filename: string): { label: string; className: string } {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf' || mimeType === 'application/pdf') return { label: 'PDF', className: 'bg-red-500/15 text-red-300' }
  if (ext === 'docx') return { label: 'DOCX', className: 'bg-blue-500/15 text-blue-300' }
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'go', 'rs', 'rb', 'c', 'cpp', 'php', 'sh', 'sql'].includes(ext))
    return { label: ext.toUpperCase(), className: 'bg-green-500/15 text-green-300' }
  if (['md', 'txt', 'csv'].includes(ext)) return { label: ext.toUpperCase(), className: 'bg-amber-500/15 text-amber-300' }
  return { label: ext.toUpperCase() || 'FILE', className: 'bg-purple-500/15 text-purple-300' }
}
