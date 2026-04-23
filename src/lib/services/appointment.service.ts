import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/actions/audit'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'

export interface AppointmentDTO {
  patient_id: string
  appointment_date: string // Esperado en ISO 8601
  duration_minutes: number
  procedure: string
  observations?: string | null
  status?: AppointmentStatus
}

export interface PaginationOptions {
  page: number
  limit: number
}

/**
 * Servicio encargado de la lógica de negocio de Citas (Appointments).
 */
export class AppointmentService {
  
  /**
   * Verifica la transición de estados clínicos permitidos
   */
  private static validateStatusTransition(oldStatus: AppointmentStatus, newStatus: AppointmentStatus) {
    if (oldStatus === newStatus) return

    const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      'pendiente': ['confirmada', 'completada', 'cancelada'],
      'confirmada': ['completada', 'cancelada'],
      'completada': [], // Una cita completada no debería cambiar de estado
      'cancelada': []   // Una cita cancelada es un estado final
    }

    if (!allowedTransitions[oldStatus].includes(newStatus)) {
      throw new ValidationError(`Transición de estado no permitida: de '${oldStatus}' a '${newStatus}'`)
    }
  }

  /**
   * Verifica si existe un conflicto de horario (Doble Booking por Rango)
   */
  private static async checkDoubleBooking(
    supabase: any,
    doctorId: string,
    isoStartDate: string,
    durationMinutes: number,
    excludeAppointmentId?: string
  ) {
    const newStart = new Date(isoStartDate).getTime()
    const newEnd = newStart + (durationMinutes * 60000)

    // Obtenemos citas del mismo día para evaluar empalmes en memoria
    // (En un sistema masivo se haría con un Raw SQL o Function de Postgres)
    const dayStart = new Date(isoStartDate)
    dayStart.setUTCHours(0, 0, 0, 0)
    
    const dayEnd = new Date(isoStartDate)
    dayEnd.setUTCHours(23, 59, 59, 999)

    let query = supabase
      .from('appointments')
      .select('id, appointment_date, duration_minutes')
      .eq('doctor_id', doctorId)
      .neq('status', 'cancelada')
      .gte('appointment_date', dayStart.toISOString())
      .lte('appointment_date', dayEnd.toISOString())
    
    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId)
    }

    const { data: existingAppointments } = await query

    if (existingAppointments) {
      for (const appt of existingAppointments) {
        // En caso de citas antiguas sin duration, asumimos 30 minutos
        const duration = appt.duration_minutes || 30 
        const existingStart = new Date(appt.appointment_date).getTime()
        const existingEnd = existingStart + (duration * 60000)

        // Lógica de empalme (Overlap)
        if (newStart < existingEnd && newEnd > existingStart) {
          throw new ConflictError('El horario choca con otra cita programada.')
        }
      }
    }
  }

  static async createAppointment(userId: string, data: AppointmentDTO) {
    if (!data.patient_id) throw new ValidationError('ID de paciente es requerido.')
    if (!data.procedure || data.procedure.trim().length < 3) {
      throw new ValidationError('El procedimiento debe tener al menos 3 caracteres.')
    }
    if (!data.duration_minutes || data.duration_minutes < 15) {
      throw new ValidationError('La cita debe durar al menos 15 minutos.')
    }
    
    // Normalización ISO
    const appointmentDate = new Date(data.appointment_date)
    if (isNaN(appointmentDate.getTime())) {
      throw new ValidationError('La fecha y hora de la cita son inválidas.')
    }
    const isoDateString = appointmentDate.toISOString()
    
    if (appointmentDate < new Date()) {
      throw new ValidationError('No se pueden programar citas en el pasado.')
    }

    const supabase = await createClient()

    // Validación de integridad: Asegurar que el paciente existe y le pertenece al doctor
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', data.patient_id)
      .single()

    if (patientError || !patientData) {
      throw new ValidationError('El paciente especificado no existe o no tiene acceso a él.')
    }

    // Evitar doble-booking con rangos de tiempo
    await this.checkDoubleBooking(supabase, userId, isoDateString, data.duration_minutes)

    const { data: newAppointment, error } = await supabase.from('appointments').insert({
      patient_id: data.patient_id,
      doctor_id: userId,
      appointment_date: isoDateString,
      duration_minutes: data.duration_minutes,
      procedure: data.procedure.trim(),
      observations: data.observations,
      status: data.status || 'pendiente'
    }).select().single()

    if (error) {
      console.error('AppointmentService.create DB Error:', error)
      throw new Error('Fallo al crear la cita en la base de datos.')
    }

    await logAudit({
      action: 'CREATE',
      table_name: 'appointments',
      record_id: newAppointment.id,
      new_data: newAppointment
    })

    return newAppointment
  }

  static async updateAppointment(userId: string, appointmentId: string, data: Partial<AppointmentDTO>) {
    if (!appointmentId) throw new ValidationError('ID de cita es requerido.')
      
    const supabase = await createClient()

    const { data: oldData } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
    if (!oldData) throw new Error('Cita no encontrada.')

    let isoDateString = oldData.appointment_date
    let duration = data.duration_minutes || oldData.duration_minutes || 30

    if (data.appointment_date) {
      const appointmentDate = new Date(data.appointment_date)
      if (isNaN(appointmentDate.getTime())) {
        throw new ValidationError('La nueva fecha de la cita es inválida.')
      }
      isoDateString = appointmentDate.toISOString()
    }

    if (data.appointment_date || data.duration_minutes) {
      await this.checkDoubleBooking(supabase, userId, isoDateString, duration, appointmentId)
    }

    if (data.status) {
      this.validateStatusTransition(oldData.status as AppointmentStatus, data.status)
    }

    const updatePayload = {
      ...data,
      appointment_date: isoDateString,
      duration_minutes: duration
    }

    const { data: updatedAppointment, error } = await supabase
      .from('appointments')
      .update(updatePayload)
      .eq('id', appointmentId)
      .select()
      .single()

    if (error) {
      console.error('AppointmentService.update DB Error:', error)
      throw new Error('Fallo al actualizar la cita.')
    }

    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: appointmentId,
      old_data: oldData,
      new_data: updatedAppointment
    })

    return updatedAppointment
  }

  static async updateStatus(appointmentId: string, status: AppointmentStatus) {
    if (!appointmentId) throw new ValidationError('ID de cita es requerido.')
      
    const supabase = await createClient()
    
    const { data: oldData } = await supabase.from('appointments').select('*').eq('id', appointmentId).single()
    if (!oldData) throw new Error('Cita no encontrada.')

    this.validateStatusTransition(oldData.status as AppointmentStatus, status)

    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)

    if (error) throw new Error('Fallo al actualizar el estado de la cita.')

    await logAudit({
      action: 'UPDATE',
      table_name: 'appointments',
      record_id: appointmentId,
      old_data: oldData,
      new_data: { ...oldData, status }
    })

    return true
  }

  /**
   * Paginated getAppointments
   */
  static async getAppointments({ page = 1, limit = 50 }: Partial<PaginationOptions> = {}) {
    const supabase = await createClient()
    
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('appointments')
      .select(`
        *,
        patients (full_name)
      `, { count: 'exact' })
      .order('appointment_date', { ascending: true })
      .range(from, to)
    
    if (error) {
      console.error('AppointmentService.getAppointments Error:', error)
      return { data: [], total: 0 }
    }
    
    return { data, total: count || 0 }
  }

  static async getUpcomingAppointments() {
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
      console.error('AppointmentService.getUpcoming Error:', error)
      return []
    }
    return data
  }
}
