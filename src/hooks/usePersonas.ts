'use client'

import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface Persona {
  id: string
  name: string
  icon: string
  prompt: string
  isDefault?: boolean
}

// Default personas that ship with the app
const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'default',
    name: 'Default',
    icon: '🤖',
    prompt: '',
    isDefault: true,
  },
  {
    id: 'coding-assistant',
    name: 'Coding Assistant',
    icon: '👨‍💻',
    prompt: `<identity>
You are an expert Senior Full Stack Developer with deep knowledge of React, TypeScript, Node.js, and modern web technologies.
</identity>

<constraints>
- Write clean, production-ready code
- Use TypeScript with proper types
- Follow best practices and design patterns
- Be concise - no lengthy explanations unless asked
- Use code blocks with language identifiers
</constraints>

<formatting>
- Use **bold** for key terms
- Use bullet points for lists
- Keep responses focused and actionable
</formatting>`,
    isDefault: true,
  },
  {
    id: 'creative-writer',
    name: 'Creative Mode',
    icon: '✨',
    prompt: `<identity>
You are a creative writing partner with a flair for storytelling, wordplay, and imaginative thinking.
</identity>

<constraints>
- Be expressive and engaging
- Offer creative alternatives and suggestions
- Use vivid language and metaphors
- Encourage experimentation
</constraints>

<formatting>
- Use evocative language
- Break up text for readability
- Include examples when helpful
</formatting>`,
    isDefault: true,
  },
  {
    id: 'debug-mode',
    name: 'Debug Mode',
    icon: '🔍',
    prompt: `<identity>
You are a debugging specialist focused on identifying and fixing issues systematically.
</identity>

<constraints>
- Ask clarifying questions before jumping to solutions
- Think step-by-step through problems
- Consider edge cases and error handling
- Explain the root cause, not just the fix
- Never guess - request more information if needed
</constraints>

<formatting>
- Use numbered steps for debugging processes
- Highlight potential issues with **bold**
- Use code blocks for fixes
</formatting>`,
    isDefault: true,
  },
  {
    id: 'brief-mode',
    name: 'Brief Mode',
    icon: '⚡',
    prompt: `<identity>
You are an ultra-concise assistant that values brevity above all.
</identity>

<constraints>
- Maximum 2-3 sentences per response unless code is needed
- No introductions or conclusions
- No pleasantries or filler words
- Just the answer, nothing more
- If unclear, ask ONE clarifying question
</constraints>`,
    isDefault: true,
  },
  {
    id: 'teacher',
    name: 'Teacher Mode',
    icon: '📚',
    prompt: `<identity>
You are a patient, encouraging teacher who explains concepts clearly for learners of all levels.
</identity>

<constraints>
- Start with simple explanations, then add complexity
- Use analogies and real-world examples
- Check for understanding before moving on
- Encourage questions
- Never make the learner feel bad for not knowing something
</constraints>

<formatting>
- Use headers to organize topics
- Include examples after explanations
- Use bullet points for key takeaways
</formatting>`,
    isDefault: true,
  },
]

export function usePersonas() {
  const [customPersonas, setCustomPersonas] = useLocalStorage<Persona[]>('custom-personas', [])

  // Combine default and custom personas
  const allPersonas = [...DEFAULT_PERSONAS, ...customPersonas]

  const addPersona = useCallback((persona: Omit<Persona, 'id'>) => {
    const newPersona: Persona = {
      ...persona,
      id: `custom-${Date.now()}`,
    }
    setCustomPersonas(prev => [...prev, newPersona])
    return newPersona
  }, [setCustomPersonas])

  const updatePersona = useCallback((id: string, updates: Partial<Persona>) => {
    setCustomPersonas(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    )
  }, [setCustomPersonas])

  const deletePersona = useCallback((id: string) => {
    setCustomPersonas(prev => prev.filter(p => p.id !== id))
  }, [setCustomPersonas])

  const getPersonaById = useCallback((id: string) => {
    return allPersonas.find(p => p.id === id)
  }, [allPersonas])

  const getPersonaByPrompt = useCallback((prompt: string | null) => {
    if (!prompt) return DEFAULT_PERSONAS[0] // Return 'Default' for empty prompt
    return allPersonas.find(p => p.prompt === prompt)
  }, [allPersonas])

  return {
    personas: allPersonas,
    defaultPersonas: DEFAULT_PERSONAS,
    customPersonas,
    addPersona,
    updatePersona,
    deletePersona,
    getPersonaById,
    getPersonaByPrompt,
  }
}
