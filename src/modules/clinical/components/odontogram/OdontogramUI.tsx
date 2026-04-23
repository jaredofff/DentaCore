import React from 'react'
import { ToothStatus } from '@/types'
import ClinicalInspectionPanel from './ClinicalInspectionPanel'

// ─── TOOTH COMPONENT (PRESENTATIONAL) ───────────────────────────────────────

const statusColors: Record<ToothStatus, string> = {
  'Sano': 'fill-white hover:fill-slate-100',
  'Caries': 'fill-red-500 hover:fill-red-400',
  'Restauración': 'fill-blue-500 hover:fill-blue-400',
  'Endodoncia': 'fill-amber-500 hover:fill-amber-400',
  'Extracción': 'fill-slate-800 hover:fill-slate-700',
  'Prótesis': 'fill-orange-500 hover:fill-orange-400',
}

// Para retrocompatibilidad con el estado de todo el diente
const baseStatusColors: Record<ToothStatus, string> = {
  'Sano': 'stroke-slate-300',
  'Caries': 'stroke-red-500 bg-red-50',
  'Restauración': 'stroke-blue-500 bg-blue-50',
  'Endodoncia': 'stroke-amber-500 bg-amber-50',
  'Extracción': 'stroke-slate-400 bg-slate-200',
  'Prótesis': 'stroke-orange-500 bg-orange-50',
}

export interface ToothProps {
  number: number
  status: ToothStatus
  isActive: boolean
  onClick: () => void
  onSurfaceClick?: (surface: string, e: React.MouseEvent) => void
  surfaces?: Record<string, string> // Mapea la superficie a su status
}

// Helpers para mapeo anatómico correcto
function getSurfaceNames(n: number) {
  const q = Math.floor(n / 10);
  const isUpper = q === 1 || q === 2;
  const isRightSidePatient = q === 1 || q === 4; // Right of patient = left on screen
  
  return {
    top: isUpper ? 'vestibular' : 'lingual',
    bottom: isUpper ? 'lingual' : 'vestibular',
    left: isRightSidePatient ? 'distal' : 'mesial',
    right: isRightSidePatient ? 'mesial' : 'distal',
    center: 'oclusal'
  }
}

export function Tooth({ number, status, isActive, onClick, onSurfaceClick, surfaces = {} }: ToothProps) {
  const sNames = getSurfaceNames(number)
  
  const getSurfaceFill = (surfaceName: string) => {
    const surfaceStatus = surfaces[surfaceName] as ToothStatus;
    if (surfaceStatus && statusColors[surfaceStatus]) return statusColors[surfaceStatus];
    
    if (status !== 'Sano' && status !== 'Extracción') {
        return statusColors[status];
    }
    return statusColors['Sano'];
  }

  const handleSurfaceClick = (surfaceName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSurfaceClick) {
      onSurfaceClick(surfaceName, e)
    }
    onClick();
  }

  return (
    <div className="relative group flex flex-col items-center flex-1 min-w-0 px-0.5 lg:px-1">
      <div
        className={`w-full flex flex-col items-center p-1 md:p-2 rounded-2xl transition-all duration-300 cursor-pointer ${
          isActive ? 'ring-4 ring-indigo-500/30 bg-indigo-50 scale-110 shadow-lg z-10' : `hover:scale-105 hover:bg-slate-50 ${baseStatusColors[status]?.split(' ')[1] || ''}`
        }`}
        onClick={onClick}
      >
        <span className={`text-[10px] sm:text-xs md:text-sm xl:text-base font-black mb-1.5 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-700'}`}>{number}</span>
        
        <svg viewBox="0 0 100 100" className={`w-full h-auto min-w-[1.5rem] max-w-[5rem] transition-colors ${baseStatusColors[status]?.split(' ')[0] || 'stroke-slate-300'}`}>
          <g strokeWidth="3" className="stroke-inherit">
            <polygon 
              points="0,0 100,0 75,25 25,25" 
              className={`transition-colors duration-200 cursor-pointer ${getSurfaceFill(sNames.top)}`}
              onClick={(e) => handleSurfaceClick(sNames.top, e)}
            />
            <polygon 
              points="100,0 100,100 75,75 75,25" 
              className={`transition-colors duration-200 cursor-pointer ${getSurfaceFill(sNames.right)}`}
              onClick={(e) => handleSurfaceClick(sNames.right, e)}
            />
            <polygon 
              points="0,100 100,100 75,75 25,75" 
              className={`transition-colors duration-200 cursor-pointer ${getSurfaceFill(sNames.bottom)}`}
              onClick={(e) => handleSurfaceClick(sNames.bottom, e)}
            />
            <polygon 
              points="0,0 25,25 25,75 0,100" 
              className={`transition-colors duration-200 cursor-pointer ${getSurfaceFill(sNames.left)}`}
              onClick={(e) => handleSurfaceClick(sNames.left, e)}
            />
            <polygon 
              points="25,25 75,25 75,75 25,75" 
              className={`transition-colors duration-200 cursor-pointer ${getSurfaceFill(sNames.center)}`}
              onClick={(e) => handleSurfaceClick(sNames.center, e)}
            />
          </g>

          {status === 'Extracción' && (
            <path d="M10 10 L90 90 M90 10 L10 90" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-red-500 pointer-events-none" />
          )}
        </svg>
      </div>
    </div>
  )
}

