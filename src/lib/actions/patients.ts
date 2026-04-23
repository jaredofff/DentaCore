'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { PatientService, PatientDTO, ClinicalRecordDTO, ValidationError } from '@/lib/services/patient.service'

/**
 * Helper interno para asegurar que el usuario está autenticado
 */
async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function createPatient(formData: FormData) {
  try {
    const user = await requireUser()
    
    // Mapeo crudo de FormData a nuestro DTO fuertemente tipado
    const patientDTO: PatientDTO = {
      full_name: formData.get('full_name') as string,
      document_id: (formData.get('document_id') as string) || null,
      birth_date: (formData.get('birth_date') as string) || null,
      gender: (formData.get('gender') as string) || null,
      phone: (formData.get('phone') as string) || null,
      email: (formData.get('email') as string) || null,
      address: (formData.get('address') as string) || null,
      folio: (formData.get('folio') as string) || null,
    }

    // Delegamos la lógica de negocio, validación y creación a nuestro Servicio
    await PatientService.createPatient(user.id, patientDTO)
    
  } catch (err: any) {
    if (err instanceof ValidationError) {
      console.error('Validation error:', err.message)
      return // En un SaaS real podríamos devolver { success: false, error: err.message } para mostrar en UI
    }
    console.error('Create Patient Error:', err.message)
    return
  }

  // Next.js features se quedan estrictamente en el Server Action
  revalidatePath('/patients')
  redirect('/patients')
}

export async function getPatient(id: string) {
  try {
    return await PatientService.getPatient(id)
  } catch (err) {
    return null
  }
}

export async function getPatients() {
  try {
    return await PatientService.getPatients()
  } catch (err) {
    return []
  }
}

export async function getDashboardStats() {
  try {
    const user = await requireUser()
    return await PatientService.getDashboardStats(user.id)
  } catch (err) {
    return { patients: 0, appointmentsToday: 0, recordsThisMonth: 0 }
  }
}

export async function deletePatient(id: string) {
  try {
    await requireUser()
    await PatientService.deletePatient(id)
  } catch (err: any) {
    console.error('Delete Patient Error:', err.message)
    throw new Error('No se pudo eliminar/desactivar el paciente.')
  }

  revalidatePath('/patients')
  redirect('/patients')
}

export async function createRecord(formData: FormData) {
  let patient_id = ''
  try {
    const user = await requireUser()
    
    patient_id = formData.get('patient_id') as string
    
    // Mapeo complejo de los arrays de FormData hacia un array de objetos
    const med_names = formData.getAll('med_name[]') as string[]
    const med_dosages = formData.getAll('med_dosage[]') as string[]
    const med_frequencies = formData.getAll('med_frequency[]') as string[]
    const med_indications = formData.getAll('med_indications[]') as string[]
    const med_durations = formData.getAll('med_duration[]') as string[]

    const medications = med_names
      .map((name, i) => ({
        name,
        dosage: med_dosages[i] || '',
        frequency: med_frequencies[i] || '',
        duration: med_durations[i] || '',
        indications: med_indications[i] || ''
      }))
      .filter(m => m.name.trim() !== '')

    // Formamos el DTO de historia clínica
    const recordDTO: ClinicalRecordDTO = {
      patient_id,
      subjective: (formData.get('subjective') as string) || null,
      objective: (formData.get('objective') as string) || null,
      assessment: (formData.get('assessment') as string) || null,
      plan: (formData.get('plan') as string) || null,
      medications: medications.length > 0 ? medications : undefined
    }

    await PatientService.createRecord(user.id, recordDTO)
  } catch (err: any) {
    console.error('Create Record Error:', err.message)
    throw err
  }

  revalidatePath(`/patients/${patient_id}`)
}

export async function getRecords(patientId: string) {
  try {
    return await PatientService.getRecords(patientId)
  } catch (err) {
    return []
  }
}
