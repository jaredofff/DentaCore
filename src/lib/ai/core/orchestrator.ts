// ============================================================
// src/lib/ai/core/orchestrator.ts
// Cerebro del sistema multi-agente optimizado para producción.
//
// Mejoras:
//  1. Caché en memoria con TTL (10 min)
//  2. Deduplicación de peticiones (inflight requests)
//  3. Backoff exponencial para Rate Limits (429)
//  4. Manejo de fallos críticos (401, 404) para evitar reintentos inútiles
//  5. Fallback final a respuestas Mock seguras
// ============================================================

import { getProvider, getAvailableProviders } from '../providers'
import { getAgent } from '../agents'
import { AIError } from '../types'
import type { AgentName, ProviderName, OrchestratorResult, GenerateOptions } from '../types'
import { createHash } from 'crypto'

// ─── CONFIGURACIÓN DE PRODUCCIÓN ─────────────────────────────────────────────

const MAX_ATTEMPTS_PER_PROVIDER = 2
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutos
const DEFAULT_BACKOFF_MS = 500

// ─── ALMACENAMIENTO TEMPORAL (EN MEMORIA) ────────────────────────────────────

interface CachedEntry {
  result: OrchestratorResult<any>
  timestamp: number
}

const cache = new Map<string, CachedEntry>()
const inflight = new Map<string, Promise<OrchestratorResult<any>>>()

// ─── UTILERÍAS ────────────────────────────────────────────────────────────────

function generateCacheKey(agentName: string, input: string): string {
  const hash = createHash('sha256').update(input).digest('hex').substring(0, 16)
  return `${agentName}:${hash}`
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Respuestas de emergencia si todos los proveedores fallan.
 * Esto evita pantallas en blanco o errores 500 en producción.
 */
function getMockResponse<T>(agentName: AgentName): T {
  const mocks: Record<AgentName, any> = {
    soap: {
      subjective: 'No disponible.',
      objective: 'No disponible.',
      assessment: 'Error de conexión con la IA. Por favor, ingrese el diagnóstico manualmente.',
      plan: 'Revisar manualmente.'
    },
    diagnosis: {
      primary: { diagnosis: 'Error de servidor de IA', probability: 'baja', rationale: 'Fallo general de red' },
      differentials: [],
      recommendedExams: []
    },
    summary: { summary: 'Resumen no disponible por fallos técnicos.', focusAreas: [] },
    consent: { content: 'Documento de consentimiento no generado automáticamente. Proceda manualmente.' }
  }
  return mocks[agentName] as T
}

// ─── ORCHESTRATOR PRINCIPAL ──────────────────────────────────────────────────

export interface RunAgentOptions {
  forceProvider?: ProviderName
  temperature?: number
  maxTokens?: number
  skipCache?: boolean
}

/**
 * Ejecuta un agente con lógica avanzada de resiliencia y eficiencia.
 */
export async function runAgent<T = unknown>(
  agentName: AgentName,
  input: string,
  options: RunAgentOptions = {}
): Promise<OrchestratorResult<T>> {
  const startTime = Date.now()
  const cacheKey = generateCacheKey(agentName, input)

  // 1. Verificar Caché (Si no se forza el salto)
  if (!options.skipCache) {
    const cached = cache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      console.log(`[orchestrator] ⚡ Cache Hit para ${cacheKey}`)
      return cached.result as OrchestratorResult<T>
    }
  }

  // 2. Deduplicación (Inflight requests)
  const pending = inflight.get(cacheKey)
  if (pending) {
    console.log(`[orchestrator] 🔗 Reutilizando petición en curso para ${cacheKey}`)
    return pending as Promise<OrchestratorResult<T>>
  }

  // 3. Iniciar ejecución y registrar en inflight
  const executionPromise = (async () => {
    try {
      const result = await executeWithRetry<T>(agentName, input, options)
      
      // Guardar en caché si tuvo éxito
      cache.set(cacheKey, { result, timestamp: Date.now() })
      return result
    } finally {
      // Limpiar de inflight al terminar (éxito o error)
      inflight.delete(cacheKey)
    }
  })()

  inflight.set(cacheKey, executionPromise)
  return executionPromise
}

