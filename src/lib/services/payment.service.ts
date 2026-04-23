import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/actions/audit'
import { ValidationError } from './treatment-plan.service'

export type PaymentMethod = 'Efectivo' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Transferencia' | 'Seguro'

export interface CreatePaymentDTO {
  patient_id: string
  plan_id: string
  item_id?: string // Opcional: Si el pago va a un procedimiento específico
  amount: number
  payment_method: PaymentMethod
  notes?: string
}

/**
 * Servicio Financiero
 * Administra pagos, abonos parciales, validación de saldos y auditoría financiera.
 */
export class PaymentService {
  
  /**
   * Registra un nuevo pago. 
   * Valida matemáticamente que no se pague más del saldo adeudado.
   */
  static async registerPayment(doctorId: string, dto: CreatePaymentDTO) {
    if (!dto.plan_id || !dto.patient_id) throw new ValidationError('Faltan datos de referencia del plan o paciente.')
    if (dto.amount <= 0) throw new ValidationError('El monto del pago debe ser mayor a 0.')
    if (!dto.payment_method) throw new ValidationError('El método de pago es requerido.')

    const supabase = await createClient()

    // 1. Validar el saldo actual del plan o del item
    const balance = await this.getBalances(dto.plan_id, dto.item_id)
    
    // Permitir un margen de error mínimo por redondeos en centavos si aplicara, 
    // pero idealmente no pagar más de lo que se debe.
    if (dto.amount > balance.remaining) {
      throw new ValidationError(`El pago de $${dto.amount} supera el saldo adeudado ($${balance.remaining}).`)
    }

    // 2. Registrar el pago en la tabla
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        patient_id: dto.patient_id,
        plan_id: dto.plan_id,
        item_id: dto.item_id || null,
        doctor_id: doctorId,
        amount: dto.amount,
        payment_method: dto.payment_method,
        notes: dto.notes || ''
      })
      .select()
      .single()

    if (paymentError) throw new Error('Fallo crítico al registrar el pago en la base de datos.')

    // 3. Actualizar los totales cacheados en las tablas de planes/items
    await this.updateAllocatedTotals(dto.plan_id, dto.item_id)

    // 4. Auditoría financiera obligatoria
    await logAudit({
      action: 'CREATE',
      table_name: 'payments',
      record_id: payment.id,
      new_data: payment
    })

    return payment
  }

  /**
   * Recalcula y actualiza la columna `paid_amount` en el plan o en el item.
   * Esto mantiene las vistas ultra-rápidas sin tener que sumar pagos (GROUP BY) en cada render.
   */
  private static async updateAllocatedTotals(planId: string, itemId?: string) {
    const supabase = await createClient()

    if (itemId) {
      // Sumar todos los pagos hechos a este item
      const { data: itemPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('item_id', itemId)
      
      const itemTotal = itemPayments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
      await supabase.from('treatment_items').update({ paid_amount: itemTotal }).eq('id', itemId)
    }

    // Sumar TODOS los pagos hechos a este plan (ya sean genéricos o por item)
    const { data: planPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('plan_id', planId)
    
    const planTotal = planPayments?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    await supabase.from('treatment_plans').update({ paid_amount: planTotal }).eq('id', planId)
  }

  /**
   * Obtiene el balance exacto (Total, Pagado, Restante)
   */
  static async getBalances(planId: string, itemId?: string) {
    const supabase = await createClient()

    if (itemId) {
      const { data: item } = await supabase
        .from('treatment_items')
        .select('estimated_cost, paid_amount')
        .eq('id', itemId)
        .single()
      
      if (!item) throw new ValidationError('Item de tratamiento no encontrado.')
      
      return {
        total: Number(item.estimated_cost),
        paid: Number(item.paid_amount || 0),
        remaining: Number(item.estimated_cost) - Number(item.paid_amount || 0)
      }
    } else {
      const { data: plan } = await supabase
        .from('treatment_plans')
        .select('total_estimated_cost, paid_amount')
        .eq('id', planId)
        .single()

      if (!plan) throw new ValidationError('Plan de tratamiento no encontrado.')
      
      return {
        total: Number(plan.total_estimated_cost),
        paid: Number(plan.paid_amount || 0),
        remaining: Number(plan.total_estimated_cost) - Number(plan.paid_amount || 0)
      }
    }
  }

  /**
   * Obtiene el historial de pagos de un plan
   */
  static async getPaymentHistory(planId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('payments')
      .select('*, treatment_items(procedure_name)')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false })

    if (error) throw new Error('Error al consultar historial de pagos.')
    return data
  }
}
