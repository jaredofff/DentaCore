import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/actions/audit'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export type PlanStatus = 'activo' | 'completado' | 'descartado'
export type ItemStatus = 'pendiente' | 'en_progreso' | 'completado' | 'cancelado'

export interface CreatePlanDTO {
  patient_id: string
  name: string
  notes?: string
}

export interface CreateItemDTO {
  plan_id: string
  tooth_number: number | null // null = tratamiento general (ej. limpieza)
  procedure_name: string
  estimated_cost: number
}

/**
 * Servicio de Planes de Tratamiento
 * Arquitectura modular preparada para auto-generación vía IA y sincronización con Odontograma.
 */
export class TreatmentPlanService {
  
  /**
   * Crea un nuevo Plan de Tratamiento vacío para un paciente.
   */
  static async createPlan(doctorId: string, dto: CreatePlanDTO) {
    if (!dto.patient_id) throw new ValidationError('Se requiere el ID del paciente.')
    
    const supabase = await createClient()
    
    const { data: plan, error } = await supabase
      .from('treatment_plans')
      .insert({
        patient_id: dto.patient_id,
        doctor_id: doctorId,
        name: dto.name || 'Plan de Tratamiento General',
        status: 'activo',
        notes: dto.notes || ''
      })
      .select()
      .single()

    if (error) throw new Error('Error al crear el plan de tratamiento.')

    await logAudit({ action: 'CREATE', table_name: 'treatment_plans', record_id: plan.id, new_data: plan })
    return plan
  }

  /**
   * Agrega un procedimiento clínico al plan.
   * Preparado para ser invocado masivamente por el "clinical-ai.service" cuando la IA sugiera el plan.
   */
  static async addTreatmentItem(doctorId: string, dto: CreateItemDTO) {
    if (!dto.plan_id) throw new ValidationError('Se requiere el ID del plan.')
    if (!dto.procedure_name) throw new ValidationError('El procedimiento es requerido.')

    const supabase = await createClient()
    
    const { data: item, error } = await supabase
      .from('treatment_items')
      .insert({
        plan_id: dto.plan_id,
        tooth_number: dto.tooth_number,
        procedure_name: dto.procedure_name,
        estimated_cost: dto.estimated_cost || 0,
        status: 'pendiente'
      })
      .select()
      .single()

    if (error) throw new Error('Error al agregar el tratamiento al plan.')
    
    // Actualizar costo total del plan (calculado)
    await this.recalculatePlanCost(dto.plan_id)

    return item
  }

  /**
   * Actualiza el estado de un procedimiento específico.
   * Si se marca como "completado", en el futuro aquí dispararemos un evento
   * para actualizar automáticamente el `patient_teeth` (ej. Caries -> Restauración).
   */
  static async updateItemStatus(doctorId: string, itemId: string, newStatus: ItemStatus) {
    const supabase = await createClient()
    
    const { data: updatedItem, error } = await supabase
      .from('treatment_items')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw new Error('Error al actualizar el estado del tratamiento.')

    // Hook para integración futura: 
    // if (newStatus === 'completado' && updatedItem.tooth_number) {
    //    OdontogramService.updateToothStatus(...) 
    // }

    return updatedItem
  }

  /**
   * Helper: Recalcula el costo estimado total del plan basándose en sus items.
   */
  private static async recalculatePlanCost(planId: string) {
    const supabase = await createClient()
    const { data: items } = await supabase
      .from('treatment_items')
      .select('estimated_cost')
      .eq('plan_id', planId)
      .neq('status', 'cancelado')

    const total = items?.reduce((sum, item) => sum + (item.estimated_cost || 0), 0) || 0

    await supabase
      .from('treatment_plans')
      .update({ total_estimated_cost: total })
      .eq('id', planId)
  }

  /**
   * Obtiene los planes activos del paciente con sus respectivos tratamientos.
   */
  static async getPatientPlans(patientId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('treatment_plans')
      .select(`
        *,
        treatment_items (*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Error al obtener planes de tratamiento.')
    return data
  }
}
