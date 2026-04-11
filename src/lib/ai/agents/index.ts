// ============================================================
// src/lib/ai/agents/index.ts
// Registro central de agentes.
// ============================================================

import { soapAgent } from './soap'
import { diagnosisAgent } from './diagnosis'
import { summaryAgent } from './summary'
import { consentAgent } from './consent'
import type { Agent, AgentName } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const agentRegistry: Record<AgentName, Agent<any>> = {
  soap: soapAgent,
  diagnosis: diagnosisAgent,
  summary: summaryAgent,
  consent: consentAgent,
}

export function getAgent(name: AgentName): Agent<unknown> {
  const agent = agentRegistry[name]
  if (!agent) throw new Error(`Agente "${name}" no registrado.`)
  return agent
}

export { soapAgent, diagnosisAgent, summaryAgent, consentAgent }
export type { SOAPOutput } from './soap'
export type { DiagnosisOutput, DiagnosisEntry } from './diagnosis'
export type { SummaryOutput } from './summary'
export type { ConsentOutput } from './consent'
