import { NextRequest, NextResponse } from 'next/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_TEXT_LENGTH = 100_000 // 100K characters

const SUPPORTED_EXTENSIONS = new Set([
  'pdf', 'docx',
  'txt', 'md', 'csv',
  'py', 'js', 'ts', 'tsx', 'jsx',
  'json', 'html', 'css',
  'java', 'c', 'cpp', 'go', 'rs', 'rb', 'php',
  'sh', 'yaml', 'yml', 'xml', 'sql',
])

const TEXT_MIME_PREFIXES = ['text/', 'application/json', 'application/xml']

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function isSupported(filename: string, mimeType: string): boolean {
  const ext = getExtension(filename)
  if (SUPPORTED_EXTENSIONS.has(ext)) return true
  if (TEXT_MIME_PREFIXES.some(p => mimeType.startsWith(p))) return true
  return false
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
        { status: 400 }
      )
    }

    if (!isSupported(file.name, file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.name}. Supported: PDF, DOCX, and text/code files.` },
        { status: 400 }
      )
    }

    const ext = getExtension(file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    let textContent = ''

    if (ext === 'pdf') {
      const { extractText } = await import('unpdf')
      const result = await extractText(new Uint8Array(buffer))
      textContent = result.text.join('\n')
    } else if (ext === 'docx') {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      textContent = result.value
    } else {
      // Plain text / code files
      textContent = buffer.toString('utf-8')
    }

    const truncated = textContent.length > MAX_TEXT_LENGTH
    if (truncated) {
      textContent = textContent.slice(0, MAX_TEXT_LENGTH)
    }

    return NextResponse.json({
      filename: file.name,
      mimeType: file.type,
      textContent,
      charCount: textContent.length,
      truncated,
    })
  } catch (error) {
    console.error('[Extract] Error processing file:', error)
    return NextResponse.json(
      { error: 'Failed to extract text from file.' },
      { status: 500 }
    )
  }
}
