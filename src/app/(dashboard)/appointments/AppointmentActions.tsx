'use client'

import { updateAppointmentStatus } from '@/lib/actions/appointments'
import { CheckCircle2, XCircle, CalendarCheck } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'

export default function AppointmentActions({ appointmentId, currentStatus }: { appointmentId: string, currentStatus: string }) {
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada') => {
    setIsUpdating(true)
    try {
      const result = await updateAppointmentStatus(appointmentId, status)
      if (result.success) {
        toast(`Cita marcada como ${status}`, 'success')
      } else {
        toast('Error al actualizar el estado', 'error')
      }
    } catch (error) {
      toast('Error de conexión', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  if (currentStatus === 'completada' || currentStatus === 'cancelada') return null

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'pendiente' && (
        <button
          onClick={() => handleStatusUpdate('confirmada')}
          disabled={isUpdating}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
          title="Confirmar cita"
        >
          <CalendarCheck size={18} />
        </button>
      )}
      <button
        onClick={() => handleStatusUpdate('completada')}
        disabled={isUpdating}
        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-50"
        title="Marcar como completada"
      >
        <CheckCircle2 size={18} />
      </button>
      <button
        onClick={() => handleStatusUpdate('cancelada')}
        disabled={isUpdating}
        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
        title="Cancelar cita"
      >
        <XCircle size={18} />
      </button>
    </div>
  )
}
