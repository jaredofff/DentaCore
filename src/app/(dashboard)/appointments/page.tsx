import { getAppointments, createAppointment } from '@/lib/actions/appointments'
import { getPatients } from '@/lib/actions/patients'
import { Calendar as CalendarIcon, Clock, Plus, Stethoscope, ChevronRight, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Patient } from '@/types'
import AppointmentActions from './AppointmentActions'

export default async function AppointmentsPage() {
  const appointments = await getAppointments()
  const patients = await getPatients()

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda de Citas</h1>
          <p className="text-slate-500 mt-1">Organiza tu jornada clínica y próximos procedimientos.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <Clock size={18} className="text-blue-500" />
                   Cronograma
                </h3>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Listado General</span>
             </div>
             
             <div className="divide-y divide-slate-50">
                {appointments.length > 0 ? (
                  appointments.map((app: any) => (
                    <div key={app.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                         <div className="flex flex-col items-center justify-center min-w-[60px] p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-center">
                            <span className="text-[10px] font-bold text-blue-500 uppercase">{format(new Date(app.appointment_date), 'MMM', { locale: es })}</span>
                            <span className="text-xl font-extrabold text-slate-800 leading-none">{format(new Date(app.appointment_date), 'dd')}</span>
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                               {app.patients?.full_name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                               <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                  <Clock size={12} /> {format(new Date(app.appointment_date), 'HH:mm')}
                               </span>
                               <span className="w-1 h-1 bg-slate-200 rounded-full" />
                               <span className="text-xs font-medium text-blue-500 flex items-center gap-1">
                                  <Stethoscope size={12} /> {app.procedure || 'Consulta General'}
                               </span>
                            </div>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-4">
                          <span className={`hidden md:block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                             app.status === 'pendiente' ? 'bg-amber-50 text-amber-600' : 
                             app.status === 'confirmada' ? 'bg-blue-50 text-blue-600' :
                             app.status === 'completada' ? 'bg-emerald-50 text-emerald-600' :
                             'bg-red-50 text-red-600'
                          }`}>
                            {app.status}
                          </span>
                          <AppointmentActions appointmentId={app.id} currentStatus={app.status} />
                       </div>
                    </div>
                  ))
                ) : (
                 <div className="p-20 text-center flex flex-col items-center">
                    <CalendarIcon size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No hay citas registradas.</p>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                 <Plus size={20} className="text-blue-600" />
                 Agendar Cita
              </h2>
              <form action={createAppointment} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Paciente</label>
                    <select name="patient_id" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium">
                       <option value="">Seleccione un paciente</option>
                       {patients.map((p: Patient) => (
                         <option key={p.id} value={p.id}>{p.full_name}</option>
                       ))}
                    </select>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fecha y Hora</label>
                    <input type="datetime-local" name="appointment_date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Procedimiento</label>
                    <input type="text" name="procedure" placeholder="Ej. Extracción, Limpieza..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium" />
                 </div>

                 <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all mt-4">
                    Agendar ahora
                 </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  )
}
