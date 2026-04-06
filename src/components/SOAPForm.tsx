'use client'

import React, { useState } from 'react'
import { Plus, Trash2, Wand2, Save, ClipboardList, Pill, Activity, Stethoscope } from 'lucide-react'
import { createRecord } from '@/lib/actions/patients'
import { cn } from '@/lib/utils'

interface SOAPFormProps {
  patientId: string
  onSuccess?: () => void
}

export default function SOAPForm({ patientId, onSuccess }: SOAPFormProps) {
  const [medications, setMedications] = useState<{ id: string; name: string; dosage: string; frequency: string; indications: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  })

  const addMedication = () => {
    setMedications([...medications, { id: crypto.randomUUID(), name: '', dosage: '', frequency: '', indications: '' }])
  }

  const removeMedication = (id: string) => {
    setMedications(medications.filter(m => m.id !== id))
  }

  const handleSoapChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSoapData({ ...soapData, [e.target.name]: e.target.value })
  }

  const generateAutoNote = () => {
    const { subjective, objective, assessment, plan } = soapData
    let note = `RESUMEN CLÍNICO (SOAP)\n`
    note += `------------------------\n`
    if (subjective) note += `S: ${subjective}\n`
    if (objective) note += `O: ${objective}\n`
    if (assessment) note += `A: ${assessment}\n`
    if (plan) note += `P: ${plan}\n`
    
    if (medications.length > 0) {
      note += `\nPRESCRIPCIÓN:\n`
      medications.forEach(m => {
        if (m.name) note += `- ${m.name} (${m.dosage}, ${m.frequency}): ${m.indications}\n`
      })
    }

    // This could just alert or copy to clipboard for MVP
    alert(note)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.append('patient_id', patientId)

    try {
      await createRecord(formData)
      setSoapData({ subjective: '', objective: '', assessment: '', plan: '' })
      setMedications([])
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="space-y-8">
        {/* S - Subjetivo */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
            <ClipboardList size={16} className="text-blue-500" />
            Subjetivo (S)
          </label>
          <textarea
            name="subjective"
            value={soapData.subjective}
            onChange={handleSoapChange}
            placeholder="Motivo de consulta, síntomas reportados por el paciente..."
            className="w-full h-48 p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm placeholder:text-slate-300 leading-relaxed font-medium"
          />
        </div>

        {/* O - Objetivo */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
            <Activity size={16} className="text-indigo-500" />
            Objetivo (O)
          </label>
          <textarea
            name="objective"
            value={soapData.objective}
            onChange={handleSoapChange}
            placeholder="Signos vitales, hallazgos clínicos, exámenes realizados..."
            className="w-full h-48 p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm placeholder:text-slate-300 leading-relaxed font-medium"
          />
        </div>

        {/* A - Análisis */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
            <Stethoscope size={16} className="text-emerald-500" />
            Diagnóstico / Análisis (A)
          </label>
          <textarea
            name="assessment"
            value={soapData.assessment}
            onChange={handleSoapChange}
            placeholder="Diagnóstico clínico presuntivo o definitivo..."
            className="w-full h-48 p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-sm placeholder:text-slate-300 leading-relaxed font-medium"
          />
        </div>

        {/* P - Plan */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-[0.2em] pl-1">
            <Plus size={16} className="text-amber-500" />
            Plan de Tratamiento (P)
          </label>
          <textarea
            name="plan"
            value={soapData.plan}
            onChange={handleSoapChange}
            placeholder="Pasos a seguir, derivaciones, próxima cita..."
            className="w-full h-48 p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-sm placeholder:text-slate-300 leading-relaxed font-medium"
          />
        </div>
      </div>

      {/* Medicamentos Section */}
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
              <div key={med.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100 animate-in fade-in zoom-in-95 duration-200 group relative">
                <div className="space-y-1">
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
                    placeholder="Cada 8 horas"
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

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={generateAutoNote}
          className="w-full md:w-auto px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <Wand2 size={18} />
          Vista Previa de Nota Clínica
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
    </form>
  )
}
