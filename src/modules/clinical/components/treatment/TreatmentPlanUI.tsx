import React from 'react'
import { CheckCircle, Clock, Banknote, ShieldAlert } from 'lucide-react'

export interface TreatmentItem {
  id: string
  tooth_number: number | null
  procedure_name: string
  estimated_cost: number
  paid_amount: number
  status: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado'
}

export interface TreatmentPlanData {
  id: string
  name: string
  total_estimated_cost: number
  paid_amount: number
  treatment_items: TreatmentItem[]
}

interface Props {
  plan: TreatmentPlanData
  onUpdateItemStatus: (itemId: string, newStatus: TreatmentItem['status']) => void
  onOpenPaymentModal: (planId: string, remainingBalance: number) => void
}

/**
 * Componente Presentacional (Widget)
 * Removidos los bordes externos para adaptarse a la tarjeta del Dashboard.
 */
export function TreatmentPlanUI({ plan, onUpdateItemStatus, onOpenPaymentModal }: Props) {
  const total = Number(plan.total_estimated_cost || 0)
  const paid = Number(plan.paid_amount || 0)
  const remaining = total - paid
  const progressPercent = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* ─── HEADER Y PROGRESO FINANCIERO ─── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{plan.name}</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button className="w-full sm:w-auto flex justify-center items-center gap-2 bg-white hover:bg-slate-50 text-indigo-700 px-3 py-2 rounded-lg font-bold text-xs transition-colors border border-indigo-200 shadow-sm">
              <span className="text-lg leading-none">+</span> Item
            </button>
            <button
              onClick={() => onOpenPaymentModal(plan.id, remaining)}
              disabled={remaining <= 0}
              className="w-full sm:w-auto flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-lg font-bold text-xs transition-colors shadow-sm"
            >
              <Banknote className="w-4 h-4" />
              Cobrar
            </button>
          </div>
        </div>

        {/* Barra de Progreso */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-600">Pagado: ${paid.toLocaleString()}</span>
            <span className="text-slate-500">Total: ${total.toLocaleString()}</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* ─── LISTA DE TRATAMIENTOS (CLÍNICO) ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl bg-white">
        {plan.treatment_items?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No hay procedimientos en este plan.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {plan.treatment_items?.map((item) => (
              <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition-colors">
                
                {/* Info Clínica */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shrink-0">
                    {item.tooth_number || 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{item.procedure_name}</h4>
                    <span className="text-xs font-semibold text-slate-500 mt-0.5 block">
                      ${Number(item.estimated_cost).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Controles de Estado */}
                <div className="flex items-center justify-between mt-1">
                  {item.status === 'completado' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      <CheckCircle className="w-3.5 h-3.5" /> Completado
                    </span>
                  ) : item.status === 'en_progreso' ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                      <Clock className="w-3.5 h-3.5" /> En Progreso
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                      <ShieldAlert className="w-3.5 h-3.5" /> Pendiente
                    </span>
                  )}

                  {/* Dropdown rápido */}
                  {item.status !== 'completado' && (
                    <select 
                      className="text-xs font-semibold bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-600 outline-none focus:border-indigo-500 cursor-pointer"
                      value={item.status}
                      onChange={(e) => onUpdateItemStatus(item.id, e.target.value as any)}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="en_progreso">En Progreso</option>
                      <option value="completado">✔ Completar</option>
                      <option value="cancelado">Cancelar</option>
                    </select>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
