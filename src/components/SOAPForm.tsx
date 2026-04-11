'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Save, ClipboardList, Pill, Activity, Stethoscope, Mic, Sparkles, X, FileText } from 'lucide-react'
import { createRecord } from '@/lib/actions/patients'
import { generateSOAPFromText } from '@/lib/actions/ai'
import type { SOAPOutput } from '@/lib/ai/agents'
import { cn } from '@/lib/utils'
import { useToast } from './ui/Toast'

interface SOAPFormProps {
  patientId: string
  onSuccess?: () => void
}

export default function SOAPForm({ patientId, onSuccess }: SOAPFormProps) {
  const { toast } = useToast()
  const [medications, setMedications] = useState<{ id: string; name: string; dosage: string; frequency: string; duration: string; indications: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dictationText, setDictationText] = useState('')
  const [showDictation, setShowDictation] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  })

  const addMedication = () => {
    setMedications([...medications, { id: crypto.randomUUID(), name: '', dosage: '', frequency: '', duration: '', indications: '' }])
  }

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id))
  }

  const handleSoapChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSoapData({ ...soapData, [e.target.name]: e.target.value })
  }

  const handleGenerateWithAI = async () => {
    if (!dictationText.trim()) {
      toast('Escribe el texto clínico antes de generar.', 'error')
      return
    }
    setIsGenerating(true)
    try {
      const response = await generateSOAPFromText(dictationText)

      if (!response.success) {
        toast(response.error, 'error')
        return
      }

      const result: SOAPOutput = response.data
      setSoapData({
        subjective: result.subjective,
        objective: result.objective,
        assessment: result.assessment,
        plan: result.plan
      })
      setShowDictation(false)
      toast(`Nota SOAP generada con ${response.meta.provider} · ${response.meta.model}`, 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast(message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.append('patient_id', patientId)

    try {
      await createRecord(formData)
      toast('Historia clínica guardada con éxito', 'success')
      setSoapData({ subjective: '', objective: '', assessment: '', plan: '' })
      setMedications([])
      setDictationText('')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
      toast('Error al guardar la historia clínica', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const soapFields = [
    { key: 'subjective', label: 'Subjetivo (S)', icon: <ClipboardList size={16} className="text-blue-500" />, color: 'blue', placeholder: 'Motivo de consulta, síntomas reportados por el paciente...' },
    { key: 'objective', label: 'Objetivo (O)', icon: <Activity size={16} className="text-indigo-500" />, color: 'indigo', placeholder: 'Signos vitales, hallazgos clínicos, exámenes realizados...' },
    { key: 'assessment', label: 'Diagnóstico / Análisis (A)', icon: <Stethoscope size={16} className="text-emerald-500" />, color: 'emerald', placeholder: 'Diagnóstico clínico presuntivo o definitivo...' },
    { key: 'plan', label: 'Plan de Tratamiento (P)', icon: <Plus size={16} className="text-amber-500" />, color: 'amber', placeholder: 'Pasos a seguir, derivaciones, próxima cita...' },
  ] as const

  const focusRingMap = {
    blue: 'focus:ring-blue-500/10 focus:border-blue-500',
    indigo: 'focus:ring-indigo-500/10 focus:border-indigo-500',
    emerald: 'focus:ring-emerald-500/10 focus:border-emerald-500',
    amber: 'focus:ring-amber-500/10 focus:border-amber-500',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">

      {/* === AI DICTATION PANEL === */}
      <div className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDictation(v => !v)}
          className="w-full flex items-center justify-between p-6 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-violet-200 group-hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </div>
            <div className="text-left">
              <p className="font-extrabold text-slate-800 text-sm">Generar Nota SOAP con IA</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Describe el caso en texto libre y la IA estructurará los campos automáticamente</p>
            </div>
          </div>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all text-violet-400",
            showDictation ? "bg-violet-100 rotate-45" : "bg-white border border-violet-100 rotate-0"
          )}>
            {showDictation ? <X size={16} /> : <Plus size={16} />}
          </div>
        </button>

        {showDictation && (
          <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative">
              <Mic size={16} className="absolute top-4 left-4 text-violet-400 pointer-events-none" />
              <textarea
                value={dictationText}
                onChange={e => setDictationText(e.target.value)}
                placeholder={`Ejemplo: "Paciente femenina de 34 años que acude por dolor en el cuadrante inferior derecho de 3 días de evolución, espontáneo, irradiado al oído. A la exploración se observa caries profunda en pieza 46 con exposición pulpar probable. Se toma radiografía periapical. Diagnóstico de pulpitis irreversible. Se inicia tratamiento de conductos en sesión 1, apertura cameral, instrumentación con limas K hasta 25/06..."`}
                rows={6}
                className="w-full pl-10 pr-4 py-4 bg-white border border-violet-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none text-sm placeholder:text-slate-300 leading-relaxed font-medium resize-none"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !dictationText.trim()}
              className={cn(
                "w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all",
                isGenerating || !dictationText.trim()
                  ? "bg-violet-100 text-violet-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200/60 hover:shadow-violet-300/70 hover:scale-[1.01] active:scale-[0.99]"
              )}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando nota clínica...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Estructurar en SOAP con IA
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* === SOAP FIELDS === */}
      <div className="space-y-8">
        {soapFields.map(field => (
          <div key={field.key} className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
              {field.icon}
              {field.label}
              {soapData[field.key] && (
                <span className="ml-auto text-[9px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full uppercase tracking-widest">
                  IA ✓
                </span>
              )}
            </label>
            <textarea
              name={field.key}
              value={soapData[field.key]}
              onChange={handleSoapChange}
              placeholder={field.placeholder}
              className={cn(
                "w-full h-48 p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] focus:ring-4 transition-all outline-none text-sm placeholder:text-slate-300 leading-relaxed font-medium",
                focusRingMap[field.color],
                soapData[field.key] && "border-slate-200 bg-white"
              )}
            />
          </div>
        ))}
      </div>

      {/* === MEDICATIONS === */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-3 text-lg">
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
              <Pill size={22} />
            </div>
            Receta y Farmacoterapia
          </h3>
          <button
            type="button"
            onClick={addMedication}
            className="text-xs font-bold bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Medicamento
          </button>
        </div>

        {medications.length > 0 ? (
          <div className="space-y-4">
            {medications.map((med) => (
              <div key={med.id} className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 group relative">
                <div className="col-span-2 md:col-span-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                  <input
                    name="med_name[]"
                    placeholder="Amoxicilina..."
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dosis</label>
                  <input
                    name="med_dosage[]"
                    placeholder="500 mg"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Frecuencia</label>
                  <input
                    name="med_frequency[]"
                    placeholder="C/ 8 horas"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Duración</label>
                  <input
                    name="med_duration[]"
                    placeholder="7 días"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-1 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Indicaciones</label>
                  <div className="flex gap-2">
                    <input
                      name="med_indications[]"
                      placeholder="Post-tratamiento..."
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => removeMedication(med.id)}
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
            <p className="text-slate-400 text-sm font-medium">No se han prescrito medicamentos en esta sesión.</p>
          </div>
        )}
      </div>

      {/* === FOOTER ACTIONS === */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          disabled={!soapData.subjective && !soapData.objective && !soapData.assessment && !soapData.plan}
          className="w-full md:w-auto px-6 py-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText size={18} />
          Vista Previa
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full md:w-60 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200",
            isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
          )}
        >
          <Save size={20} />
          {isSubmitting ? 'Guardando...' : 'Guardar Historia'}
        </button>
      </div>

      {/* === PREVIEW MODAL === */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><FileText size={20} /></div>
                Resumen Clínico SOAP
              </h2>
              <button type="button" onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-8 space-y-6 font-mono text-sm leading-relaxed text-slate-700">
              {[
                { label: 'S — Subjetivo', value: soapData.subjective, color: 'text-blue-600' },
                { label: 'O — Objetivo', value: soapData.objective, color: 'text-indigo-600' },
                { label: 'A — Análisis / Diagnóstico', value: soapData.assessment, color: 'text-emerald-600' },
                { label: 'P — Plan', value: soapData.plan, color: 'text-amber-600' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className={`font-extrabold text-xs uppercase tracking-widest mb-1 ${color}`}>{label}</p>
                  <p className="whitespace-pre-wrap bg-slate-50 rounded-2xl p-4 text-slate-600">{value || 'Sin datos.'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
