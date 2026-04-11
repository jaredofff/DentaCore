// ============================================================
// src/lib/ai/types.ts
// Contratos centrales del sistema multi-agente.
// Toda la arquitectura depende de estos tipos.
// ============================================================

/** Proveedores de IA disponibles */
export type ProviderName = 'gemini' | 'openai' | 'claude'

/** Agentes especializados disponibles */
export type AgentName = 'soap' | 'diagnosis' | 'summary' | 'consent'

// ─── Provider Interface ─────────────────────────────────────

export interface GenerateOptions {
  systemPrompt: string
  userPrompt: string
  temperature?: number     // 0-1, default 0.2
  maxTokens?: number       // default 1024
  jsonMode?: boolean       // forzar salida JSON donde el modelo lo soporte
}

/**
 * Contrato que TODOS los providers deben implementar.
 * Al agregar un nuevo proveedor, solo implementa esta interfaz.
 */
export interface AIProvider {
  readonly name: ProviderName
  readonly model: string
  /** Verifica si la API key está configurada */
  isAvailable(): boolean
  /** Genera texto. Lanza AIError en caso de fallo. */
  generateText(options: GenerateOptions): Promise<string>
}

// ─── Agent Interface ────────────────────────────────────────

/**
 * Contrato de un agente especializado.
 * TOutput es el tipo de dato que devuelve el agente tras parsear la respuesta.
 */
export interface Agent<TOutput = string> {
  readonly name: AgentName
  readonly systemPrompt: string
  /** Provider preferido para este agente */
  readonly preferredProvider: ProviderName
  /** Cadena de fallback si el preferido falla */
  readonly fallbackChain: ProviderName[]
  /** Construye el mensaje de usuario a partir del input crudo */
  buildUserPrompt(input: string): string
  /** Parsea la respuesta cruda del modelo al tipo esperado */
  parseOutput(raw: string): TOutput
}

// ─── Orchestrator Result ────────────────────────────────────

export interface OrchestratorResult<T = string> {
  data: T
  provider: ProviderName
  model: string
  /** Cuántos intentos se necesitaron (1 = sin fallback) */
  attemptCount: number
}

// ─── Error Types ─────────────────────────────────────────────

export type AIErrorCode =
  | 'RATE_LIMIT'
  | 'NOT_CONFIGURED'
  | 'API_ERROR'
  | 'PARSE_ERROR'
  | 'NO_PROVIDERS'

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: AIErrorCode,
    public readonly provider?: ProviderName
  ) {
    super(message)
    this.name = 'AIError'
  }
}
