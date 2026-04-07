import { login, signup } from '../../lib/actions/auth'
import { Stethoscope } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Stethoscope className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Bienvenido al Portal Dental</h1>
          <p className="text-slate-500 mt-2 text-center text-sm">
            Gestiona tus historias clínicas de forma profesional y rápida.
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
              Correo electrónico
            </label>
            <input
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              id="email"
              name="email"
              type="email"
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {message}
            </div>
          )}

          <div className="pt-2 flex flex-col gap-3">
            <button
              formAction={login}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors shadow-md shadow-blue-200"
            >
              Iniciar sesión
            </button>
            <button
              formAction={signup}
              className="w-full bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold py-2 rounded-lg transition-all"
            >
              Registrarse
            </button>
          </div>
        </form>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
          DentaCore Clinical v1.0
        </p>
        <button className="text-blue-500 hover:text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline transition-all">
          Aviso de Privacidad (LFPDPPP)
        </button>
      </div>
    </div>
  )
}
