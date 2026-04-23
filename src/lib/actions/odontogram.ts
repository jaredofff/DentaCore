'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ToothStatus } from '@/types'
import { OdontogramService, ToothStateDTO, ValidationError } from '@/lib/services/odontogram.service'
import { PatientService } from '@/lib/services/patient.service' // Asumiendo uso de servicios refactorizados
import { createRecord } from './patients' // Fallback si no está 100% migrado createRecord aún

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function getLatestOdontogramStates(patientId: string) {
  try {
    const records = await OdontogramService.getLatestOdontogramStates(patientId)
    // El frontend actual espera recibir un array de objetos directos, 
    // OdontogramService ya devuelve este array limpio sin tener que hacer map y reduce.
    return records
  } catch (err) {
    console.error('getLatestOdontogramStates Action Error:', err)
    return []
  }
}

export async function updateToothStatus(formData: FormData) {
  try {
    const user = await requireUser()
    
    const dto: ToothStateDTO = {
      patient_id: formData.get('patient_id') as string,
      tooth_number: parseInt(formData.get('tooth_number') as string, 10),
      status: formData.get('status') as ToothStatus,
      notes: (formData.get('notes') as string) || ''
    }

    await OdontogramService.updateToothStatus(user.id, dto)
    
  } catch (err: any) {
    if (err instanceof ValidationError) {
      console.error('Validation Error:', err.message)
      return { error: err.message }
    }
    console.error('Update Tooth Status Error:', err.message)
    return { error: 'Ocurrió un error inesperado al actualizar el diente.' }
  }

  // Obtenemos el ID para revalidar
  const patient_id = formData.get('patient_id') as string
  revalidatePath(`/patients/${patient_id}`)
  
  return { success: true }
}

export async function saveOdontogramAndRecord(odontogramFormData: FormData, recordFormData: FormData | null) {
  const statusRes = await updateToothStatus(odontogramFormData)
  if (statusRes && statusRes.error) return statusRes

  if (recordFormData) {
    try {
      // Reutilizamos createRecord de actions/patients, que ahora internamente usa PatientService
      if (recordFormData.get('subjective') || recordFormData.get('objective') || recordFormData.get('assessment') || recordFormData.get('plan')) {
         await createRecord(recordFormData)
      }
    } catch (err: any) {
      console.error(err)
      return { error: 'Estado actualizado, pero error al guardar la nota SOAP: ' + err.message }
    }
  }

  return { success: true }
}
