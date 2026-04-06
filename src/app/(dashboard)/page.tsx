import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  ArrowRight,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { getDashboardStats } from '@/lib/actions/patients'
import { getUpcomingAppointments } from '@/lib/actions/appointments'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function DashboardPage() {
  const statsData = await getDashboardStats()
  const upcoming = await getUpcomingAppointments()

  const stats = [
    { label: 'Pacientes Totales', value: statsData.patients.toString(), icon: Users, color: 'bg-blue-500' },
    { label: 'Citas Hoy', value: statsData.appointmentsToday.toString(), icon: CalendarIcon, color: 'bg-indigo-500' },
    { label: 'Historias este Mes', value: statsData.recordsThisMonth.toString(), icon: TrendingUp, color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Control</h1>
          <p className="text-slate-500 mt-1">Buen día Dr(a). Aquí tienes un resumen de tu actividad.</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/patients/new" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-100 flex items-center gap-2"
          >
            Nuevo Paciente
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-blue-100`}>
                <stat.icon size={22} />
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              Citas Próximas
            </h2>
            <Link href="/appointments" className="text-blue-600 text-sm font-semibold hover:underline">Ver todas</Link>
          </div>
          
          <div className="space-y-4">
            {upcoming.length > 0 ? (
              upcoming.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-blue-600">
                      <CalendarIcon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{app.patients.full_name}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(app.appointment_date), "d 'de' MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                      app.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'completada' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <CalendarIcon size={32} />
                </div>
                <p className="text-slate-400 text-sm">No hay citas programadas.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="text-emerald-500" size={20} />
              Acceso Rápido
            </h2>
            <Link href="/patients" className="text-blue-600 text-sm font-semibold hover:underline">Explorar pacientes</Link>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Link href="/patients/new" className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <Users size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Registrar Nuevo Paciente</p>
            </Link>
            <Link href="/appointments" className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <CalendarIcon size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Programar Cita</p>
            </Link>
            <div className="p-6 bg-blue-600 rounded-2xl text-white mt-2 shadow-lg shadow-blue-100 relative overflow-hidden group">
               <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform duration-700" />
               <h4 className="font-bold relative z-10">Optimización Clínica</h4>
               <p className="text-xs text-blue-100 mt-1 relative z-10">MVP Dental v1.0 - Gestión segura con Supabase.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
