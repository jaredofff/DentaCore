'use client'

import React, { useState } from 'react'
import { generateSOAPFromText } from '@/lib/actions/ai'
import { createRecord } from '@/lib/actions/patients'
import { SOAPFormUI, SOAPData } from './SOAPFormUI'
import { useToast } from '@/components/ui/Toast' // Asumiendo que existe el hook

interface SOAPFormProps {
  patientId?: string
  onSuccess?: () => void
}

/**
 * Componente Contenedor (Smart Component)
 * Maneja el estado, las reglas de negocio y la integración con Server Actions.
 * NO contiene JSX complejo (Tailwind), delega todo al componente Presentacional.
 */
export default function SOAPForm({ patientId, onSuccess }: SOAPFormProps) {
  const { toast } = useToast()
  const [input, setInput] = useState('')
  
  // Separación clara de loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [soapData, setSoapData] = useState<SOAPData | null>(null)

  const handleGenerate = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    
    try {
      const response = await generateSOAPFromText(input)
      if (response.success) {
        setSoapData(response.data)
        toast('Nota generada con éxito', 'success')
      } else {
        toast(response.error || 'Error al procesar la IA', 'error')
      }
    } catch (error) {
      console.error(error)
      toast("Fallo crítico al generar nota SOAP", 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!soapData || !patientId) {
      toast('Faltan datos para guardar', 'error')
      return
    }
    
    setIsSaving(true)
    
    try {
      // Formateamos los datos para el Action
      const formData = new FormData()
      formData.append('patient_id', patientId)
      formData.append('subjective', soapData.subjective)
      formData.append('objective', soapData.objective)
      formData.append('assessment', soapData.assessment)
      formData.append('plan', soapData.plan)
      
      await createRecord(formData)
      
      toast('Historia guardada exitosamente', 'success')
      if (onSuccess) onSuccess()
      
      // Opcional: limpiar form después de guardar
      setInput('')
      setSoapData(null)
    } catch (error) {
      toast("Error al guardar la historia clínica.", 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SOAPFormUI 
      input={input}
      setInput={setInput}
      isLoading={isLoading}
      isSaving={isSaving}
      soapData={soapData}
      onGenerate={handleGenerate}
      onSave={handleSave}
    />
  )
}
