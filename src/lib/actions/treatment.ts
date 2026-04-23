'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TreatmentPlanService, ItemStatus } from '@/lib/services/treatment-plan.service'
import { PaymentService, CreatePaymentDTO } from '@/lib/services/payment.service'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user
}

export async function updateItemStatusAction(itemId: string, status: ItemStatus, patientId: string) {
  try {
    const user = await requireUser()
    await TreatmentPlanService.updateItemStatus(user.id, itemId, status)
    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function registerPaymentAction(dto: Omit<CreatePaymentDTO, 'patient_id'> & { patient_id: string }) {
  try {
    const user = await requireUser()
    await PaymentService.registerPayment(user.id, dto)
    revalidatePath(`/patients/${dto.patient_id}`)
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
