// ============================================================
// src/lib/ai/core/orchestrator.ts
// Cerebro del sistema multi-agente.
//
// Responsabilidades:
//  1. Resolver qué provider usar para cada agente
//  2. Ejecutar con fallback automático ante fallos
//  3. Retornar resultado tipado con metadatos de ejecución
// ============================================================

import { getProvider, getAvailableProviders } from '../providers'
import { getAgent } from '../agents'
import { AIError } from '../types'
import type { AgentName, ProviderName, OrchestratorResult, GenerateOptions } from '../types'

export interface RunAgentOptions {
  /** Forzar un provider específico, ignorando el preferido del agente */
  forceProvider?: ProviderName
  temperature?: number
  maxTokens?: number
}

/**
 * Ejecuta un agente con selección automática de provider y fallback.
 *
 * @param agentName - Nombre del agente a ejecutar
 * @param input     - Texto de entrada del usuario / doctor
 * @param options   - Opciones opcionales de ejecución
 *
 * @example
 * const result = await runAgent('soap', 'Paciente de 32 años con dolor...')
 * console.log(result.data.subjective)  // texto estructurado
 * console.log(result.provider)         // 'gemini' | 'openai' | 'claude'
 */
export async function runAgent<T = unknown>(
  agentName: AgentName,
  input: string,
  options: RunAgentOptions = {}
): Promise<OrchestratorResult<T>> {
  const agent = getAgent(agentName)

  // Construir cadena de providers a intentar
  let providerChain: ProviderName[]

  if (options.forceProvider) {
    providerChain = [options.forceProvider]
  } else {
    // preferido del agente + fallbacks definidos por el agente
    const all = [agent.preferredProvider, ...agent.fallbackChain]
    // Deduplicar preservando orden
    providerChain = [...new Set(all)]
  }

  // Filtrar providers que no tienen API key (evita intentos inútiles)
  const availableNames = new Set(getAvailableProviders().map(p => p.name))
  const filteredChain = providerChain.filter(name => availableNames.has(name))

  if (filteredChain.length === 0) {
    throw new AIError(
      'Ningún provider de IA está configurado. Agrega al menos una API key en .env.local.',
      'NO_PROVIDERS'
    )
  }

  const userPrompt = agent.buildUserPrompt(input)
  const generateOptions: GenerateOptions = {
    systemPrompt: agent.systemPrompt,
    userPrompt,
    temperature: options.temperature ?? 0.2,
    maxTokens: options.maxTokens ?? 1024,
    jsonMode: true,
  }

  let attemptCount = 0
  const errors: string[] = []

  for (const providerName of filteredChain) {
    attemptCount++
    const provider = getProvider(providerName)

    try {
      console.log(`[orchestrator] Intentando ${providerName} (modelo: ${provider.model}) para agente "${agentName}"`)
      const rawText = await provider.generateText(generateOptions)

      // Parsear output con el método del agente
      let parsed: T
      try {
        parsed = agent.parseOutput(rawText) as T
      } catch (parseErr) {
        console.error(`[orchestrator] Parse error en ${providerName}:`, parseErr)
        errors.push(`${providerName}: error al parsear respuesta`)
        continue
      }

      console.log(`[orchestrator] ✓ Éxito con ${providerName} en intento ${attemptCount}`)
      return {
        data: parsed,
        provider: providerName,
        model: provider.model,
        attemptCount,
      }

    } catch (err) {
      if (err instanceof AIError) {
        // Rate limit → intentar siguiente
        if (err.code === 'RATE_LIMIT') {
          console.warn(`[orchestrator] Rate limit en ${providerName}, usando fallback...`)
          errors.push(`${providerName}: rate limit`)
          continue
        }
        // No configurado → saltar silenciosamente
        if (err.code === 'NOT_CONFIGURED') {
          errors.push(`${providerName}: no configurado`)
          continue
        }
      }
      // Cualquier otro error API → intentar siguiente
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[orchestrator] Error en ${providerName}:`, message)
      errors.push(`${providerName}: ${message}`)
      continue
    }
  }

  // Todos los providers fallaron
  throw new AIError(
    `No se pudo completar la tarea "${agentName}" con ningún provider disponible. ` +
    `Errores: ${errors.join(' | ')}`,
    'NO_PROVIDERS'
  )
}

/**
 * Versión simplificada para texto plano (agentes que devuelven string).
 */
export async function runTextAgent(
  agentName: AgentName,
  input: string,
  options: RunAgentOptions = {}
): Promise<OrchestratorResult<string>> {
  return runAgent<string>(agentName, input, options)
}
