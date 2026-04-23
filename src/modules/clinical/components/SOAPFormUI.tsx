import React from 'react'
import { Sparkles, Save, RefreshCw, Loader2, Activity } from 'lucide-react'

export interface SOAPData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

export interface SOAPFormUIProps {
  input: string
  setInput: (val: string) => void
  isLoading: boolean
  isSaving: boolean
  soapData: SOAPData | null
  onGenerate: () => void
  onSave: () => void
}

/**
 * Componente Widget (Optimizado para Dashboard)
 * Se eliminaron los paddings excesivos y grids de 2 columnas para que 
 * fluya perfectamente dentro de su tarjeta vertical.
 */
export function SOAPFormUI({
  input,
  setInput,
  isLoading,
  isSaving,
  soapData,
  onGenerate,
  onSave
}: SOAPFormUIProps) {
  return (
    <div className="w-full flex flex-col gap-6 h-full">
      
      {/* SECCIÓN SUPERIOR: INPUT */}
      <div className="flex flex-col flex-1 min-h-[250px] gap-3">
        <textarea
          id="soap-ai-input"
          className="flex-1 w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none resize-none transition-all placeholder:text-slate-400 shadow-inner"
          placeholder="Ejemplo: Paciente refiere dolor en el 46 al frío..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        
        <button
          onClick={onGenerate}
          disabled={isLoading || !input.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isLoading ? 'Analizando...' : 'Generar SOAP con IA'}
        </button>
      </div>

      {/* SECCIÓN INFERIOR: RESULTADO SOAP */}
      <div className="flex flex-col gap-3 flex-1 border-t border-slate-100 pt-6">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">Resultado Estructurado</h3>
        </div>

        {soapData ? (
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Subjetivo</h4>
              <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100">{soapData.subjective}</div>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Objetivo</h4>
              <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100">{soapData.objective}</div>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Análisis</h4>
              <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100">{soapData.assessment}</div>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Plan</h4>
              <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100">{soapData.plan}</div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 min-h-[200px]">
            <p className="text-slate-400 text-sm font-medium text-center">Sin datos generados.</p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onGenerate}
            disabled={!soapData || isLoading}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onSave}
            disabled={!soapData || isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Historia
          </button>
        </div>
      </div>

    </div>
  )
}