/**
 * Lógica interna de reintentos y fallback entre proveedores.
 */
async function executeWithRetry<T>(
  agentName: AgentName,
  input: string,
  options: RunAgentOptions
): Promise<OrchestratorResult<T>> {
  const agent = getAgent(agentName)
  const startTime = Date.now()

  // Construir cadena de proveedores
  let providerChain: ProviderName[] = options.forceProvider 
    ? [options.forceProvider] 
    : [...new Set([agent.preferredProvider, ...agent.fallbackChain])]

  // Filtrar disponibles
  const availableProviderNames = new Set(getAvailableProviders().map(p => p.name))
  const filteredChain = providerChain.filter(name => availableProviderNames.has(name))

  if (filteredChain.length === 0) {
    throw new AIError('Servicios de IA no configurados.', 'NO_PROVIDERS')
  }

  const generateOptions: GenerateOptions = {
    systemPrompt: agent.systemPrompt,
    userPrompt: agent.buildUserPrompt(input),
    temperature: options.temperature ?? 0.2,
    maxTokens: options.maxTokens ?? 1024,
    jsonMode: true,
  }

  const errors: string[] = []
  let globalAttempt = 0

  for (const providerName of filteredChain) {
    const provider = getProvider(providerName)
    let backoff = DEFAULT_BACKOFF_MS

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_PROVIDER; attempt++) {
      globalAttempt++
      
      try {
        console.log(`[orchestrator] [${providerName}] Intento ${attempt}/${MAX_ATTEMPTS_PER_PROVIDER} para "${agentName}"`)
        const rawText = await provider.generateText(generateOptions)
        const parsed = agent.parseOutput(rawText) as T

        const duration = Date.now() - startTime
        console.log(`[orchestrator] ✅ Éxito con ${providerName} (${duration}ms, total intentos: ${globalAttempt})`)
        
        return {
          data: parsed,
          provider: providerName,
          model: provider.model,
          attemptCount: globalAttempt,
        }

      } catch (err: any) {
        const duration = Date.now() - startTime
        const code = err instanceof AIError ? err.code : 'API_ERROR'
        
        console.error(`[orchestrator] ❌ Error en ${providerName} (Intento ${attempt}): ${err.message}`)
        errors.push(`${providerName}[${attempt}]: ${err.message}`)

        // ─── LÓGICA DE DECISIÓN DE ERROR ───

        // 1. Errores fatales de configuración/auth: No reintentar este proveedor
        if (code === 'UNAUTHORIZED' || code === 'NOT_CONFIGURED' || code === 'MODEL_NOT_FOUND') {
          break // Salir del loop de reintentos de este proveedor
        }

        // 2. Rate Limit: Aplicar Backoff y reintentar si queda cupo
        if (code === 'RATE_LIMIT') {
          if (attempt < MAX_ATTEMPTS_PER_PROVIDER) {
            console.warn(`[orchestrator] ⏳ Rate limit. Esperando ${backoff}ms para reintentar...`)
            await sleep(backoff)
            backoff *= 2 // Exponencial
            continue
          }
        }

        // 3. Otros errores (API_ERROR, PARSE_ERROR): Reintentar una vez más si es posible
        if (attempt < MAX_ATTEMPTS_PER_PROVIDER) {
          continue
        }
      }
    }
    // Si llegamos aquí, este proveedor falló todos sus intentos, probamos el siguiente de la cadena
  }

  // 4. FALLBACK FINAL (MOCK)
  // Si estamos aquí, todos los proveedores fallaron
  console.error(`[orchestrator] 🔥 TODOS LOS PROVEEDORES FALLARON. Errores: ${errors.join(' | ')}`)
  console.warn(`[orchestrator] 🛡️ Activando respuesta de emergencia (MOCK) para "${agentName}"`)

  return {
    data: getMockResponse<T>(agentName),
    provider: filteredChain[0], // Referencia al primario aunque falló
    model: 'emergency-mock',
    attemptCount: globalAttempt,
  }
}

/**
 * Versión simplificada para texto plano.
 */
export async function runTextAgent(
  agentName: AgentName,
  input: string,
  options: RunAgentOptions = {}
): Promise<OrchestratorResult<string>> {
  return runAgent<string>(agentName, input, options)
}
