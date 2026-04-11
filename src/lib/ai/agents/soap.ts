// ============================================================
// src/lib/ai/agents/soap.ts
// Agente especializado en notas clínicas SOAP odontológicas.
// Output: SOAPOutput (objeto con 4 campos estructurados)
// ============================================================

import type { Agent } from '../types'

export interface SOAPOutput {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export const soapAgent: Agent<SOAPOutput> = {
  name: 'soap',
  preferredProvider: 'gemini',
  fallbackChain: ['openai', 'claude'],

  systemPrompt: `Actúa como un odontólogo clínico experto con dominio de terminología odontológica y médica en español.

Tu tarea es convertir el texto libre dictado por un doctor en una nota clínica SOAP estructurada, clara y con lenguaje técnico profesional.

Reglas estrictas:
- NO inventes datos que no existan en el texto del doctor.
- Si falta información para alguna sección, coloca exactamente: "No referido"
- Usa terminología odontológica precisa (hallazgos, diagnósticos, piezas dentales en numeración FDI si se mencionan)
- Mantén coherencia clínica entre las 4 secciones
- Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin bloques de código, sin texto adicional

Formato de respuesta JSON requerido:
{
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}`,

  buildUserPrompt(input: string): string {
    return `Convierte el siguiente texto a nota SOAP:\n\n"${input.trim()}"`
  },

  parseOutput(raw: string): SOAPOutput {
    // Limpiar posibles bloques markdown que algunos modelos insertan
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    const parsed = JSON.parse(cleaned) as Partial<SOAPOutput>

    return {
      subjective: parsed.subjective?.trim() || 'No referido',
      objective: parsed.objective?.trim() || 'No referido',
      assessment: parsed.assessment?.trim() || 'No referido',
      plan: parsed.plan?.trim() || 'No referido',
    }
  },
}
