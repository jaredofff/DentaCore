'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const patient_id = formData.get('patient_id') as string
  const appointment_date = formData.get('appointment_date') as string
  const procedure = formData.get('procedure') as string
  const observations = formData.get('observations') as string

  const { error } = await supabase.from('appointments').insert({
    patient_id,
    doctor_id: user.id,
    appointment_date,
    procedure,
    observations,
    status: 'pendiente'
  })

  if (error) {
    console.error(error)
    return
  }

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
  const now = new Date().toISOString()
  
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (full_name)
    `)
    .gte('appointment_date', now)
    .neq('status', 'cancelada')
    .order('appointment_date', { ascending: true })
    .limit(5)
  
  if (error) {
    console.error(error)
    return []
  }
  return data
}

export async function updateAppointmentStatus(appointmentId: string, status: 'pendiente' | 'completada' | 'cancelada') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId)
  
  if (error) {
    console.error(error)
    return { error: 'Failed to update status' }
  }
  
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
  const status = formData.get('status') as 'pendiente' | 'completada' | 'cancelada'

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

  revalidatePath('/appointments')
  revalidatePath('/')
}
