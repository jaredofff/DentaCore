'use client'

import { deletePatient } from '@/lib/actions/patients'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function DeletePatientButton({ patientId, patientName }: { patientId: string, patientName: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${patientName}? Esta acción borrará también todo su historial clínico, citas y radiografías.`)
    
    if (confirmed) {
      setIsDeleting(true)
      try {
        await deletePatient(patientId)
      } catch (error) {
        alert('Hubo un error al eliminar el paciente.')
        setIsDeleting(false)
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all border border-red-100 disabled:opacity-50"
    >
      <Trash2 size={18} />
      {isDeleting ? 'Eliminando...' : 'Eliminar Paciente'}
    </button>
  )
}
