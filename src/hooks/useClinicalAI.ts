import { useState, useCallback, useRef } from 'react'
import { generateDiagnosis, generateSOAPFromText } from '@/lib/actions/ai'
import { ToothStatus } from '@/types'
import { useToast } from '@/components/ui/Toast'

export interface AIResults {
  diagnosis: string
  treatment: string
  subjective: string
  objective: string
  assessment: string
  plan: string
}

const defaultAIResults: AIResults = {
  diagnosis: '', treatment: '', subjective: '', objective: '', assessment: '', plan: ''
}

export function useClinicalAI() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [aiResults, setAiResults] = useState<AIResults>(defaultAIResults)
  
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetAI = useCallback(() => setAiResults(defaultAIResults), [])

  const triggerAI = useCallback(async (
    currentTooth: number, 
    currentCondition: ToothStatus, 
    currentNotes: string,
    onSuccess: (newAi: AIResults) => void
  ) => {
    if (currentCondition === 'Sano') return
    setIsLoading(true)

    try {
      const context = `Pieza: ${currentTooth}, Estado: ${currentCondition}, Notas: ${currentNotes}`
      
      const [diagRes, soapRes] = await Promise.all([
        generateDiagnosis(context),
        generateSOAPFromText(context)
      ])

      if (diagRes.success && soapRes.success) {
        const newAi: AIResults = {
          diagnosis: diagRes.data.primary?.diagnosis || '',
          treatment: diagRes.data.recommendedExams?.join(', ') || '',
          subjective: soapRes.data.subjective || '',
          objective: soapRes.data.objective || '',
          assessment: soapRes.data.assessment || '',
          plan: soapRes.data.plan || ''
        }
        
        setAiResults(newAi)
        onSuccess(newAi)
        toast('IA: Sugerencias clínicas listas', 'success')
      }
    } catch (err) {
      toast('Error al consultar IA. Puedes ingresar los datos manualmente.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const debounceAI = useCallback((...args: Parameters<typeof triggerAI>) => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current)
    aiTimeoutRef.current = setTimeout(() => {
      triggerAI(...args)
    }, 600)
  }, [triggerAI])

  return { aiResults, isLoading, debounceAI, resetAI }
}
