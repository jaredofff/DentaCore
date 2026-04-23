import { runAgent } from '@/lib/ai/core/orchestrator'
import type { ProviderName } from '@/lib/ai/types'
import type { SOAPOutput, DiagnosisOutput, SummaryOutput, ConsentOutput } from '@/lib/ai/agents'

// 1. Manejo de Errores Tipados
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// 2. Tipado estricto de Agentes
export enum ClinicalAgentType {
  SOAP = 'soap',
  DIAGNOSIS = 'diagnosis',
  SUMMARY = 'summary',
  CONSENT = 'consent'
}

// Interface base para las respuestas del servicio
export interface ClinicalServiceResponse<T> {
  data: T
  provider: ProviderName
  model: string
  attemptCount: number
  metadata: {
    timestamp: string
    inputLength: number
  }
}

/**
 * Servicio encargado de la lógica de negocio relacionada con la IA clínica.
 * Validaciones fuertes, transformación de datos y metadata para producción.
 */
export class ClinicalAIService {
  
  /**
   * Helper privado para transformar la respuesta bruta de la IA,
   * inyectar metadata y estandarizar la salida del servicio.
   */
  private static transformResponse<T>(
    rawResult: { data: T; provider: ProviderName; model: string; attemptCount: number },
    inputLength: number
  ): ClinicalServiceResponse<T> {
    return {
      // 3. Capa de transformación (Data Mapper)
      data: rawResult.data,
      provider: rawResult.provider,
      model: rawResult.model,
      attemptCount: rawResult.attemptCount,
      // 4. Metadata inyectada
      metadata: {
        timestamp: new Date().toISOString(),
        inputLength
      }
    }
  }

  /**
   * Genera una nota SOAP estructurada a partir de texto libre.
   */
  static async generateSOAP(input: string, forceProvider?: ProviderName): Promise<ClinicalServiceResponse<SOAPOutput>> {
    const sanitizedInput = input?.trim() || ''
    
    if (sanitizedInput.length < 10) {
      throw new ValidationError('El texto es muy corto. Proporciona más información clínica.')
    }
    
    const rawResult = await runAgent<SOAPOutput>(ClinicalAgentType.SOAP, sanitizedInput, { forceProvider })
    return this.transformResponse<SOAPOutput>(rawResult, sanitizedInput.length)
  }

  /**
   * Genera un diagnóstico diferencial a partir de datos clínicos.
   */
  static async generateDiagnosis(clinicalData: string, forceProvider?: ProviderName): Promise<ClinicalServiceResponse<DiagnosisOutput>> {
    const sanitizedInput = clinicalData?.trim() || ''
    
    if (sanitizedInput.length < 20) {
      throw new ValidationError('Proporciona más datos clínicos para el diagnóstico.')
    }
    
    const rawResult = await runAgent<DiagnosisOutput>(ClinicalAgentType.DIAGNOSIS, sanitizedInput, { forceProvider })
    return this.transformResponse<DiagnosisOutput>(rawResult, sanitizedInput.length)
  }

  /**
   * Genera un resumen clínico para referencia.
   */
  static async generateClinicalSummary(clinicalData: string, forceProvider?: ProviderName): Promise<ClinicalServiceResponse<SummaryOutput>> {
    const sanitizedInput = clinicalData?.trim() || ''
    
    if (sanitizedInput.length < 20) {
      throw new ValidationError('Proporciona suficiente información para generar el resumen.')
    }
    
    const rawResult = await runAgent<SummaryOutput>(ClinicalAgentType.SUMMARY, sanitizedInput, { forceProvider })
    return this.transformResponse<SummaryOutput>(rawResult, sanitizedInput.length)
  }

  /**
   * Genera un consentimiento informado para procedimientos.
   */
  static async generateInformedConsent(procedureDescription: string, forceProvider?: ProviderName): Promise<ClinicalServiceResponse<ConsentOutput>> {
    const sanitizedInput = procedureDescription?.trim() || ''
    
    if (sanitizedInput.length < 10) {
      throw new ValidationError('Describe el procedimiento para generar el consentimiento.')
    }
    
    const rawResult = await runAgent<ConsentOutput>(ClinicalAgentType.CONSENT, sanitizedInput, { forceProvider })
    return this.transformResponse<ConsentOutput>(rawResult, sanitizedInput.length)
  }
}
