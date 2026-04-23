import Link from 'next/link'
import RadiographUpload from '@/modules/clinical/components/RadiographUpload'
import RadiographGallery from '@/modules/clinical/components/RadiographGallery'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  ArrowLeft, User, Phone, Calendar, Hash, Image as ImageIcon
} from 'lucide-react'
import { getPatient } from '@/lib/actions/patients'
import ClinicalDashboard from '@/modules/clinical/components/dashboard/ClinicalDashboard'

import DeletePatientButton from './DeletePatientButton'

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await getPatient(id)

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-400 rounded-full flex items-center justify-center mb-4 shadow-inner">
          <Hash size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Paciente no encontrado</h1>
        <p className="text-slate-400 mt-2 font-medium">El registro que buscas no existe o careces de permisos.</p>
        <Link href="/patients" className="mt-8 text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Volver al Directorio</Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-12">
      
      {/* ─── NAVEGACIÓN SUPERIOR ─── */}
      <div className="flex items-center justify-between px-2">
        <Link href="/patients" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-all font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm hover:shadow">
          <ArrowLeft size={16} className="text-slate-400" />
          Volver
        </Link>
        <DeletePatientButton patientId={patient.id} patientName={patient.full_name} />
      </div>

      {/* ─── HEADER DEL PACIENTE (MINIMALISTA) ─── */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg shadow-slate-200/30 p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 flex items-center justify-center text-white">
             <User size={40} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient.full_name}</h1>
              {patient.status === 'inactivo' && (
                <span className="text-[10px] font-black px-2.5 py-1 bg-red-100 text-red-600 rounded-md uppercase tracking-widest border border-red-200">
                  Inactivo
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg tracking-wider uppercase border border-indigo-100">
                {patient.folio || 'SIN FOLIO'}
              </span>
              <span className="text-slate-400 font-bold text-xs tracking-widest uppercase">ID: {patient.document_id || '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 xl:gap-8 pt-4 xl:pt-0 border-t border-slate-100 xl:border-none relative z-10">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
             <div className="bg-white p-2 rounded-xl text-slate-400 shadow-sm"><Phone size={14} /></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</p>
                <p className="text-slate-700 font-extrabold text-sm">{patient.phone || 'N/A'}</p>
             </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
             <div className="bg-white p-2 rounded-xl text-slate-400 shadow-sm"><Calendar size={14} /></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nacimiento</p>
                <p className="text-slate-700 font-extrabold text-sm">{patient.birth_date ? format(new Date(patient.birth_date), 'dd/MM/yyyy') : 'N/A'}</p>
             </div>
          </div>
        </div>
      </section>

      {/* ─── NÚCLEO CLÍNICO (NUEVO DASHBOARD) ─── */}
      <section className="w-full animate-in slide-in-from-bottom-8 duration-700 delay-150">
        <ClinicalDashboard patientId={patient.id} />
      </section>

      {/* ─── GALERÍA RADIOGRÁFICA ─── */}
      <section className="w-full bg-slate-900 rounded-[2.5rem] p-8 flex flex-col shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-300">
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900 rounded-full blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

         <div className="relative z-10 flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
            <h2 className="text-2xl font-black text-white flex items-center gap-4">
              <div className="bg-slate-800 p-2.5 rounded-xl text-yellow-400 shadow-md">
                <ImageIcon size={20} />
              </div>
              Radiografías
            </h2>
         </div>
         
         <div className="relative z-10 flex flex-col lg:flex-row gap-8">
           <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 backdrop-blur-sm lg:w-1/3">
             <RadiographUpload patientId={patient.id} />
           </div>
           <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 backdrop-blur-sm flex-1 overflow-visible">
             <RadiographGallery patientId={patient.id} />
           </div>
         </div>
      </section>
      
    </div>
  )
}
