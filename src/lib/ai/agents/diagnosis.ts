// ============================================================
// src/lib/ai/agents/diagnosis.ts
// Agente de diagnóstico diferencial odontológico.
// Output: DiagnosisOutput (lista de diagnósticos con probabilidad)
// ============================================================

import type { Agent } from '../types'

export interface DiagnosisEntry {
  diagnosis: string       // Nombre del diagnóstico (CIE-10 si aplica)
  probability: 'alta' | 'media' | 'baja'
  rationale: string       // Justificación clínica breve
}

export interface DiagnosisOutput {
  primary: DiagnosisEntry
  differentials: DiagnosisEntry[]
  recommendedExams: string[]
}

export const diagnosisAgent: Agent<DiagnosisOutput> = {
  name: 'diagnosis',
  preferredProvider: 'openai',   // GPT-4o-mini tiene mejor razonamiento clínico
  fallbackChain: ['gemini', 'claude'],

  systemPrompt: `Eres un odontólogo especialista con experiencia en diagnóstico diferencial clínico.

Analiza los datos clínicos proporcionados y genera un diagnóstico diferencial estructurado.

Reglas:
- Usa nomenclatura dental y médica en español
- Prioriza diagnósticos más probables según los datos disponibles
- Incluye entre 2 y 4 diagnósticos diferenciales
- Sugiere exámenes complementarios si son clínicamente relevantes
- NO inventes síntomas ni hallazgos que no estén en el texto

Responde ÚNICAMENTE con JSON válido en este formato exacto:
{
  "primary": {
    "diagnosis": "...",
    "probability": "alta",
    "rationale": "..."
  },
  "differentials": [
    { "diagnosis": "...", "probability": "media", "rationale": "..." }
  ],
  "recommendedExams": ["...", "..."]
}`,

  buildUserPrompt(input: string): string {
    return `Genera el diagnóstico diferencial basándote en estos datos clínicos:\n\n"${input.trim()}"`
  },

  parseOutput(raw: string): DiagnosisOutput {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const parsed = JSON.parse(cleaned) as Partial<DiagnosisOutput>

    return {
      primary: parsed.primary ?? {
        diagnosis: 'No determinado',
        probability: 'baja',
        rationale: 'Datos insuficientes para diagnóstico primario.',
      },
      differentials: parsed.differentials ?? [],
      recommendedExams: parsed.recommendedExams ?? [],
    }
  },
}
