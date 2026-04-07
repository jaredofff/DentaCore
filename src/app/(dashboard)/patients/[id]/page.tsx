import Link from 'next/link'
import SOAPForm from '@/components/SOAPForm'
import RadiographUpload from '@/components/RadiographUpload'
import RadiographGallery from '@/components/RadiographGallery'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  ArrowLeft, User, Phone, Mail, Calendar, MapPin, FileText, 
  Plus, Hash, UserCircle, Clock, Pill, Stethoscope, Image as ImageIcon,
  ClipboardList
} from 'lucide-react'
import { getPatient, getRecords } from '@/lib/actions/patients'
import { getLatestOdontogramStates } from '@/lib/actions/odontogram'
import { ClinicalRecord, Medication } from '@/types'
import Odontogram from '@/components/odontogram/Odontogram'

import DeletePatientButton from './DeletePatientButton'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await getPatient(id)
  const records = await getRecords(id)
  const odontogramData = await getLatestOdontogramStates(id)

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-4">
          <Hash size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Paciente no encontrado</h1>
        <p className="text-slate-400 mt-2">El registro que buscas no existe o no tienes permiso para verlo.</p>
        <Link href="/patients" className="mt-8 text-blue-600 font-bold hover:underline underline-offset-4">Volver al listado</Link>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <Link href="/patients" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-medium group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Volver al Directorio
        </Link>
        <DeletePatientButton patientId={patient.id} patientName={patient.full_name} />
      </div>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden shadow-slate-200/40">
        <div className="bg-blue-600 h-24 w-full" />
        <div className="px-8 pb-8 -mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 bg-white rounded-3xl border-4 border-white shadow-xl flex items-center justify-center text-blue-600 relative overflow-hidden">
                 <UserCircle size={80} className="text-blue-50" />
                 <div className="absolute inset-0 flex items-center justify-center bg-blue-600 text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <User size={32} />
                 </div>
              </div>
              <div className="pt-10">
                <div className="flex items-center gap-3 mt-1">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{patient.full_name}</h1>
                  {patient.status === 'inactivo' && (
                    <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-600 rounded-md uppercase tracking-widest border border-red-200">
                      Inactivo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full tracking-wider uppercase">
                    {patient.folio || 'SIN FOLIO'}
                  </span>
                  <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">ID: {patient.document_id || '---'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-slate-50">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Calendar size={12} /> Nacimiento
              </p>
              <p className="text-slate-700 font-semibold">{patient.birth_date ? format(new Date(patient.birth_date), 'dd/MM/yyyy') : '---'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Phone size={12} /> Teléfono
              </p>
              <p className="text-slate-700 font-semibold">{patient.phone || '---'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Mail size={12} /> Email
              </p>
              <p className="text-slate-700 font-semibold truncate">{patient.email || '---'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <MapPin size={12} /> Dirección
              </p>
              <p className="text-slate-700 font-semibold truncate">{patient.address || '---'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Contenido Principal (8/12) */}
        <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
             <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <div className="bg-blue-500 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-100">
                  <FileText size={24} />
                </div>
                Nueva Nota de Evolución (SOAP)
             </h2>
             <SOAPForm patientId={patient.id} />
           </div>

           <div className="space-y-8">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3 px-4">
                <div className="bg-indigo-500 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-100">
                  <Clock size={24} />
                </div>
                Histórico de Atención
              </h2>
              
              <div className="space-y-8">
                {records.length > 0 ? (
                  records.map((record: ClinicalRecord) => (
                    <div key={record.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/30 hover:shadow-2xl transition-all relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500 transition-all group-hover:w-4" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                           <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                              <Stethoscope size={24} />
                           </div>
                           <div>
                              <p className="text-slate-900 font-bold">Consulta Clínica</p>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
                                 {format(new Date(record.created_at), "eeee, d 'de' MMMM, yyyy", { locale: es })}
                              </p>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Subjetivo (S)</p>
                            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100">{record.subjective || 'Sin datos.'}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Objetivo (O)</p>
                            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100">{record.objective || 'Sin datos.'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Diagnóstico (A)</p>
                            <div className="text-indigo-900 text-sm font-bold bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 shadow-sm">
                               {record.assessment || 'Sin diagnóstico registrado.'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Plan (P)</p>
                            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-5 rounded-2xl border border-slate-100">{record.plan || 'Sin plan registrado.'}</p>
                          </div>
                        </div>
                      </div>

                      {record.medications && record.medications.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-slate-50">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                             <Pill size={14} className="text-purple-400" /> Prescripción Farmacológica
                           </p>
                           <div className="grid grid-cols-1 gap-4">
                              {record.medications?.map((med: Medication) => (
                                <div key={med.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group/med">
                                   <div className="flex items-center gap-4">
                                      <div className="p-2.5 bg-white rounded-xl border border-slate-100 text-purple-600 shadow-sm group-hover/med:scale-110 transition-transform">
                                         <Plus size={16} />
                                      </div>
                                      <div>
                                         <p className="font-extrabold text-slate-800 text-sm">{med.name}</p>
                                         <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tight">{med.dosage} • {med.frequency}</p>
                                      </div>
                                   </div>
                                   <p className="text-slate-500 text-xs italic font-medium mt-2 md:mt-0 bg-white px-4 py-2 rounded-lg border border-slate-50">{med.indications}</p>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                       <Clock size={40} />
                    </div>
                    <p className="text-slate-400 font-bold text-lg">Historial vacío</p>
                    <p className="text-slate-300 text-sm mt-1">Registra la primera nota SOAP para este paciente.</p>
                  </div>
                )}
              </div>
           </div>
        </div>

        {/* Columna Derecha: Sidebar de Herramientas (4/12) */}
        <div className="lg:col-span-4 space-y-8 order-1 lg:order-2">
           <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                 <div className="bg-blue-500 p-2 rounded-xl text-white">
                   <ImageIcon size={20} />
                 </div>
                 Galería Radiográfica
              </h2>
              <div className="space-y-8">
                <RadiographUpload patientId={patient.id} />
                <RadiographGallery patientId={patient.id} />
              </div>
           </section>

           <Odontogram patientId={patient.id} initialData={odontogramData} />
        </div>
      </div>
    </div>
  )
}
