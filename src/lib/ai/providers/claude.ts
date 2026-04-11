// ============================================================
// src/lib/ai/providers/claude.ts
// Provider para Anthropic Claude (api.anthropic.com)
// Requiere: ANTHROPIC_API_KEY en .env.local
// ============================================================

import type { AIProvider, GenerateOptions } from '../types'
import { AIError } from '../types'

const CLAUDE_MODEL = 'claude-3-haiku-20240307' // Más rápido y económico del stack Claude

export const claudeProvider: AIProvider = {
  name: 'claude',
  model: CLAUDE_MODEL,

  isAvailable() {
    return Boolean(process.env.ANTHROPIC_API_KEY)
  },

  async generateText(options: GenerateOptions): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new AIError('ANTHROPIC_API_KEY no configurada.', 'NOT_CONFIGURED', 'claude')
    }

    // Claude usa system como campo de primer nivel, no dentro de messages
    const body: Record<string, unknown> = {
      model: CLAUDE_MODEL,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.2,
      system: options.systemPrompt,
      messages: [
        { role: 'user', content: options.userPrompt },
      ],
    }

    let res: Response
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw new AIError('Error de red con Claude.', 'API_ERROR', 'claude')
    }

    if (res.status === 429) {
      throw new AIError('Rate limit en Claude.', 'RATE_LIMIT', 'claude')
    }

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`[claude] HTTP ${res.status}:`, errBody)
      throw new AIError(`Claude API error ${res.status}.`, 'API_ERROR', 'claude')
    }

    const data = await res.json()
    // Claude devuelve content como array de bloques
    const text: string | undefined = data?.content?.[0]?.text

    if (!text) {
      throw new AIError('Claude no devolvió contenido.', 'API_ERROR', 'claude')
    }

    return text
  },
}
