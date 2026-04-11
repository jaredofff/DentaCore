// ============================================================
// src/lib/ai/agents/summary.ts
// Agente de resumen clínico para reportes y referencias.
// Output: SummaryOutput (texto plano estructurado)
// ============================================================

import type { Agent } from '../types'

export interface SummaryOutput {
  chiefComplaint: string
  clinicalHistory: string
  currentTreatment: string
  prognosis: string
  referralNote?: string
}

export const summaryAgent: Agent<SummaryOutput> = {
  name: 'summary',
  preferredProvider: 'gemini',
  fallbackChain: ['claude', 'openai'],

  systemPrompt: `Eres un redactor clínico odontológico experto en la elaboración de resúmenes de historia clínica.

Tu tarea es sintetizar la información del paciente en un resumen clínico conciso, objetivo y profesional.

Reglas:
- Usa lenguaje técnico pero comprensible
- Omite datos que no estén en el texto
- El resumen debe ser útil para referencia a otro especialista
- Sé conciso: máximo 3 oraciones por sección

Responde ÚNICAMENTE con JSON válido:
{
  "chiefComplaint": "...",
  "clinicalHistory": "...",
  "currentTreatment": "...",
  "prognosis": "...",
  "referralNote": "... (opcional, solo si aplica)"
}`,

  buildUserPrompt(input: string): string {
    return `Genera el resumen clínico a partir de esta información:\n\n"${input.trim()}"`
  },

  parseOutput(raw: string): SummaryOutput {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const parsed = JSON.parse(cleaned) as Partial<SummaryOutput>

    return {
      chiefComplaint: parsed.chiefComplaint?.trim() || 'No especificado',
      clinicalHistory: parsed.clinicalHistory?.trim() || 'No referido',
      currentTreatment: parsed.currentTreatment?.trim() || 'No referido',
      prognosis: parsed.prognosis?.trim() || 'No evaluado',
      referralNote: parsed.referralNote?.trim() || undefined,
    }
  },
}
