export type Patient = {
  id: string
  full_name: string
  document_id: string | null
  birth_date: string | null
  gender: string | null
  phone: string | null
  email: string | null
  address: string | null
  folio: string | null
  created_at: string
}

export type Medication = {
  id: string
  record_id: string
  name: string
  dosage: string | null
  frequency: string | null
  indications: string | null
  created_at: string
}

export type ClinicalRecord = {
  id: string
  patient_id: string
  doctor_id: string
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  created_at: string
  medications?: Medication[]
}

export type Appointment = {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  procedure: string | null
  observations: string | null
  status: 'pendiente' | 'completada' | 'cancelada'
  created_at: string
}

export type Radiograph = {
  id: string
  patient_id: string
  clinical_record_id: string | null
  image_url: string
  type: string
  date: string
  notes: string | null
  created_at: string
}

export type ToothStatus = 'Sano' | 'Caries' | 'Restauración' | 'Endodoncia' | 'Extracción' | 'Prótesis'

export interface OdontogramRecord {
  id: string
  patient_id: string
  doctor_id: string
  tooth_number: number
  status: ToothStatus
  notes?: string
  created_at: string
}
