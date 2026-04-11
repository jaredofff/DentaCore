// ============================================================
// src/lib/ai/providers/index.ts
// Registro central de providers.
// Para agregar un nuevo provider: impleméntalo y regístralo aquí.
// ============================================================

import { geminiProvider } from './gemini'
import { openaiProvider } from './openai'
import { claudeProvider } from './claude'
import type { AIProvider, ProviderName } from '../types'

/** Mapa de todos los providers registrados */
export const providerRegistry: Record<ProviderName, AIProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
  claude: claudeProvider,
}

/**
 * Devuelve un provider por nombre.
 * @throws Error si el nombre no está registrado.
 */
export function getProvider(name: ProviderName): AIProvider {
  const provider = providerRegistry[name]
  if (!provider) throw new Error(`Provider "${name}" no registrado.`)
  return provider
}

/** Devuelve solo los providers que tienen API key configurada */
export function getAvailableProviders(): AIProvider[] {
  return Object.values(providerRegistry).filter(p => p.isAvailable())
}

export { geminiProvider, openaiProvider, claudeProvider }
