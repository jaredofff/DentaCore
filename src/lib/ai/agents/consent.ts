// ============================================================
// src/lib/ai/agents/consent.ts
// Agente generador de consentimiento informado odontológico.
// Output: ConsentOutput (texto legal-clínico completo)
// ============================================================

import type { Agent } from '../types'

export interface ConsentOutput {
  procedure: string
  description: string
  risks: string[]
  benefits: string[]
  alternatives: string[]
  patientDeclaration: string
}

export const consentAgent: Agent<ConsentOutput> = {
  name: 'consent',
  preferredProvider: 'claude',  // Claude es más preciso en redacción formal/legal
  fallbackChain: ['openai', 'gemini'],

  systemPrompt: `Eres un especialista en documentación clínico-legal odontológica, con conocimiento de las normas NOM-004-SSA3-2012 (México) sobre expediente clínico.

Tu tarea es generar un consentimiento informado estructurado para el procedimiento dental indicado.

Contenido requerido:
- Nombre del procedimiento
- Descripción clara para el paciente (sin tecnicismos excesivos)
- Riesgos y complicaciones posibles (3-6 puntos)
- Beneficios esperados (2-4 puntos)
- Alternativas de tratamiento disponibles (1-3 puntos)
- Declaración del paciente (texto estándar de aceptación)

Responde ÚNICAMENTE con JSON válido:
{
  "procedure": "...",
  "description": "...",
  "risks": ["...", "..."],
  "benefits": ["...", "..."],
  "alternatives": ["...", "..."],
  "patientDeclaration": "..."
}`,

  buildUserPrompt(input: string): string {
    return `Genera el consentimiento informado para el siguiente procedimiento o situación clínica:\n\n"${input.trim()}"`
  },

  parseOutput(raw: string): ConsentOutput {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const parsed = JSON.parse(cleaned) as Partial<ConsentOutput>

    return {
      procedure: parsed.procedure?.trim() || 'Procedimiento dental',
      description: parsed.description?.trim() || 'No especificado',
      risks: parsed.risks ?? ['No especificados'],
      benefits: parsed.benefits ?? ['No especificados'],
      alternatives: parsed.alternatives ?? ['Ninguna alternativa disponible'],
      patientDeclaration: parsed.patientDeclaration?.trim() ||
        'He sido informado sobre el procedimiento, sus riesgos y alternativas, y acepto voluntariamente el tratamiento propuesto.',
    }
  },
}
