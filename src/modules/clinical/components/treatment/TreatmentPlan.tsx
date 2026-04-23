'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { TreatmentPlanUI, TreatmentPlanData, TreatmentItem } from './TreatmentPlanUI'
import { updateItemStatusAction, registerPaymentAction } from '@/lib/actions/treatment'
import type { PaymentMethod } from '@/lib/services/payment.service'

interface TreatmentPlanProps {
  patientId: string
  planData: TreatmentPlanData
}

/**
 * Componente Contenedor (Smart)
 * Administra el estado local de los modales y orquesta las llamadas a los Server Actions (Backend).
 */
export default function TreatmentPlan({ patientId, planData }: TreatmentPlanProps) {
  const { toast } = useToast()
  
  // Estado para el modal de pagos
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo')
  const [remainingToPay, setRemainingToPay] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // ─── Lógica Clínica ───
  const handleUpdateItemStatus = async (itemId: string, newStatus: TreatmentItem['status']) => {
    toast('Actualizando estado clínico...', 'info')
    const res = await updateItemStatusAction(itemId, newStatus, patientId)
    if (res.error) {
      toast(`Error: ${res.error}`, 'error')
    } else {
      toast('Estado clínico actualizado con éxito', 'success')
      // Si el status es 'completado', en el backend ya está preparado el terreno
      // para eventualmente disparar la actualización automática del odontograma.
    }
  }

  // ─── Lógica Financiera ───
  const handleOpenPaymentModal = (planId: string, remaining: number) => {
    setRemainingToPay(remaining)
    setPaymentAmount(remaining.toString()) // Sugerimos pagar el total restante
    setPaymentModalOpen(true)
  }

  const handleRegisterPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast('Ingresa un monto válido mayor a 0', 'error')
      return
    }
    if (amount > remainingToPay) {
      toast('No puedes cobrar más del saldo deudor.', 'error')
      return
    }

    setIsProcessing(true)
    const res = await registerPaymentAction({
      patient_id: patientId,
      plan_id: planData.id,
      amount: amount,
      payment_method: paymentMethod
    })

    if (res.error) {
      toast(`Pago rechazado: ${res.error}`, 'error')
    } else {
      toast('Pago registrado correctamente. El saldo ha disminuido.', 'success')
      setPaymentModalOpen(false)
    }
    setIsProcessing(false)
  }

  return (
    <>
      {/* Interfaz delegada al componente Presentacional */}
      <TreatmentPlanUI 
        plan={planData}
        onUpdateItemStatus={handleUpdateItemStatus}
        onOpenPaymentModal={handleOpenPaymentModal}
      />

      {/* Modal Simple de Pagos (Renderizado aquí porque es lógica de UI local) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Registrar Pago</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Monto a cobrar ($)</label>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  max={remainingToPay}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 mt-1 block">Saldo restante: ${remainingToPay.toLocaleString()}</span>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Método de Pago</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRegisterPayment}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Procesando...' : 'Cobrar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
