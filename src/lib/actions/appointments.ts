'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AppointmentService, AppointmentDTO, ValidationError, ConflictError, AppointmentStatus } from '@/lib/services/appointment.service'

/**
 * Helper interno para asegurar que el usuario está autenticado
 */
async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

export async function createAppointment(formData: FormData) {
  try {
    const user = await requireUser()
    
    // Extracción segura del duration_minutes con fallback de compatibilidad a 30 mins
    const rawDuration = formData.get('duration_minutes')
    const duration = rawDuration ? parseInt(rawDuration as string, 10) : 30

    // Mapeo desde FormData al DTO
    const dto: AppointmentDTO = {
      patient_id: formData.get('patient_id') as string,
      appointment_date: formData.get('appointment_date') as string,
      duration_minutes: isNaN(duration) ? 30 : duration,
      procedure: formData.get('procedure') as string,
      observations: (formData.get('observations') as string) || null,
      status: 'pendiente'
    }

    await AppointmentService.createAppointment(user.id, dto)
  } catch (err: any) {
    if (err instanceof ValidationError || err instanceof ConflictError) {
      console.error('Appointment Error:', err.message)
      return { error: err.message } 
    }
    console.error('Create Appointment Error:', err.message)
    return { error: 'Ocurrió un error inesperado al crear la cita.' }
  }

  revalidatePath('/appointments')
}

// Actualizado para usar paginación de forma transparente a la UI si no se pasan parámetros
export async function getAppointments(page = 1, limit = 50) {
  try {
    // Retornará un objeto { data: [...], total: N }
    // Si tu UI iteraba directo sobre un array, ten cuidado y ajusta el componente llamador
    // o bien extrae `data` si quieres compatibilidad perfecta inmediata.
    const result = await AppointmentService.getAppointments({ page, limit })
    // Mantenemos compatibilidad con arreglos asumiendo que la UI hace `const appts = await getAppointments()`
    // En un futuro, deberías hacer que la UI lea `result.data` y `result.total`.
    return result.data 
  } catch (err) {
    return []
  }
}

export async function getUpcomingAppointments() {
  try {
    return await AppointmentService.getUpcomingAppointments()
  } catch (err) {
    return []
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  try {
    await requireUser()
    await AppointmentService.updateStatus(appointmentId, status)
  } catch (err: any) {
    console.error('Update Status Error:', err.message)
    return { error: err.message }
  }
  
  revalidatePath('/appointments')
  revalidatePath('/')
  return { success: true }
}

export async function updateAppointment(formData: FormData) {
  try {
    const user = await requireUser()
    const id = formData.get('id') as string
    
    const rawDuration = formData.get('duration_minutes')
    const duration = rawDuration ? parseInt(rawDuration as string, 10) : undefined

    const dto: Partial<AppointmentDTO> = {
      appointment_date: formData.get('appointment_date') as string,
      procedure: formData.get('procedure') as string,
      observations: (formData.get('observations') as string) || null,
      status: formData.get('status') as AppointmentStatus
    }

    if (duration !== undefined && !isNaN(duration)) {
      dto.duration_minutes = duration
    }

    await AppointmentService.updateAppointment(user.id, id, dto)
  } catch (err: any) {
    if (err instanceof ValidationError || err instanceof ConflictError) {
      console.error('Appointment Error:', err.message)
      return { error: err.message }
    }
    console.error('Update Appointment Error:', err.message)
    return { error: 'Ocurrió un error inesperado al actualizar la cita.' }
  }

  revalidatePath('/appointments')
  revalidatePath('/')
}
