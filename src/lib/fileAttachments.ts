// Types and utilities for file attachment message format

export interface AttachedFile {
  name: string
  type: string
  size: number
  charCount: number
  textContent: string
  truncated: boolean
}

export interface FileMetadata {
  name: string
  type: string
  size: number
  chars: number
}

/**
 * Build a message string with file content embedded using HTML comment delimiters.
 * Format:
 *   <!-- FILES:[{...metadata}] -->
 *   <!-- FILECONTENT:filename -->
 *   [text]
 *   <!-- /FILECONTENT -->
 *
 *   User's typed message
 */
export function buildFileMessage(text: string, files: AttachedFile[]): string {
  const metadata: FileMetadata[] = files.map(f => ({
    name: f.name,
    type: f.type,
    size: f.size,
    chars: f.charCount,
  }))

  let result = `<!-- FILES:${JSON.stringify(metadata)} -->\n`

  for (const file of files) {
    result += `<!-- FILECONTENT:${file.name} -->\n`
    result += file.textContent
    result += `\n<!-- /FILECONTENT -->\n`
  }

  if (text) {
    result += `\n${text}`
  }

  return result
}

/**
 * Extract FileMetadata array from a message that contains file attachments.
 * Returns null if the message doesn't contain file metadata.
 */
export function parseFileMetadata(content: string): FileMetadata[] | null {
  const match = content.match(/^<!-- FILES:(\[.*?\]) -->/)
  if (!match) return null

  try {
    return JSON.parse(match[1]) as FileMetadata[]
  } catch {
    return null
  }
}

/**
 * Strip file metadata and content blocks from a message,
 * returning only the user's typed text for display.
 */
export function stripFilePrefix(content: string): string {
  // Remove the FILES metadata line
  let result = content.replace(/^<!-- FILES:\[.*?\] -->\n?/, '')
  // Remove all FILECONTENT blocks
  result = result.replace(/<!-- FILECONTENT:.*? -->\n[\s\S]*?\n<!-- \/FILECONTENT -->\n?/g, '')
  return result.trim()
}

/**
 * Get a human-readable label for a file type based on MIME type or extension.
 */
export function getFileTypeLabel(mime: string, name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF'
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') return 'DOCX'
  if (ext === 'md') return 'MD'
  if (ext === 'csv') return 'CSV'
  if (ext === 'json') return 'JSON'
  if (ext === 'html') return 'HTML'
  if (ext === 'css') return 'CSS'
  if (ext === 'xml') return 'XML'
  if (ext === 'yaml' || ext === 'yml') return 'YAML'
  if (ext === 'sql') return 'SQL'
  if (ext === 'sh') return 'Shell'
  if (ext === 'py') return 'Python'
  if (ext === 'js') return 'JavaScript'
  if (ext === 'ts') return 'TypeScript'
  if (ext === 'tsx') return 'TSX'
  if (ext === 'jsx') return 'JSX'
  if (ext === 'java') return 'Java'
  if (ext === 'c') return 'C'
  if (ext === 'cpp') return 'C++'
  if (ext === 'go') return 'Go'
  if (ext === 'rs') return 'Rust'
  if (ext === 'rb') return 'Ruby'
  if (ext === 'php') return 'PHP'
  if (mime.startsWith('text/')) return 'Text'
  return ext.toUpperCase() || 'File'
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
