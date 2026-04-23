import React from 'react'
import { Activity, FileText, Wallet, AlertCircle, History, Clock } from 'lucide-react'
import Odontogram from '../odontogram/Odontogram'
import SOAPForm from '../SOAPForm'
import TreatmentPlan from '../treatment/TreatmentPlan'

export interface DashboardPatientInfo {
  id: string
  name: string
  nextAppointment?: string
  totalBalance: number
  alerts: string[]
}

export interface TimelineEvent {
  id: string
  date: string
  type: 'nota' | 'odontograma' | 'pago' | 'plan'
  description: string
}

export interface ClinicalDashboardUIProps {
  patient: DashboardPatientInfo
  odontogramData: any[]
  activePlan: any | null
  timeline: TimelineEvent[]
}

/**
 * Componente Presentacional del Dashboard
 * Optimizado con jerarquía visual, espaciado uniforme y control de desbordamiento (Overflow).
 */
export function ClinicalDashboardUI({
  patient,
  odontogramData,
  activePlan,
  timeline
}: ClinicalDashboardUIProps) {
  return (
    <div className="w-full max-w-[1800px] mx-auto flex flex-col gap-6">
      
      {/* ─── 1. HEADER CLÍNICO (LIMPIO Y ESTRUCTURADO) ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{patient.name}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Dashboard Clínico Central</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Alertas */}
          {patient.alerts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {patient.alerts.map((alert, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wide rounded-lg border border-rose-100">
                  <AlertCircle size={14} /> {alert}
                </span>
              ))}
            </div>
          )}

          {/* Saldo Pendiente */}
          <div className="text-right pl-6 border-l border-slate-200">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
             <p className={`text-xl font-black mt-0.5 ${patient.totalBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
               ${patient.totalBalance.toLocaleString()}
             </p>
          </div>
        </div>
      </div>

      {/* ─── 2. GRID PRINCIPAL (3 COLUMNAS DE ALTURA FIJA/MAXIMA) ─── */}
      {/* 
        Usamos max-h-[800px] para evitar que la página crezca infinitamente.
        Cada sección maneja su propio scroll interno (overflow-y-auto).
      */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Izquierda: Odontograma (7 Cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[750px]">
          {/* Card Header */}
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Odontograma</h2>
              <p className="text-xs text-slate-500 font-medium">Diagnóstico Interactivo</p>
            </div>
          </div>
          {/* Card Body */}
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto overflow-x-auto lg:overflow-x-hidden bg-slate-50/30 custom-scrollbar flex flex-col justify-center items-center relative">
            <div className="w-full h-full flex items-center justify-center">
              <Odontogram patientId={patient.id} initialData={odontogramData} />
            </div>
          </div>
        </div>

        {/* Centro: SOAP Form (3 Cols) */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[750px]">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">SOAP</h2>
              <p className="text-xs text-slate-500 font-medium">IA Asistente</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <SOAPForm patientId={patient.id} />
          </div>
        </div>

        {/* Derecha: Plan de Tratamiento (2 Cols) */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[750px]">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Plan</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-slate-50/50">
            {activePlan ? (
              <div className="p-4 h-full">
                <TreatmentPlan patientId={patient.id} planData={activePlan} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-4">
                  <Wallet className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-700">Sin Plan Activo</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">No hay procedimientos financieros en curso.</p>
                <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  Crear Nuevo Plan
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── 3. TIMELINE CLÍNICO (SECCIÓN INFERIOR) ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-slate-400 w-5 h-5" />
          <h2 className="text-lg font-semibold text-slate-800">Actividad Clínico-Financiera</h2>
        </div>
        
        {timeline.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-medium text-slate-400">No hay actividad reciente en el expediente.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {timeline.map((event) => (
              <div key={event.id} className="min-w-[300px] bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-2 relative">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-1">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Clock size={12} /> {event.date}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                    event.type === 'nota' ? 'bg-emerald-100 text-emerald-700' :
                    event.type === 'pago' ? 'bg-rose-100 text-rose-700' :
                    'bg-indigo-100 text-indigo-700'
                  }`}>
                    {event.type}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-700">{event.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
