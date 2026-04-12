'use client'

import React, { useState } from 'react'
import { Info, Save, Loader2, MousePointer2, AlertCircle } from 'lucide-react'
import { ToothStatus, OdontogramRecord } from '@/types'
import { updateToothStatus } from '@/lib/actions/odontogram'
import { useToast } from '@/components/ui/Toast'

// ─── TOOTH COMPONENT ────────────────────────────────────────────────────────
interface ToothProps {
  number: number
  status: ToothStatus
  isActive: boolean
  onClick: () => void
}

const statusColors: Record<ToothStatus, string> = {
  'Sano': 'fill-slate-50 stroke-slate-300',
  'Caries': 'fill-red-50 stroke-red-500',
  'Restauración': 'fill-blue-50 stroke-blue-500',
  'Endodoncia': 'fill-amber-50 stroke-amber-500',
  'Extracción': 'fill-slate-200 stroke-slate-400',
  'Prótesis': 'fill-orange-50 stroke-orange-500',
}

function Tooth({ number, status, isActive, onClick }: ToothProps) {
  return (
    <div className="relative group flex flex-col items-center">
      {/* Tooltip */}
      <div className="absolute -top-10 scale-0 transition-all rounded bg-slate-800 p-2 text-xs text-white group-hover:scale-100 z-50 whitespace-nowrap shadow-lg">
        Pieza {number} — <span className="font-semibold">{status}</span>
        <div className="tooltip-arrow border-slate-800 border-x-transparent border-b-transparent absolute top-full left-1/2 -translate-x-1/2 border-4" />
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`
          flex flex-col items-center p-1 sm:p-1.5 rounded-lg transition-all duration-200 ease-out cursor-pointer group
          ${isActive ? 'ring-2 ring-indigo-500 bg-indigo-50/50 scale-105 shadow-md' : 'hover:scale-105 hover:bg-slate-50 hover:shadow-sm'}
        `}
      >
        <span className={`text-[8px] sm:text-[9px] lg:text-[10px] font-bold mb-0.5 sm:mb-1 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
          {number}
        </span>
        <svg
          viewBox="0 0 100 120"
          className={`w-4 h-5 sm:w-6 sm:h-8 lg:w-8 lg:h-10 xl:w-9 xl:h-11 transition-colors duration-200 ${statusColors[status]}`}
        >
          {/* Corona */}
          <rect x="25" y="10" width="50" height="60" rx="10" strokeWidth="2" />
          <path d="M25 70 Q25 110 40 110" fill="none" strokeWidth="2" />
          <path d="M75 70 Q75 110 60 110" fill="none" strokeWidth="2" />
          {/* Detalle interno */}
          <rect x="35" y="20" width="30" height="40" rx="4" fillOpacity="0.2" strokeWidth="1" />
          {/* Marca de extracción */}
          {status === 'Extracción' && (
            <path d="M20 20 L80 100 M80 20 L20 100" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-slate-400" />
          )}
        </svg>
      </button>
    </div>
  )
}

// ─── MAIN ODONTOGRAM COMPONENT ──────────────────────────────────────────────
interface OdontogramProps {
  patientId: string
  initialData: OdontogramRecord[]
}

const quadrant1 = [18, 17, 16, 15, 14, 13, 12, 11]
const quadrant2 = [21, 22, 23, 24, 25, 26, 27, 28]
const quadrant4 = [48, 47, 46, 45, 44, 43, 42, 41]
const quadrant3 = [31, 32, 33, 34, 35, 36, 37, 38]

const statusOptions: { label: ToothStatus; colorClass: string; bgClass: string }[] = [
  { label: 'Sano', colorClass: 'bg-slate-300', bgClass: 'bg-slate-50' },
  { label: 'Caries', colorClass: 'bg-red-500', bgClass: 'bg-red-50' },
  { label: 'Restauración', colorClass: 'bg-blue-500', bgClass: 'bg-blue-50' },
  { label: 'Endodoncia', colorClass: 'bg-amber-500', bgClass: 'bg-amber-50' },
  { label: 'Extracción', colorClass: 'bg-slate-500', bgClass: 'bg-slate-100' },
  { label: 'Prótesis', colorClass: 'bg-orange-500', bgClass: 'bg-orange-50' },
]

export default function Odontogram({ patientId, initialData }: OdontogramProps) {
  const { toast } = useToast()
  
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [records, setRecords] = useState<Record<number, OdontogramRecord>>(() => {
    const acc: Record<number, OdontogramRecord> = {}
    initialData.forEach((rec) => { acc[rec.tooth_number] = rec })
    return acc
  })

  const [activeStatus, setActiveStatus] = useState<ToothStatus>('Sano')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSelectTooth = (num: number) => {
    setSelectedTooth(num)
    const rec = records[num]
    setActiveStatus(rec?.status || 'Sano')
    setNotes(rec?.notes ? String(rec.notes) : '')
  }

  const handleSave = async () => {
    if (!selectedTooth) return
    setIsSaving(true)
    
    const formData = new FormData()
    formData.append('patient_id', patientId)
    formData.append('tooth_number', selectedTooth.toString())
    formData.append('status', activeStatus)
    formData.append('notes', notes)

    try {
      const result = await updateToothStatus(formData)
      if (result.success) {
        toast(`Pieza ${selectedTooth} actualizada a: ${activeStatus}`, 'success')
        setRecords(prev => ({
           ...prev,
           [selectedTooth]: { ...prev[selectedTooth], status: activeStatus, notes } as OdontogramRecord
        }))
      } else {
        toast(result.error || 'Error al guardar estado de la pieza', 'error')
      }
    } catch (err) {
      toast('Error de conexión', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const getStatus = (num: number): ToothStatus => records[num]?.status || 'Sano'

  return (
    <div className="w-full max-w-6xl mx-auto bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden flex flex-col items-center">
      {/* Header & Leyenda */}
      <div className="w-full flex justify-between gap-6 mb-10 pb-6 border-b border-slate-100 flex-col md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Odontograma Interactivo</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Esquema FDI · Selecciona una pieza para inspección clínica</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          {statusOptions.filter(o => o.label !== 'Sano').map(opt => (
            <div key={opt.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className={`w-3 h-3 rounded-full ${opt.colorClass}`} />
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Dientes Centrado (Sin scroll / Responsive) */}
      <div className="w-full flex flex-col gap-12 items-center justify-center pb-8">
        
        {/* Arcada Superior */}
        <div className="relative flex w-full justify-center items-center">
          <div className="hidden sm:block absolute -left-10 lg:-left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">SUP</div>
          <div className="flex w-full max-w-[1000px] gap-1 sm:gap-2 bg-slate-50/50 p-3 sm:p-6 rounded-[2rem] border border-slate-100 justify-center">
            {quadrant1.map(num => (
              <Tooth key={num} number={num} status={getStatus(num)} isActive={selectedTooth === num} onClick={() => handleSelectTooth(num)} />
            ))}
            <div className="w-1.5 sm:w-3 border-r-2 border-dashed border-slate-200 mx-1 sm:mx-3" />
            {quadrant2.map(num => (
              <Tooth key={num} number={num} status={getStatus(num)} isActive={selectedTooth === num} onClick={() => handleSelectTooth(num)} />
            ))}
          </div>
        </div>

        {/* Separador Visual */}
        <div className="w-full max-w-[800px] border-t-2 border-dashed border-slate-100" />

        {/* Arcada Inferior */}
        <div className="relative flex w-full justify-center items-center">
          <div className="hidden sm:block absolute -left-10 lg:-left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">INF</div>
          <div className="flex w-full max-w-[1000px] gap-1 sm:gap-2 bg-slate-50/50 p-3 sm:p-6 rounded-[2rem] border border-slate-100 justify-center">
            {quadrant4.map(num => (
              <Tooth key={num} number={num} status={getStatus(num)} isActive={selectedTooth === num} onClick={() => handleSelectTooth(num)} />
            ))}
            <div className="w-1.5 sm:w-3 border-r-2 border-dashed border-slate-200 mx-1 sm:mx-3" />
            {quadrant3.map(num => (
              <Tooth key={num} number={num} status={getStatus(num)} isActive={selectedTooth === num} onClick={() => handleSelectTooth(num)} />
            ))}
          </div>
        </div>
      </div>

      {/* Panel Flotante Lateral */}
      {selectedTooth && (
        <>
          {/* Overlay suave para mantener el foco (Opcional, pero ayuda a la UX) */}
          <div onClick={() => setSelectedTooth(null)} className="fixed inset-0 bg-slate-900/10 z-40 backdrop-blur-[1px] md:hidden" />
          
          <div className="fixed sm:absolute top-4 right-4 bottom-4 w-[calc(100%-2rem)] sm:w-[420px] bg-white rounded-3xl border border-slate-100 shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300 ease-out">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md shadow-indigo-200">
                  <MousePointer2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800">Inspección Clínica</h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">Pieza {selectedTooth}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTooth(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-200 rounded-full transition-colors border border-slate-200"
              >
                <span className="text-xs font-bold">✕</span>
              </button>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto CustomScrollbar">
              {/* Estado Clínico */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block bg-slate-50 px-3 py-1.5 w-fit rounded-lg border border-slate-100">
                  1. Estado
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {statusOptions.map((opt) => {
                    const isActive = activeStatus === opt.label
                    return (
                      <button
                        key={opt.label}
                        onClick={() => setActiveStatus(opt.label)}
                        className={`
                          flex items-center gap-2 p-3 rounded-xl border-2 font-bold transition-all duration-200
                          ${isActive 
                             ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm' 
                             : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                          }
                        `}
                      >
                        <div className={`w-3 h-3 rounded-full ${isActive ? opt.colorClass : 'bg-slate-200'}`} />
                        <span className="text-[11px] truncate">{opt.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-4 flex flex-col flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block bg-slate-50 px-3 py-1.5 w-fit rounded-lg border border-slate-100">
                  2. Notas Clínicas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre el diagnóstico o tratamiento..."
                  className="flex-1 w-full min-h-[120px] p-4 text-sm rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all resize-none placeholder:text-slate-300 font-medium"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white text-sm font-extrabold uppercase tracking-widest rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Actualizar Pieza
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
