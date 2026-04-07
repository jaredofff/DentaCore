'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  LogOut, 
  Stethoscope,
  ClipboardList
} from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Pacientes', icon: Users, href: '/patients' },
  { name: 'Citas', icon: Calendar, href: '/appointments' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-100 text-white">
          <Stethoscope size={24} />
        </div>
        <span className="font-bold text-slate-800 text-xl tracking-tight">DentalVibe</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                isActive 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <item.icon size={20} className={cn(
                isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 flex flex-col gap-2">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <LogOut size={20} className="text-slate-400 group-hover:text-red-500" />
          Cerrar sesión
        </button>
        <div className="px-4 py-2 mt-2">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">DentaCore v1.0</p>
          <button className="text-[9px] font-black text-blue-400 hover:text-blue-600 uppercase tracking-tighter mt-1 transition-colors">
            Aviso de Privacidad
          </button>
        </div>
      </div>
    </div>
  )
}
