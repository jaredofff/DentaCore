'use client'

import { ToothStatus } from '@/types'

interface ToothProps {
  number: number
  status: ToothStatus
  onClick: () => void
}

const statusColors: Record<ToothStatus, string> = {
  'Sano': 'fill-slate-50 stroke-slate-300',
  'Caries': 'fill-red-500 stroke-red-700',
  'Restauración': 'fill-blue-500 stroke-blue-700',
  'Endodoncia': 'fill-amber-400 stroke-amber-600',
  'Extracción': 'fill-slate-300 stroke-slate-500',
  'Prótesis': 'fill-orange-400 stroke-orange-600'
}

export default function Tooth({ number, status, onClick }: ToothProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center group transition-all transform hover:scale-110 active:scale-95"
      title={`Diente ${number}: ${status}`}
    >
      <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 mb-1">{number}</span>
      <svg
        viewBox="0 0 100 120"
        className={`w-8 h-10 md:w-10 md:h-12 drop-shadow-sm group-hover:drop-shadow-md cursor-pointer ${statusColors[status]}`}
      >
        {/* Simple Tooth Shape Representation with five surfaces */}
        <rect x="25" y="10" width="50" height="60" rx="10" strokeWidth="2" />
        <path d="M25 70 Q25 110 40 110" fill="none" strokeWidth="2" />
        <path d="M75 70 Q75 110 60 110" fill="none" strokeWidth="2" />
        
        {/* Internal Detail for visual appeal */}
        <rect x="35" y="20" width="30" height="40" rx="5" fillOpacity="0.1" strokeWidth="1" />
        
        {status === 'Extracción' && (
          <path d="M20 20 L80 100 M80 20 L20 100" stroke="red" strokeWidth="5" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
