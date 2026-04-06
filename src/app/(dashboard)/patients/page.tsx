import { getPatients } from '@/lib/actions/patients'
import { Plus, Search, User, Phone, Mail, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Patient } from '@/types'

export default async function PatientsPage() {
  const patients = await getPatients()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Directorio de Pacientes</h1>
          <p className="text-slate-500 mt-1">Administra y accede rápidamente a las fichas clínicas.</p>
        </div>
        <Link 
          href="/patients/new" 
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Registrar Paciente
        </Link>
      </header>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Buscar paciente por nombre o documento..." 
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.length > 0 ? (
          patients.map((patient: Patient) => (
            <Link 
              key={patient.id} 
              href={`/patients/${patient.id}`}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <User size={24} />
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
              
              <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{patient.full_name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full uppercase tracking-tighter">
                  {patient.folio || 'SIN FOLIO'}
                </span>
                <span className="text-slate-300">|</span>
                <p className="text-slate-400 text-xs font-medium">Historial: {patient.document_id || '---'}</p>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Phone size={14} className="text-slate-300" />
                  {patient.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Mail size={14} className="text-slate-300" />
                  <span className="truncate">{patient.email || 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
               <User size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No tienes pacientes registrados todavía</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Comienza agregando tu primer paciente para poder crear sus historias clínicas.</p>
            <Link 
              href="/patients/new" 
              className="inline-flex px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-100"
            >
              Crear primer paciente
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
