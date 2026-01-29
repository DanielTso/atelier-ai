import { NextResponse } from 'next/server';

export async function GET() {
              // Add Gemini Models
              const geminiModels = [
                { name: 'Gemini 3 Pro (Preview)', model: 'gemini-3-pro-preview', digest: 'gemini-3-pro-preview' },
                { name: 'Gemini 3 Flash (Preview)', model: 'gemini-3-flash-preview', digest: 'gemini-3-flash-preview' },
                { name: 'Gemini 2.5 Flash', model: 'gemini-2.5-flash', digest: 'gemini-2.5-flash' },
                { name: 'Gemini 1.5 Pro (Latest)', model: 'gemini-1.5-pro-latest', digest: 'gemini-1.5-pro-latest' },
                { name: 'Gemini 1.5 Flash (Latest)', model: 'gemini-1.5-flash-latest', digest: 'gemini-1.5-flash-latest' },
              ];

    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      const data = await response.json();
  
      // Combine lists
      data.models = [...geminiModels, ...(data.models || [])];
  
      return NextResponse.json(data);
    } catch (error) {
      console.warn('Ollama not reachable, returning only cloud models:', error);
      return NextResponse.json({ models: geminiModels });
    }
  }
