'use client'

import { useState } from 'react'
import Tooth from './Tooth'
import ToothModal from './ToothModal'
import { ToothStatus, OdontogramRecord } from '@/types'
import { Info, ClipboardList } from 'lucide-react'

interface OdontogramProps {
  patientId: string
  initialData: OdontogramRecord[]
}

const quadrant1 = [18, 17, 16, 15, 14, 13, 12, 11]
const quadrant2 = [21, 22, 23, 24, 25, 26, 27, 28]
const quadrant4 = [48, 47, 46, 45, 44, 43, 42, 41]
const quadrant3 = [31, 32, 33, 34, 35, 36, 37, 38]

export default function Odontogram({ patientId, initialData }: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  
  // Mapeamos los datos iniciales a un objeto para búsqueda rápida
  const toothStates: Record<number, OdontogramRecord> = {}
  initialData.forEach((record) => {
    toothStates[record.tooth_number] = record
  })

  const getStatus = (num: number): ToothStatus => toothStates[num]?.status || 'Sano'
  const getNotes = (num: number): string | undefined => toothStates[num]?.notes as string | undefined

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden relative group">
      <header className="flex flex-col gap-6 mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-100">
             <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Estado Dental</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Esquema FDI Interactivo</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
           <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase">Caries</span>
           </div>
           <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[9px] font-black text-slate-500 uppercase">Rest.</span>
           </div>
           <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase">Endo.</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-400" />
              <span className="text-[9px] font-black text-slate-500 uppercase">Prót.</span>
           </div>
        </div>
      </header>

      <div className="space-y-16 py-4 flex flex-col items-center">
        {/* Arcada Superior */}
        <div className="w-full">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-8 text-center">Arcada Superior</p>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-8 gap-1 self-center">
               {quadrant1.map(num => (
                 <Tooth key={num} number={num} status={getStatus(num)} onClick={() => setSelectedTooth(num)} />
               ))}
            </div>
            <div className="grid grid-cols-8 gap-1 self-center border-t border-slate-50 pt-6">
               {quadrant2.map(num => (
                 <Tooth key={num} number={num} status={getStatus(num)} onClick={() => setSelectedTooth(num)} />
               ))}
            </div>
          </div>
        </div>

        {/* Arcada Inferior */}
        <div className="w-full">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-8 gap-1 self-center border-b border-slate-50 pb-6">
               {quadrant4.map(num => (
                 <Tooth key={num} number={num} status={getStatus(num)} onClick={() => setSelectedTooth(num)} />
               ))}
            </div>
            <div className="grid grid-cols-8 gap-1 self-center">
               {quadrant3.map(num => (
                 <Tooth key={num} number={num} status={getStatus(num)} onClick={() => setSelectedTooth(num)} />
               ))}
            </div>
          </div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-8 text-center">Arcada Inferior</p>
        </div>
      </div>

      <footer className="mt-12 flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
        <Info className="text-blue-500" size={16} />
        <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
           Haz clic en cualquier pieza dental para registrar hallazgos clínicos, procedimientos de restauración o estados patológicos. 
           Los cambios se guardarán automáticamente en la ficha histórica.
        </p>
      </footer>

      {selectedTooth && (
        <ToothModal
          patientId={patientId}
          toothNumber={selectedTooth}
          currentStatus={getStatus(selectedTooth)}
          currentNotes={getNotes(selectedTooth)}
          onClose={() => setSelectedTooth(null)}
        />
      )}
    </div>
  )
}
