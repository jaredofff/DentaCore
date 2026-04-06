'use client'

import { updateAppointmentStatus } from '@/lib/actions/appointments'
import { CheckCircle2, XCircle, MoreVertical } from 'lucide-react'
import { useState } from 'react'

export default function AppointmentActions({ appointmentId, currentStatus }: { appointmentId: string, currentStatus: string }) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (status: 'completada' | 'cancelada') => {
    setIsUpdating(true)
    await updateAppointmentStatus(appointmentId, status)
    setIsUpdating(false)
  }

  if (currentStatus !== 'pendiente') return null

  return (
    <div className="flex items-center gap-2">
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
