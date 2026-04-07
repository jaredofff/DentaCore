'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAudit } from './audit'

export async function createPatient(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const full_name = formData.get('full_name') as string
  const document_id = (formData.get('document_id') as string) || null
  const birth_date = (formData.get('birth_date') as string) || null
  const gender = (formData.get('gender') as string) || null
  const phone = (formData.get('phone') as string) || null
  const email = (formData.get('email') as string) || null
  const address = (formData.get('address') as string) || null
  let folio = formData.get('folio') as string

  // Lógica de Folio Automático
  if (!folio || folio.trim() === '') {
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    const nextNumber = (count || 0) + 1
    folio = `PAC-${nextNumber.toString().padStart(4, '0')}`
  }

  const { data: newPatient, error } = await supabase.from('patients').insert({
    full_name,
    document_id,
    birth_date,
    gender,
    phone,
    email,
    address,
    folio,
    user_id: user.id,
    status: 'activo'
  }).select().single()

  if (error) {
    console.error('Create Patient Error:', error.message, error.code)
    return
  }

  await logAudit({
    action: 'CREATE',
    table_name: 'patients',
    record_id: newPatient.id,
    new_data: newPatient
  })

  revalidatePath('/patients')
  redirect('/patients')
}

export async function getPatient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Get Patient Error:', error.message, error.code)
    return null
  }
  return data
}

export async function getPatients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('full_name', { ascending: true })
  
  if (error) {
    console.error('DATABASE_ERROR_GET_PATIENTS:', error.message, '| CODE:', error.code)
    return []
  }
  return data
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { patients: 0, appointmentsToday: 0, recordsThisMonth: 0 }

  // 1. Pacientes totales
  const { count: patients } = await supabase
    .from('patients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 2. Citas de hoy
  const today = new Date().toISOString().split('T')[0]
  const { count: appointmentsToday } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', user.id)
    .gte('appointment_date', `${today}T00:00:00.000Z`)
    .lte('appointment_date', `${today}T23:59:59.999Z`)

  // 3. Historias clínicas este mes
  let startOfMonth = new Date()
  startOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 1)
  const { count: recordsThisMonth } = await supabase
    .from('clinical_records')
    .select('*', { count: 'exact', head: true })
    .eq('doctor_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  return {
    patients: patients || 0,
    appointmentsToday: appointmentsToday || 0,
    recordsThisMonth: recordsThisMonth || 0
  }
}

export async function deletePatient(id: string) {
  const supabase = await createClient()
  
  // Verificar si tiene historial (notas clínicas)
  const { count } = await supabase
    .from('clinical_records')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', id)

  if (count && count > 0) {
    // Si tiene historial, marcar como inactivo
    const { data: oldData } = await supabase.from('patients').select('*').eq('id', id).single()
    const { error } = await supabase
      .from('patients')
      .update({ status: 'inactivo' })
      .eq('id', id)
    
    if (error) throw new Error('Failed to deactivate patient')

    await logAudit({
      action: 'UPDATE',
      table_name: 'patients',
      record_id: id,
      old_data: oldData,
      new_data: { ...oldData, status: 'inactivo' }
    })
  } else {
    // Si no tiene historial, eliminación física permitida
    const { data: oldData } = await supabase.from('patients').select('*').eq('id', id).single()
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error('Failed to delete patient')

    await logAudit({
      action: 'DELETE',
      table_name: 'patients',
      record_id: id,
      old_data: oldData
    })
  }

  revalidatePath('/patients')
  redirect('/patients')
}

export async function createRecord(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const patient_id = formData.get('patient_id') as string
  const subjective = formData.get('subjective') as string
  const objective = formData.get('objective') as string
  const assessment = formData.get('assessment') as string
  const plan = formData.get('plan') as string

  const { data: record, error: recordError } = await supabase
    .from('clinical_records')
    .insert({
      patient_id,
      doctor_id: user.id,
      subjective,
      objective,
      assessment,
      plan,
      status: 'activo'
    })
    .select()
    .single()

  if (recordError) {
    console.error(recordError)
    throw new Error('Failed to create clinical record')
  }

  // Medications logic (simple for MVP)
  const med_names = formData.getAll('med_name[]') as string[]
  const med_dosages = formData.getAll('med_dosage[]') as string[]
  const med_frequencies = formData.getAll('med_frequency[]') as string[]
  const med_indications = formData.getAll('med_indications[]') as string[]

  if (med_names.length > 0) {
    const med_durations = formData.getAll('med_duration[]') as string[]
    const medsToInsert = med_names.map((name, i) => ({
      record_id: record.id,
      name,
      dosage: med_dosages[i],
      frequency: med_frequencies[i],
      duration: med_durations[i],
      indications: med_indications[i]
    })).filter(m => m.name.trim() !== '')

    if (medsToInsert.length > 0) {
      await supabase.from('medications').insert(medsToInsert)
    }
  }

  await logAudit({
    action: 'CREATE',
    table_name: 'clinical_records',
    record_id: record.id,
    new_data: record
  })

  revalidatePath(`/patients/${patient_id}`)
}

export async function getRecords(patientId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clinical_records')
    .select(`
      *,
      medications (*)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error(error)
    return []
  }
  return data
}
