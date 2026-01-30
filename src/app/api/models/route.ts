import { NextResponse } from 'next/server';
import { getGeminiApiKey, getOllamaBaseUrl } from '@/lib/settings';

export async function GET() {
  // Only include Gemini models if an API key is configured
  const geminiApiKey = await getGeminiApiKey();
  const geminiModels = geminiApiKey ? [
    { name: 'Gemini 3 Flash', model: 'gemini-3-flash-preview', digest: 'gemini-3-flash-preview' },
    { name: 'Gemini 3 Pro', model: 'gemini-3-pro-preview', digest: 'gemini-3-pro-preview' },
    { name: 'Gemini 3 Deep Think', model: 'gemini-3-deep-think', digest: 'gemini-3-deep-think' },
  ] : [];

  // Try to fetch local Ollama models using configured URL
  const ollamaBaseUrl = await getOllamaBaseUrl();
  let ollamaModels: { name: string; model: string; digest: string }[] = [];
  try {
    const ollamaRes = await fetch(`${ollamaBaseUrl}/api/tags`, {
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    if (ollamaRes.ok) {
      const data = await ollamaRes.json();
      ollamaModels = data.models || [];
    }
  } catch {
    // Ollama not available, continue with Gemini only
    console.log('[Models API] Ollama not available, using Gemini models only');
  }

  // Combine both model types
  const allModels = [...geminiModels, ...ollamaModels];

  return NextResponse.json({ models: allModels }, {
    headers: {
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    }
  });
}
