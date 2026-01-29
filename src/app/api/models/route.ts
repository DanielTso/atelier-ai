import { NextResponse } from 'next/server';

export async function GET() {
  // Gemini 3 Models (Premium Subscription)
  const geminiModels = [
    { name: 'Gemini 3 Flash', model: 'gemini-3-flash-preview', digest: 'gemini-3-flash-preview' },
    { name: 'Gemini 3 Pro', model: 'gemini-3-pro-preview', digest: 'gemini-3-pro-preview' },
    { name: 'Gemini 3 Deep Think', model: 'gemini-3-deep-think', digest: 'gemini-3-deep-think' },
  ];

  // Try to fetch local Ollama models
  let ollamaModels: { name: string; model: string; digest: string }[] = [];
  try {
    const ollamaRes = await fetch('http://localhost:11434/api/tags', {
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