// ─── MAIN ODONTOGRAM UI ─────────────────────────────────────────────────────

const quadrant1 = [18, 17, 16, 15, 14, 13, 12, 11]
const quadrant2 = [21, 22, 23, 24, 25, 26, 27, 28]
const quadrant4 = [48, 47, 46, 45, 44, 43, 42, 41]
const quadrant3 = [31, 32, 33, 34, 35, 36, 37, 38]

const statusOptions: { label: ToothStatus; colorClass: string }[] = [
  { label: 'Sano', colorClass: 'bg-slate-300' },
  { label: 'Caries', colorClass: 'bg-red-500' },
  { label: 'Restauración', colorClass: 'bg-blue-500' },
  { label: 'Endodoncia', colorClass: 'bg-amber-500' },
  { label: 'Extracción', colorClass: 'bg-slate-500' },
  { label: 'Prótesis', colorClass: 'bg-orange-500' },
]

export interface OdontogramUIProps {
  selectedTooth: number | null
  getStatus: (num: number) => ToothStatus
  onToothSelect: (num: number) => void
  flowProps: any 
}

export function OdontogramUI({ selectedTooth, getStatus, onToothSelect, flowProps }: OdontogramUIProps) {
  const handleToothClick = (n: number) => {
    onToothSelect(n);
    setTimeout(() => document.getElementById('soap-ai-input')?.focus(), 100);
  }

  // Ejemplo de cómo inyectar superficies si existieran en getStatus o similar.
  // Como actualmente el backend no las devuelve, las simularemos vacías,
  // pero el componente ya está listo para recibirlas.
  const getSurfaces = (n: number) => ({})

  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-12 lg:gap-16">
      <div className="w-full flex flex-col gap-10 lg:gap-14 items-center justify-center">
        {/* Maxilar Superior */}
        <div className="flex w-full max-w-[1400px] bg-white p-3 lg:p-6 rounded-[2.5rem] border border-slate-100 justify-center items-center shadow-lg shadow-slate-200/50">
          {quadrant1.map(n => (
            <Tooth key={n} number={n} status={getStatus(n)} surfaces={getSurfaces(n)} isActive={selectedTooth === n} onClick={() => handleToothClick(n)} />
          ))}
          <div className="w-px h-16 lg:h-24 bg-slate-200 mx-2 lg:mx-4" />
          {quadrant2.map(n => (
            <Tooth key={n} number={n} status={getStatus(n)} surfaces={getSurfaces(n)} isActive={selectedTooth === n} onClick={() => handleToothClick(n)} />
          ))}
        </div>

        {/* Separador Visual Suave */}
        <div className="w-1/2 max-w-[400px] border-t-2 border-dashed border-slate-200/60" />

        {/* Maxilar Inferior */}
        <div className="flex w-full max-w-[1400px] bg-white p-3 lg:p-6 rounded-[2.5rem] border border-slate-100 justify-center items-center shadow-lg shadow-slate-200/50">
          {quadrant4.map(n => (
            <Tooth key={n} number={n} status={getStatus(n)} surfaces={getSurfaces(n)} isActive={selectedTooth === n} onClick={() => handleToothClick(n)} />
          ))}
          <div className="w-px h-16 lg:h-24 bg-slate-200 mx-2 lg:mx-4" />
          {quadrant3.map(n => (
            <Tooth key={n} number={n} status={getStatus(n)} surfaces={getSurfaces(n)} isActive={selectedTooth === n} onClick={() => handleToothClick(n)} />
          ))}
        </div>
      </div>
    </div>
  )
}
