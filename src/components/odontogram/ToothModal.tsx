'use client'

import { ToothStatus } from '@/types'
import { updateToothStatus } from '@/lib/actions/odontogram'
import { useState } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface ToothModalProps {
  patientId: string
  toothNumber: number
  currentStatus: ToothStatus
  currentNotes?: string
  onClose: () => void
}

const statusOptions: ToothStatus[] = ['Sano', 'Caries', 'Restauración', 'Endodoncia', 'Extracción', 'Prótesis']

export default function ToothModal({ patientId, toothNumber, currentStatus, currentNotes, onClose }: ToothModalProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<ToothStatus>(currentStatus)
  const [notes, setNotes] = useState(currentNotes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('patient_id', patientId)
    formData.append('tooth_number', toothNumber.toString())
    formData.append('status', status)
    formData.append('notes', notes)

    try {
      const result = await updateToothStatus(formData)
      if (result.success) {
        toast(`Pieza ${toothNumber} actualizada a: ${status}`, 'success')
        onClose()
      } else {
        setError(result.error || 'Error al guardar')
        toast(result.error || 'Error al guardar', 'error')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 scale-in-center animate-in zoom-in-95 duration-300">
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            Registro Dental: Pieza {toothNumber}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900 shadow-sm border border-transparent hover:border-slate-100">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 text-sm font-medium">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">
              Estado Clínico
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                    status === opt 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-blue-50/30'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1" htmlFor="tooth-notes">
              Observaciones del Especialista
            </label>
            <textarea
              id="tooth-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium resize-none"
              placeholder="Ej. Caries oclusal detectada en exploración..."
            />
          </div>

          <footer className="pt-4 flex gap-3">
             <button
               type="button"
               onClick={onClose}
               className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
             >
               Cancelar
             </button>
             <button
               type="submit"
               disabled={isSaving}
               className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
             >
               <Save size={18} />
               {isSaving ? 'Guardando...' : 'Registrar Estado'}
             </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
