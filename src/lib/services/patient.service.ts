import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/actions/audit'

// 1. Manejo de Errores Tipados
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// 2. Data Transfer Objects (DTOs) para tipado estricto
export interface PatientDTO {
  full_name: string
  document_id?: string | null
  birth_date?: string | null
  gender?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  folio?: string | null
}

export interface MedicationDTO {
  name: string
  dosage: string
  frequency: string
  duration: string
  indications: string
}

export interface ClinicalRecordDTO {
  patient_id: string
  subjective?: string | null
  objective?: string | null
  assessment?: string | null
  plan?: string | null
  medications?: MedicationDTO[]
}

/**
 * Servicio encargado de la lógica de negocio relacionada con Pacientes.
 * Validaciones fuertes, transformación de datos y acceso a DB encapsulado.
 */
export class PatientService {
  
  /**
   * Crea un nuevo paciente con validaciones y auto-folio.
   */
  static async createPatient(userId: string, data: PatientDTO) {
    // Validaciones de negocio
    if (!data.full_name || data.full_name.trim().length < 3) {
      throw new ValidationError('El nombre del paciente es requerido y debe tener al menos 3 caracteres.')
    }
    
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
      throw new ValidationError('El correo electrónico no es válido.')
    }

    const supabase = await createClient()
    let folio = data.folio

    // Lógica de Folio Automático encapsulada
    if (!folio || folio.trim() === '') {
      const { count } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      
      const nextNumber = (count || 0) + 1
      folio = `PAC-${nextNumber.toString().padStart(4, '0')}`
    }

    const { data: newPatient, error } = await supabase.from('patients').insert({
      full_name: data.full_name.trim(),
      document_id: data.document_id,
      birth_date: data.birth_date,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address,
      folio,
      user_id: userId,
      status: 'activo'
    }).select().single()

    if (error) {
      console.error('PatientService.createPatient DB Error:', error)
      throw new Error('Error en la base de datos al crear el paciente.')
    }

    // Auditoría (Side-effect de negocio)
    await logAudit({
      action: 'CREATE',
      table_name: 'patients',
      record_id: newPatient.id,
      new_data: newPatient
    })

    return newPatient
  }

  /**
   * Obtiene un paciente por ID
   */
  static async getPatient(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('PatientService.getPatient Error:', error)
      throw new Error('Error al obtener los datos del paciente.')
    }
    return data
  }

  /**
   * Obtiene todos los pacientes (ordenados alfabéticamente)
   */
  static async getPatients() {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('full_name', { ascending: true })
    
    if (error) {
      console.error('PatientService.getPatients Error:', error)
      throw new Error('Error al listar pacientes.')
    }
    return data || []
  }

  /**
   * Elimina o desactiva un paciente dependiendo de su historial.
   */
  static async deletePatient(id: string) {
    if (!id) throw new ValidationError('ID de paciente inválido.')
      
    const supabase = await createClient()
    
    // Verificar si tiene historial (notas clínicas)
    const { count } = await supabase
      .from('clinical_records')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', id)

    const { data: oldData } = await supabase.from('patients').select('*').eq('id', id).single()
    if (!oldData) throw new Error('Paciente no encontrado.')

    if (count && count > 0) {
      // Soft-delete
      const { error } = await supabase
        .from('patients')
        .update({ status: 'inactivo' })
        .eq('id', id)
      
      if (error) throw new Error('Fallo al desactivar paciente.')

      await logAudit({
        action: 'UPDATE',
        table_name: 'patients',
        record_id: id,
        old_data: oldData,
        new_data: { ...oldData, status: 'inactivo' }
      })
    } else {
      // Hard-delete
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error('Fallo al eliminar paciente.')

      await logAudit({
        action: 'DELETE',
        table_name: 'patients',
        record_id: id,
        old_data: oldData
      })
    }
    
    return true
  }

  /**
   * Estadísticas del dashboard
   */
  static async getDashboardStats(userId: string) {
    const supabase = await createClient()
    
    const { count: patients } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const today = new Date().toISOString().split('T')[0]
    const { count: appointmentsToday } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', userId)
      .gte('appointment_date', `${today}T00:00:00.000Z`)
      .lte('appointment_date', `${today}T23:59:59.999Z`)

    let startOfMonth = new Date()
    startOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), 1)
    const { count: recordsThisMonth } = await supabase
      .from('clinical_records')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    return {
      patients: patients || 0,
      appointmentsToday: appointmentsToday || 0,
      recordsThisMonth: recordsThisMonth || 0
    }
  }

  /**
   * Crea un registro clínico (SOAP) y sus medicamentos
   */
  static async createRecord(userId: string, data: ClinicalRecordDTO) {
    if (!data.patient_id) throw new ValidationError('ID de paciente requerido para crear registro.')
      
    const supabase = await createClient()

    const { data: recordData, error: recordError } = await supabase
      .from('clinical_records')
      .insert({
        patient_id: data.patient_id,
        doctor_id: userId,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        status: 'activo'
      })
      .select()

    if (recordError || !recordData || recordData.length === 0) {
      console.error('PatientService.createRecord ERROR:', recordError)
      throw new Error('Fallo al crear registro clínico: ' + (recordError?.message || ''))
    }
    
    const record = recordData[0]

    // Manejo de medicamentos
    if (data.medications && data.medications.length > 0) {
      const medsToInsert = data.medications.map(med => ({
        record_id: record.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        indications: med.indications
      }))

      const { error: medsError } = await supabase.from('medications').insert(medsToInsert)
      if (medsError) {
        console.error('PatientService.createRecord MEDS ERROR:', medsError)
        // Optamos por no fallar la tx principal por ahora, en un SaaS maduro se usaría RPC/Transacción
      }
    }

    await logAudit({
      action: 'CREATE',
      table_name: 'clinical_records',
      record_id: record.id,
      new_data: record
    })

    return record
  }

  /**
   * Obtiene todos los registros clínicos de un paciente
   */
  static async getRecords(patientId: string) {
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
      console.error('PatientService.getRecords Error:', error)
      return []
    }
    return data
  }
}
