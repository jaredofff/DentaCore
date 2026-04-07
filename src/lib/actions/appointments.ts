'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAudit } from './audit'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const patient_id = formData.get('patient_id') as string
  const appointment_date = formData.get('appointment_date') as string
  const procedure = formData.get('procedure') as string
  const observations = formData.get('observations') as string

  const { data: newAppointment, error } = await supabase.from('appointments').insert({
    patient_id,
    doctor_id: user.id,
    appointment_date,
    procedure,
    observations,
    status: 'pendiente'
  }).select().single()

  if (error) {
    console.error(error)
    return
  }

  await logAudit({
    action: 'CREATE',
    table_name: 'appointments',
    record_id: newAppointment.id,
    new_data: newAppointment
  })

  revalidatePath('/appointments')
}

export async function getAppointments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (full_name)
    `)
    .order('appointment_date', { ascending: true })
  
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function getUpcomingAppointments() {
  const supabase = await createClient()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (full_name)
    `)
    .gte('appointment_date', startOfDay.toISOString())
    .neq('status', 'cancelada')
    .order('appointment_date', { ascending: true })
    .limit(10)
  
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function updateAppointmentStatus(appointmentId: string, status: 'pendiente' | 'confirmada' | 'completada' | 'cancelada') {
  const supabase = await createClient()
  const { data: oldData } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
  
  if (error) {
    console.error(error)
    return { error: 'Failed to update status' }
  }

  await logAudit({
    action: 'UPDATE',
    table_name: 'appointments',
    record_id: appointmentId,
    old_data: oldData,
    new_data: { ...oldData, status }
  })
  
  revalidatePath('/appointments')
  revalidatePath('/')
  return { success: true }
}

export async function updateAppointment(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const appointment_date = formData.get('appointment_date') as string
  const procedure = formData.get('procedure') as string
  const observations = formData.get('observations') as string
  const status = formData.get('status') as 'pendiente' | 'confirmada' | 'completada' | 'cancelada'

  const { data: oldData } = await supabase.from('appointments').select('*').eq('id', id).single()
  const { error } = await supabase
    .from('appointments')
    .update({
      appointment_date,
      procedure,
      observations,
      status
    })
    .eq('id', id)

  if (error) {
    console.error(error)
    return
  }

  await logAudit({
    action: 'UPDATE',
    table_name: 'appointments',
    record_id: id,
    old_data: oldData,
    new_data: { appointment_date, procedure, observations, status }
  })

  revalidatePath('/appointments')
  revalidatePath('/')
}
