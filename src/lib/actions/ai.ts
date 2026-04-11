'use server'
// ============================================================
// src/lib/actions/ai.ts
// Server Actions públicas para el sistema de IA.
// REGLA: Solo exportar funciones async — Turbopack no admite
// re-exportar tipos desde archivos 'use server'.
// Para tipos, importar directamente desde '@/lib/ai/agents'.
// ============================================================

import { runAgent } from '@/lib/ai/core/orchestrator'
import { AIError } from '@/lib/ai/types'
import type { SOAPOutput } from '@/lib/ai/agents'
import type { DiagnosisOutput } from '@/lib/ai/agents'
import type { SummaryOutput } from '@/lib/ai/agents'
import type { ConsentOutput } from '@/lib/ai/agents'
import type { ProviderName } from '@/lib/ai/types'

// ─── Tipos de respuesta (internos — no re-exportar desde 'use server') ──────

interface ActionResult<T> {
  success: true
  data: T
  meta: { provider: ProviderName; model: string; attempts: number }
}

interface ActionError {
  success: false
  error: string
}

type ActionResponse<T> = ActionResult<T> | ActionError

function handleAIError(err: unknown): ActionError {
  if (err instanceof AIError) {
    switch (err.code) {
      case 'NOT_CONFIGURED':
        return { success: false, error: 'Clave de API no configurada. Revisa tu .env.local.' }
      case 'RATE_LIMIT':
        return { success: false, error: 'Límite de solicitudes alcanzado. Espera unos segundos e intenta de nuevo.' }
      case 'NO_PROVIDERS':
        return { success: false, error: 'No hay proveedores de IA disponibles. Configura al menos una API key.' }
      case 'PARSE_ERROR':
        return { success: false, error: 'Error al interpretar la respuesta de la IA. Intenta nuevamente.' }
      default:
        return { success: false, error: err.message }
    }
  }
  const message = err instanceof Error ? err.message : 'Error desconocido'
  return { success: false, error: message }
}

// ─── SOAP Action ─────────────────────────────────────────────

/**
 * Genera una nota SOAP a partir de texto libre dictado por el doctor.
 * Compatibilidad: reemplaza el uso anterior de generateSOAPFromText.
 */
export async function generateSOAPFromText(
  input: string,
  forceProvider?: ProviderName
): Promise<ActionResponse<SOAPOutput>> {
  if (!input || input.trim().length < 10) {
    return { success: false, error: 'El texto es muy corto. Proporciona más información clínica.' }
  }

  try {
    const result = await runAgent<SOAPOutput>('soap', input, { forceProvider })
    return {
      success: true,
      data: result.data,
      meta: { provider: result.provider, model: result.model, attempts: result.attemptCount },
    }
  } catch (err) {
    return handleAIError(err)
  }
}

// ─── Diagnosis Action ─────────────────────────────────────────

/**
 * Genera un diagnóstico diferencial odontológico a partir de datos clínicos.
 */
export async function generateDiagnosis(
  clinicalData: string,
  forceProvider?: ProviderName
): Promise<ActionResponse<DiagnosisOutput>> {
  if (!clinicalData || clinicalData.trim().length < 20) {
    return { success: false, error: 'Proporciona más datos clínicos para el diagnóstico.' }
  }

  try {
    const result = await runAgent<DiagnosisOutput>('diagnosis', clinicalData, { forceProvider })
    return {
      success: true,
      data: result.data,
      meta: { provider: result.provider, model: result.model, attempts: result.attemptCount },
    }
  } catch (err) {
    return handleAIError(err)
  }
}

// ─── Summary Action ───────────────────────────────────────────

/**
 * Genera un resumen clínico para referencia o derivación.
 */
export async function generateClinicalSummary(
  clinicalData: string,
  forceProvider?: ProviderName
): Promise<ActionResponse<SummaryOutput>> {
  if (!clinicalData || clinicalData.trim().length < 20) {
    return { success: false, error: 'Proporciona suficiente información para generar el resumen.' }
  }

  try {
    const result = await runAgent<SummaryOutput>('summary', clinicalData, { forceProvider })
    return {
      success: true,
      data: result.data,
      meta: { provider: result.provider, model: result.model, attempts: result.attemptCount },
    }
  } catch (err) {
    return handleAIError(err)
  }
}

// ─── Consent Action ───────────────────────────────────────────

/**
 * Genera un consentimiento informado estructurado para un procedimiento dental.
 */
export async function generateInformedConsent(
  procedureDescription: string,
  forceProvider?: ProviderName
): Promise<ActionResponse<ConsentOutput>> {
  if (!procedureDescription || procedureDescription.trim().length < 10) {
    return { success: false, error: 'Describe el procedimiento para generar el consentimiento.' }
  }

  try {
    const result = await runAgent<ConsentOutput>('consent', procedureDescription, { forceProvider })
    return {
      success: true,
      data: result.data,
      meta: { provider: result.provider, model: result.model, attempts: result.attemptCount },
    }
  } catch (err) {
    return handleAIError(err)
  }
}
