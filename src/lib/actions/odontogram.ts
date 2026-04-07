'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ToothStatus } from '@/types'
import { logAudit } from './audit'

export async function getLatestOdontogramStates(patientId: string) {
  const supabase = await createClient()
  
  // Obtenemos todos los registros para este paciente
  const { data, error } = await supabase
    .from('odontogram')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching odontogram:', error)
    return []
  }

  // Filtramos para quedarnos solo con el último estado de cada diente
  const latestStates: Record<number, any> = {}
  data.forEach((record) => {
    if (!latestStates[record.tooth_number]) {
      latestStates[record.tooth_number] = record
    }
  })

  return Object.values(latestStates)
}

export async function updateToothStatus(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const patient_id = formData.get('patient_id') as string
  const tooth_number = parseInt(formData.get('tooth_number') as string)
  const status = formData.get('status') as ToothStatus
  const notes = formData.get('notes') as string

  const { data: newEntry, error } = await supabase
    .from('odontogram')
    .insert({
      patient_id,
      doctor_id: user.id,
      tooth_number,
      status,
      notes
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating tooth:', error)
    return { error: 'No se pudo actualizar el estado del diente' }
  }

  await logAudit({
    action: 'CREATE',
    table_name: 'odontogram',
    record_id: newEntry.id,
    new_data: newEntry
  })

  revalidatePath(`/patients/${patient_id}`)
  return { success: true }
}
