'use client'

import { useLocalStorage } from './useLocalStorage'

export type FontSize = 'small' | 'medium' | 'large'
export type MessageDensity = 'compact' | 'comfortable' | 'spacious'

export function useAppearanceSettings() {
  const [fontSize, setFontSize] = useLocalStorage<FontSize>('app-font-size', 'medium')
  const [messageDensity, setMessageDensity] = useLocalStorage<MessageDensity>('app-message-density', 'comfortable')

  return {
    fontSize,
    setFontSize,
    messageDensity,
    setMessageDensity,
  }
}
