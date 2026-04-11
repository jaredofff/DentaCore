// ============================================================
// src/lib/ai/providers/gemini.ts
// Provider para Google Gemini (generativelanguage.googleapis.com)
// Requiere: GEMINI_API_KEY en .env.local
// ============================================================

import type { AIProvider, GenerateOptions } from '../types'
import { AIError } from '../types'

// Modelos verificados en la API v1beta (en orden de cuota gratuita más alta → más baja)
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite', // Mayor cuota gratuita
  'gemini-1.5-flash',      // Fallback estable y verificado
  'gemini-2.0-flash',      // Más capaz, menor cuota
]

const RETRY_DELAY_MS = 1200 // Suficiente para evitar rate limits en cascada

function buildUrl(model: string, apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
}

async function callModel(
  model: string,
  apiKey: string,
  options: GenerateOptions
): Promise<Response> {
  const body = {
    system_instruction: {
      parts: [{ text: options.systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: options.userPrompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxTokens ?? 1024,
      topK: 20,
      topP: 0.9,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  return fetch(buildUrl(model, apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const geminiProvider: AIProvider = {
  name: 'gemini',
  model: GEMINI_MODELS[0],

  isAvailable() {
    return Boolean(process.env.GEMINI_API_KEY)
  },

  async generateText(options: GenerateOptions): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new AIError('GEMINI_API_KEY no configurada.', 'NOT_CONFIGURED', 'gemini')
    }

    let lastError: AIError | null = null

    // Intentar cada modelo en cascada ante 429
    for (const model of GEMINI_MODELS) {
      let res: Response
      try {
        res = await callModel(model, apiKey, options)
      } catch {
        lastError = new AIError('Error de red con Gemini.', 'API_ERROR', 'gemini')
        continue
      }

      if (res.status === 429) {
        console.warn(`[gemini] rate-limit en ${model}, intentando siguiente...`)
        lastError = new AIError('Rate limit en Gemini.', 'RATE_LIMIT', 'gemini')
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
        continue
      }

      if (!res.ok) {
        const body = await res.text()
        console.warn(`[gemini] HTTP ${res.status} en ${model}, intentando siguiente...`, body.slice(0, 120))
        lastError = new AIError(`Gemini API error ${res.status} en ${model}.`, 'API_ERROR', 'gemini')
        continue // intentar con el siguiente modelo, no abortar el loop
      }

      const data = await res.json()
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new AIError('Gemini no devolvió contenido.', 'API_ERROR', 'gemini')
      }

      return text
    }

    throw lastError ?? new AIError('Todos los modelos Gemini fallaron.', 'RATE_LIMIT', 'gemini')
  },
}
