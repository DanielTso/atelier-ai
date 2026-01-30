'use client'

import { memo, useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { getSetting, setSettings } from '@/app/actions'

export const ApiSettingsTab = memo(function ApiSettingsTab({
  onSettingsChanged,
}: {
  onSettingsChanged?: () => void
}) {
  const [geminiKey, setGeminiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const [key, url] = await Promise.all([
        getSetting('gemini-api-key'),
        getSetting('ollama-base-url'),
      ])
      if (key) setGeminiKey(key)
      if (url) setOllamaUrl(url)
      setLoaded(true)
    }
    load()
  }, [])

  const handleTestOllama = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })
      setTestResult(res.ok ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries: { key: string; value: string }[] = []
      if (geminiKey) entries.push({ key: 'gemini-api-key', value: geminiKey })
      entries.push({ key: 'ollama-base-url', value: ollamaUrl })
      await setSettings(entries)
      onSettingsChanged?.()
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gemini API Key */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Google Gemini API Key</label>
        <p className="text-xs text-muted-foreground">
          Required for Gemini models. Get a key from Google AI Studio.
        </p>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full px-3 py-2 pr-10 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors text-muted-foreground"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Ollama URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Ollama Server URL</label>
        <p className="text-xs text-muted-foreground">
          URL where your Ollama instance is running.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={ollamaUrl}
            onChange={(e) => {
              setOllamaUrl(e.target.value)
              setTestResult(null)
            }}
            placeholder="http://localhost:11434"
            className="flex-1 px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            type="button"
            onClick={handleTestOllama}
            disabled={testing}
            className="px-3 py-2 text-sm rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {testing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : testResult === 'success' ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
            ) : testResult === 'error' ? (
              <XCircle className="h-3.5 w-3.5 text-red-400" />
            ) : null}
            Test
          </button>
        </div>
        {testResult === 'success' && (
          <p className="text-xs text-green-400">Connected successfully</p>
        )}
        {testResult === 'error' && (
          <p className="text-xs text-red-400">Could not connect to Ollama at this URL</p>
        )}
      </div>

      {/* Save */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save API Settings
        </button>
      </div>
    </div>
  )
})
