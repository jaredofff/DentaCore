'use client'

import React from 'react'
import { Save, Loader2, MousePointer2, Sparkles, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react'
import { ToothStatus } from '@/types'

interface ClinicalInspectionPanelProps {
  selectedTooth: number
  condition: ToothStatus
  notes: string
  setNotes: (val: string) => void
  // UI States for the form
  diagnosis: string
  setDiagnosis: (val: string) => void
  plan: string
  setPlan: (val: string) => void
  // Flags to detect manual interaction
  setIsDiagnosisEdited: (val: boolean) => void
  setIsPlanEdited: (val: boolean) => void
  // AI References (for visual comparison or suggestions)
  aiResults: {
    diagnosis: string
    treatment: string
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  isLoading: boolean
  isSaving: boolean
  handleConditionSelect: (status: ToothStatus) => void
  handleSave: () => void
  closePanel: () => void
  statusOptions: { label: ToothStatus; colorClass: string }[]
}

export default function ClinicalInspectionPanel({
  selectedTooth,
  condition,
  notes,
  setNotes,
  diagnosis,
  setDiagnosis,
  plan,
  setPlan,
  setIsDiagnosisEdited,
  setIsPlanEdited,
  aiResults,
  isLoading,
  isSaving,
  handleConditionSelect,
  handleSave,
  closePanel,
  statusOptions
}: ClinicalInspectionPanelProps) {
  
  // Handlers to mark fields as edited manually
  const handleDiagnosisChange = (val: string) => {
    setDiagnosis(val)
    setIsDiagnosisEdited(true)
  }

  const handlePlanChange = (val: string) => {
    setPlan(val)
    setIsPlanEdited(true)
  }

  const showClinicalInputs = condition !== 'Sano'

  return (
    <>
      <div onClick={closePanel} className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm xl:hidden" />
      
      <div className="fixed xl:relative top-auto bottom-0 xl:bottom-auto right-0 left-0 xl:left-auto xl:w-[480px] w-full bg-white rounded-t-[2.5rem] xl:rounded-[2.5rem] border border-slate-100 shadow-2xl z-50 flex flex-col animate-in fade-in slide-in-from-right-10 duration-500 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
              <MousePointer2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Inspección Clínica</h3>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Pieza {selectedTooth}</p>
            </div>
          </div>
          <button 
            onClick={closePanel} 
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-full border transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto CustomScrollbar relative">
          
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden z-10">
              <div className="h-full bg-indigo-600 animate-progress origin-left" style={{ width: '40%' }} />
            </div>
          )}

          {/* 1. Condición Clínica */}
          <div className="space-y-3">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">1. Condición Clínica</p>
             <div className="grid grid-cols-2 gap-2">
               {statusOptions.map((opt) => (
                 <button
                   key={opt.label}
                   onClick={() => handleConditionSelect(opt.label)}
                   className={`flex items-center gap-2 p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                     condition === opt.label ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-sm' : 'border-slate-50 hover:border-slate-200'
                   }`}
                 >
                   <div className={`w-3 h-3 rounded-full ${opt.colorClass} shadow-inner`} />
                   {opt.label}
                 </button>
               ))}
             </div>
          </div>

          {/* 2. Notas Rápidas */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">2. Hallazgos adicionales</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[80px] p-4 text-sm rounded-xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all resize-none outline-none placeholder:text-slate-300 font-medium"
              placeholder="Detalles sobre la pieza..."
            />
          </div>

          {/* 3. Diagnóstico y Plan */}
          {showClinicalInputs && (
            <div className="space-y-6 pt-4 border-t border-dashed border-slate-200 animate-in fade-in duration-300">
              
              <div className="flex items-center justify-between">
                <p className={`flex items-center gap-2 font-black text-sm ${isLoading ? 'text-indigo-400 animate-pulse' : 'text-indigo-700'}`}>
                  {isLoading ? <Sparkles size={16} /> : <CheckCircle2 size={16} />} 
                  {isLoading ? 'IA Generando sugerencias...' : 'Análisis Clínico'}
                </p>
              </div>

              {/* Input de Diagnóstico */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-indigo-800 uppercase tracking-wider px-1">Diagnóstico (Assessment)</label>
                  {aiResults.diagnosis && !isLoading && diagnosis === (aiResults.diagnosis || aiResults.assessment) && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Sugerido por IA</span>
                  )}
                  {diagnosis && diagnosis !== (aiResults.diagnosis || aiResults.assessment) && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Editado Manualmente</span>
                  )}
                </div>
                <textarea
                  value={diagnosis}
                  onChange={(e) => handleDiagnosisChange(e.target.value)}
                  placeholder="Ingrese el diagnóstico clínico manual..."
                  className="w-full min-h-[70px] p-4 text-sm font-bold text-slate-800 rounded-xl border-2 border-indigo-50 bg-indigo-50/10 focus:bg-white focus:border-indigo-500 transition-all resize-none outline-none placeholder:text-slate-300"
                />
              </div>

              {/* Input de Plan */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-indigo-800 uppercase tracking-wider px-1">Plan de Tratamiento</label>
                  {aiResults.plan && !isLoading && plan === aiResults.plan && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Sugerido por IA</span>
                  )}
                  {plan && plan !== aiResults.plan && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Editado Manualmente</span>
                  )}
                </div>
                <textarea
                  value={plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  placeholder="Defina el plan de tratamiento..."
                  className="w-full min-h-[100px] p-4 text-sm text-slate-700 font-medium leading-relaxed rounded-xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all resize-none outline-none placeholder:text-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-[0.15em] text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Guardando...' : 'Guardar e Integrar'}
          </button>
        </div>
      </div>
    </>
  )
}
