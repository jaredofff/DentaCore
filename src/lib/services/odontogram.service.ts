import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/actions/audit'
import { ToothStatus } from '@/types'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export interface ToothStateDTO {
  patient_id: string
  tooth_number: number
  status: ToothStatus
  notes?: string
}

/**
 * Servicio encargado de la lógica clínica del Odontograma.
 * Implementa el modelo híbrido: Estado Actual (patient_teeth) + Historial (odontogram_history).
 */
export class OdontogramService {
  
  /**
   * Obtiene el estado actual de todos los dientes de un paciente.
   * Altamente optimizado: ya no requiere agrupar ni ordenar historiales pesados.
   */
  static async getLatestOdontogramStates(patientId: string) {
    if (!patientId) throw new ValidationError('El ID del paciente es requerido.')

    const supabase = await createClient()
    
    // Leemos de la tabla rápida de estados actuales
    const { data, error } = await supabase
      .from('patient_teeth')
      .select('*')
      .eq('patient_id', patientId)

    if (error) {
      console.error('OdontogramService.getLatestStates Error:', error)
      throw new Error('Error al obtener el odontograma actual.')
    }

    return data || []
  }

  /**
   * Actualiza el estado de un diente.
   * 1. Hace UPSERT en la tabla de estado actual.
   * 2. Hace INSERT en la tabla de historial (Inmutable).
   */
  static async updateToothStatus(userId: string, data: ToothStateDTO) {
    if (!data.patient_id) throw new ValidationError('El ID del paciente es requerido.')
    if (!data.tooth_number || data.tooth_number < 11 || data.tooth_number > 85) {
      throw new ValidationError('El número de diente es inválido.')
    }
    if (!data.status) throw new ValidationError('El estado clínico es requerido.')

    const supabase = await createClient()

    // 1. Upsert en la tabla de estado actual (patient_teeth)
    // Asume que en Supabase la tabla tiene una llave única: UNIQUE(patient_id, tooth_number)
    const { data: currentState, error: upsertError } = await supabase
      .from('patient_teeth')
      .upsert(
        {
          patient_id: data.patient_id,
          tooth_number: data.tooth_number,
          status: data.status,
          notes: data.notes || '',
          updated_at: new Date().toISOString()
        },
        { onConflict: 'patient_id, tooth_number' }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('OdontogramService.upsert Error:', upsertError)
      throw new Error('Fallo al actualizar el estado del diente.')
    }

    // 2. Insertar en el log histórico (odontogram_history)
    const { data: historyEntry, error: historyError } = await supabase
      .from('odontogram_history')
      .insert({
        patient_id: data.patient_id,
        doctor_id: userId,
        tooth_number: data.tooth_number,
        status: data.status,
        notes: data.notes || ''
      })
      .select()
      .single()

    if (historyError) {
      console.error('OdontogramService.history Error:', historyError)
      // Aunque falle el log, ya actualizamos el estado. Sin embargo, en un sistema crítico 
      // esto se haría en un Stored Procedure (RPC) para asegurar transacción atómica.
    }

    // Auditoría general del sistema
    await logAudit({
      action: 'UPDATE',
      table_name: 'patient_teeth',
      record_id: currentState.id,
      new_data: currentState
    })

    return currentState
  }
}
