import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { OdontogramService } from '@/lib/services/odontogram.service'
import { TreatmentPlanService } from '@/lib/services/treatment-plan.service'
import { ClinicalDashboardUI, TimelineEvent } from './ClinicalDashboardUI'

// Funciones Helper para el Servidor
async function getPatientFullInfo(patientId: string) {
  const supabase = await createClient()
  const { data } = await supabase.from('patients').select('*').eq('id', patientId).single()
  return data
}

// Simulamos la obtención de historial unificado (Odontograma + SOAP + Pagos)
async function getClinicalTimeline(patientId: string): Promise<TimelineEvent[]> {
  const supabase = await createClient()
  
  // En un entorno real, esto sería una consulta combinada (UNION) o un Stored Procedure
  // Aquí usamos un ejemplo representativo
  const { data: notes } = await supabase.from('clinical_records').select('created_at, assessment').eq('patient_id', patientId).limit(3)
  
  const timeline: TimelineEvent[] = []
  if (notes) {
    notes.forEach(n => timeline.push({
      id: Math.random().toString(),
      date: new Date(n.created_at).toLocaleDateString(),
      type: 'nota',
      description: `Nota SOAP: ${n.assessment.substring(0, 50)}...`
    }))
  }
  
  return timeline
}

interface ClinicalDashboardProps {
  patientId: string
}

/**
 * Componente Contenedor (Server Component)
 * Construye el objeto de datos agregados y se lo inyecta a la vista presentacional de 3 columnas.
 */
export default async function ClinicalDashboard({ patientId }: ClinicalDashboardProps) {
  
  // Consultas paralelas para máxima velocidad
  const [patientData, odontogramData, plans, timeline] = await Promise.all([
    getPatientFullInfo(patientId),
    OdontogramService.getLatestOdontogramStates(patientId),
    TreatmentPlanService.getPatientPlans(patientId).catch(() => []), 
    getClinicalTimeline(patientId)
  ])

  // Procesamiento de datos de Negocio
  const activePlan = plans?.find((p: any) => p.status === 'activo') || null
  const totalBalance = activePlan ? (Number(activePlan.total_estimated_cost) - Number(activePlan.paid_amount)) : 0
  
  // Alertas Clínicas Dummy (En un futuro esto se leería de la DB, ej: patient.medical_conditions)
  const alerts = []
  if (totalBalance > 10000) alerts.push('Saldo Vencido Alto')
  // if (patientData?.allergies) alerts.push('Alergia a Penicilina')

  const patientInfo = {
    id: patientId,
    name: patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Paciente Desconocido',
    nextAppointment: 'Mañana, 10:00 AM', // Dato a conectar con AppointmentService
    totalBalance,
    alerts
  }

  return (
    <ClinicalDashboardUI
      patient={patientInfo}
      odontogramData={odontogramData}
      activePlan={activePlan}
      timeline={timeline}
    />
  )
}
