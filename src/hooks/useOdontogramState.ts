import { useState, useCallback, useRef, useEffect } from 'react'
import { ToothStatus, OdontogramRecord } from '@/types'
import type { AIResults } from './useClinicalAI'

export function useOdontogramState(initialRecords: Record<number, OdontogramRecord>) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [condition, setCondition] = useState<ToothStatus>('Sano')
  const [notes, setNotes] = useState('')
  
  const [diagnosis, setDiagnosis] = useState('')
  const [plan, setPlan] = useState('')
  
  const [isDiagnosisEdited, setIsDiagnosisEdited] = useState(false)
  const [isPlanEdited, setIsPlanEdited] = useState(false)

  // Usamos Refs para evitar bugs de stale closures en los callbacks asíncronos de la IA
  const isDiagEditedRef = useRef(isDiagnosisEdited)
  const isPlanEditedRef = useRef(isPlanEdited)

  useEffect(() => {
    isDiagEditedRef.current = isDiagnosisEdited
  }, [isDiagnosisEdited])

  useEffect(() => {
    isPlanEditedRef.current = isPlanEdited
  }, [isPlanEdited])

  const handleToothSelect = useCallback((toothNumber: number) => {
    setSelectedTooth(toothNumber)
    const existing = initialRecords[toothNumber]
    setCondition(existing?.status || 'Sano')
    setNotes(existing?.notes ? String(existing.notes) : '')
    
    setDiagnosis('')
    setPlan('')
    setIsDiagnosisEdited(false)
    setIsPlanEdited(false)
  }, [initialRecords])

  const autoFillFromAI = useCallback((newAi: AIResults) => {
    setDiagnosis(prev => isDiagEditedRef.current ? prev : (newAi.diagnosis || newAi.assessment))
    setPlan(prev => isPlanEditedRef.current ? prev : newAi.plan)
  }, [])

  return {
    selectedTooth, setSelectedTooth,
    condition, setCondition,
    notes, setNotes,
    diagnosis, setDiagnosis,
    plan, setPlan,
    isDiagnosisEdited, setIsDiagnosisEdited,
    isPlanEdited, setIsPlanEdited,
    handleToothSelect,
    autoFillFromAI
  }
}
