'use client'

import React, { useState } from 'react'
import { Sparkles, Save, RefreshCw, Loader2, Activity } from 'lucide-react'
import { generateSOAPFromText } from '@/lib/actions/ai'
import { createRecord } from '@/lib/actions/patients'

interface SOAPFormProps {
  patientId?: string
  onSuccess?: () => void
}

export default function SOAPForm({ patientId, onSuccess }: SOAPFormProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [soapData, setSoapData] = useState<{
    subjective: string
    objective: string
    assessment: string
    plan: string
  } | null>(null)

  const handleGenerate = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    try {
      // Mantenemos tu Server Action actual que funciona equivalente al fetch POST
      const response = await generateSOAPFromText(input)
      if (response.success) {
        setSoapData(response.data)
      } else {
        alert(response.error)
      }
    } catch (error) {
      console.error(error)
      alert("Error al generar nota SOAP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!soapData || !patientId) return
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('patient_id', patientId)
      formData.append('subjective', soapData.subjective)
      formData.append('objective', soapData.objective)
      formData.append('assessment', soapData.assessment)
      formData.append('plan', soapData.plan)
      
      await createRecord(formData)
      if (onSuccess) onSuccess()
    } catch (error) {
      alert("Error al guardar la historia.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full bg-slate-50/50 p-4 md:p-8 rounded-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        
        {/* COLUMNA IZQUIERDA: INPUT */}
        <div className="h-full">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Asistente Clínico IA</h3>
                <p className="text-sm text-slate-500">Dictado libre para estructurar SOAP</p>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-4">
              <textarea
                className="flex-1 w-full min-h-[300px] p-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none resize-none transition-all placeholder:text-slate-400"
                placeholder="Ejemplo clínico: Paciente femenina de 34 años con dolor en molar inferior derecho de 3 días de evolución, irradiado al cuello. A la exploración clínica se observa..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              
              <button
                onClick={handleGenerate}
                disabled={isLoading || !input.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isLoading ? 'Analizando y Estructurando...' : '✨ Generar con IA'}
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESULTADO SOAP */}
        <div className="h-full">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Nota Estructurada</h3>
                <p className="text-sm text-slate-500">Resultado SOAP listo para revisión</p>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              {soapData ? (
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md text-slate-500">S</span> Subjetivo
                    </h4>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 break-words whitespace-pre-wrap">{soapData.subjective}</div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md text-slate-500">O</span> Objetivo
                    </h4>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 break-words whitespace-pre-wrap">{soapData.objective}</div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md text-slate-500">A</span> Análisis
                    </h4>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 break-words whitespace-pre-wrap">{soapData.assessment}</div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                       <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md text-slate-500">P</span> Plan
                    </h4>
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 break-words whitespace-pre-wrap">{soapData.plan}</div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 min-h-[300px]">
                  <p className="text-slate-400 text-sm font-medium text-center px-4">
                    La nota SOAP estructurada aparecerá aquí<br/>después de usar la IA.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={!soapData || isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerar
              </button>
              <button
                onClick={handleSave}
                disabled={!soapData || isSaving}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Historia
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
