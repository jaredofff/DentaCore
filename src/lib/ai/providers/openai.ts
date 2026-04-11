// ============================================================
// src/lib/ai/providers/openai.ts
// Provider para OpenAI (api.openai.com)
// Requiere: OPENAI_API_KEY en .env.local
// ============================================================

import type { AIProvider, GenerateOptions } from '../types'
import { AIError } from '../types'

const OPENAI_MODEL = 'gpt-4o-mini' // Rápido, barato y capaz para tareas clínicas

export const openaiProvider: AIProvider = {
  name: 'openai',
  model: OPENAI_MODEL,

  isAvailable() {
    return Boolean(process.env.OPENAI_API_KEY)
  },

  async generateText(options: GenerateOptions): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new AIError('OPENAI_API_KEY no configurada.', 'NOT_CONFIGURED', 'openai')
    }

    const body: Record<string, unknown> = {
      model: OPENAI_MODEL,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 1024,
      messages: [
        { role: 'system', content: options.systemPrompt },
        { role: 'user', content: options.userPrompt },
      ],
    }

    // JSON mode nativo de OpenAI
    if (options.jsonMode) {
      body.response_format = { type: 'json_object' }
    }

    let res: Response
    try {
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      })
    } catch {
      throw new AIError('Error de red con OpenAI.', 'API_ERROR', 'openai')
    }

    if (res.status === 429) {
      throw new AIError('Rate limit en OpenAI.', 'RATE_LIMIT', 'openai')
    }

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`[openai] HTTP ${res.status}:`, errBody)
      throw new AIError(`OpenAI API error ${res.status}.`, 'API_ERROR', 'openai')
    }

    const data = await res.json()
    const text: string | undefined = data?.choices?.[0]?.message?.content

    if (!text) {
      throw new AIError('OpenAI no devolvió contenido.', 'API_ERROR', 'openai')
    }

    return text
  },
}
