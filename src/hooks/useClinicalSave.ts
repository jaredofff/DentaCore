import { useState, useCallback } from 'react'
import { saveOdontogramAndRecord } from '@/lib/actions/odontogram'
import { useToast } from '@/components/ui/Toast'
import { ToothStatus } from '@/types'
import type { AIResults } from './useClinicalAI'

export interface SaveClinicalParams {
  patientId: string
  selectedTooth: number | null
  condition: ToothStatus
  notes: string
  diagnosis: string
  plan: string
  aiResults: AIResults
  onSuccess: () => void
}

export function useClinicalSave() {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = useCallback(async ({
    patientId, selectedTooth, condition, notes, diagnosis, plan, aiResults, onSuccess
  }: SaveClinicalParams) => {
    if (!selectedTooth) return false
    
    setIsSaving(true)

    const odontogramForm = new FormData()
    odontogramForm.append('patient_id', patientId)
    odontogramForm.append('tooth_number', selectedTooth.toString())
    odontogramForm.append('status', condition)
    odontogramForm.append('notes', notes)

    let recordForm: FormData | null = null
    
    if (diagnosis || plan) {
      recordForm = new FormData()
      recordForm.append('patient_id', patientId)
      recordForm.append('subjective', aiResults.subjective || 'No referida')
      recordForm.append('objective', aiResults.objective || 'Ver odontograma')
      recordForm.append('assessment', diagnosis)
      recordForm.append('plan', plan)
    }

    try {
      const result = await saveOdontogramAndRecord(odontogramForm, recordForm)
      if ('success' in result && result.success) {
        toast('Registro guardado exitosamente', 'success')
        onSuccess()
        return true
      }
      toast('Error al guardar', 'error')
    } catch (err) {
      toast('Fallo de red', 'error')
    } finally {
      setIsSaving(false)
    }
    
    return false
  }, [toast])

  return { isSaving, handleSave }
}
