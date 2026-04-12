// ============================================================
// src/lib/ai/providers/gemini.ts
// Provider para Google Gemini usando el SDK oficial @google/generative-ai
// Requiere: GEMINI_API_KEY en .env.local
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProvider, GenerateOptions } from '../types'
import { AIError } from '../types'

// Modelos verificados y compatibles (en orden de fallback)
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

const RETRY_DELAY_MS = 1200 // Para mitigar rate limits (429)

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

    // 1. Inicialización correcta con API key usando el SDK oficial
    const genAI = new GoogleGenerativeAI(apiKey)
    let lastError: AIError | null = null

    // Intentar cada modelo en cascada ante 404 (No Encontrado) o 429
    for (const modelName of GEMINI_MODELS) {
      try {
        // 2. Uso correcto de getGenerativeModel
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          ...(options.systemPrompt && { systemInstruction: options.systemPrompt })
        })

        // Configuración de generación
        const generationConfig = {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxTokens ?? 1024,
          responseMimeType: options.jsonMode ? 'application/json' : 'text/plain',
        }

        // Llamada a la API
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: options.userPrompt }] }],
          generationConfig
        })

        const text = result.response.text()
        
        if (!text) {
          throw new AIError('Gemini no devolvió contenido.', 'API_ERROR', 'gemini')
        }

        // Guardamos el modelo existoso como state para el provider (opcional para metadata)
        // Eliminado porque 'model' es readonly en AIProvider (siempre reportará el primer modelo)

        return text
      } catch (error: any) {
        const errorMessage = error?.message || String(error)
        
        // 3. Detectar error 404 o modelo no encontrado y mostrar logs claros
        if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('is not found')) {
          console.warn(`[gemini] Modelo ${modelName} no encontrado (404), intentando con el siguiente...`)
          lastError = new AIError(`Modelo ${modelName} no disponible o no compatible.`, 'API_ERROR', 'gemini')
          continue
        }

        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.warn(`[gemini] Rate-limit (429) en ${modelName}, esperando para reintentar...`)
          lastError = new AIError('Límite de solicitudes de Gemini alcanzado.', 'RATE_LIMIT', 'gemini')
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
          continue
        }

        // Si es otro error de red o timeout, seguir intentando con el siguiente modelo
        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('503')) {
           console.warn(`[gemini] Error de red en ${modelName}, intentando siguiente...`)
           lastError = new AIError(`Error de red con la API de Gemini usando ${modelName}.`, 'API_ERROR', 'gemini')
           continue
        }
        
        // Si es un error crítico distinto y no cubierto, detenemos el fallback
        throw new AIError(`Error crítico con Gemini (${modelName}): ${errorMessage}`, 'API_ERROR', 'gemini')
      }
    }

    // 4. Si falla todo el fallback chain
    throw lastError ?? new AIError('Todos los modelos Gemini fallaron o no están disponibles en la región.', 'RATE_LIMIT', 'gemini')
  },
}
