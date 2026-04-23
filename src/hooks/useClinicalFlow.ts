'use client'

import { useCallback } from 'react'
import { ToothStatus, OdontogramRecord } from '@/types'
import { useOdontogramState } from './useOdontogramState'
import { useClinicalAI } from './useClinicalAI'
import { useClinicalSave } from './useClinicalSave'

/**
 * Hook Orquestador (Facade Pattern)
 * Combina los hooks especializados de estado, IA y persistencia
 * manteniendo exactamente la misma interfaz para los componentes UI existentes.
 */
export function useClinicalFlow(patientId: string, initialRecords: Record<number, OdontogramRecord>) {
  const state = useOdontogramState(initialRecords)
  const ai = useClinicalAI()
  const save = useClinicalSave()

  const handleToothSelect = useCallback((toothNumber: number) => {
    state.handleToothSelect(toothNumber)
    ai.resetAI()
  }, [state, ai])

  const handleConditionSelect = useCallback((newCondition: ToothStatus) => {
    state.setCondition(newCondition)
    
    // Si la condición requiere análisis y hay un diente seleccionado
    if (newCondition !== 'Sano' && state.selectedTooth) {
      ai.debounceAI(state.selectedTooth, newCondition, state.notes, (newAi) => {
        state.autoFillFromAI(newAi)
      })
    }
  }, [state, ai])

  const handleSave = useCallback(() => {
    return save.handleSave({
      patientId,
      selectedTooth: state.selectedTooth,
      condition: state.condition,
      notes: state.notes,
      diagnosis: state.diagnosis,
      plan: state.plan,
      aiResults: ai.aiResults,
      onSuccess: () => state.setSelectedTooth(null)
    })
  }, [patientId, state, ai, save])

  return {
    // 1. Estados Puros de Odontograma
    selectedTooth: state.selectedTooth,
    condition: state.condition,
    notes: state.notes,
    setNotes: state.setNotes,
    
    // 2. Estados de Notas Clínicas (SOAP)
    diagnosis: state.diagnosis,
    setDiagnosis: state.setDiagnosis,
    plan: state.plan,
    setPlan: state.setPlan,
    
    // 3. Flags de Edición
    isDiagnosisEdited: state.isDiagnosisEdited,
    setIsDiagnosisEdited: state.setIsDiagnosisEdited,
    isPlanEdited: state.isPlanEdited,
    setIsPlanEdited: state.setIsPlanEdited,
    
    // 4. Integración IA
    aiResults: ai.aiResults,
    isLoading: ai.isLoading,
    
    // 5. Integración Backend
    isSaving: save.isSaving,
    handleSave,
    
    // 6. Acciones de Orquestación
    handleToothSelect,
    handleConditionSelect,
    closePanel: () => state.setSelectedTooth(null)
  }
}
