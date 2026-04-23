'use client'

import React, { useState, useEffect } from 'react'
import { getPatientRadiographs, deleteRadiograph } from '@/lib/actions/radiographs'
import { Radiograph } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Trash2, Maximize2, X, FileQuestion, Calendar, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RadiographGallery({ patientId }: { patientId: string }) {
  const [radiographs, setRadiographs] = useState<Radiograph[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<Radiograph | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchRadiographs = async () => {
    setLoading(true)
    const data = await getPatientRadiographs(patientId)
    setRadiographs(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchRadiographs()
  }, [patientId])

  const handleDelete = async (rad: Radiograph) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta radiografía? Esta acción no se puede deshacer.')) return
    
    setDeletingId(rad.id)
    try {
      await deleteRadiograph(rad.id, rad.image_url, patientId)
      setRadiographs(prev => prev.filter(r => r.id !== rad.id))
    } catch (err) {
      console.error(err)
      alert('Error al eliminar la radiografía')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
        <p className="text-slate-400 text-sm italic">Cargando galería...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {radiographs.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {radiographs.map((rad) => (
            <div key={rad.id} className="group relative aspect-square bg-slate-100 rounded-[1.5rem] overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <img 
                src={rad.image_url} 
                alt={rad.type} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-xs font-bold truncate">{rad.type}</p>
                <p className="text-white/70 text-[10px]">{format(new Date(rad.date), 'dd/MM/yyyy')}</p>
              </div>

              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                  onClick={() => setSelectedImage(rad)}
                  className="p-1.5 bg-white/90 text-slate-700 rounded-lg hover:bg-white transition-colors"
                >
                  <Maximize2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(rad)}
                  disabled={deletingId === rad.id}
                  className="p-1.5 bg-white/90 text-red-500 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === rad.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <FileQuestion size={40} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No hay radiografías registradas para este paciente.</p>
        </div>
      )}

      {/* Lightbox / Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[60]"
          >
            <X size={40} />
          </button>
          
          <div className="max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6">
            <div className="flex-1 w-full relative flex items-center justify-center">
              <img 
                src={selectedImage.image_url} 
                alt="Radiografía ampliada"
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              />
            </div>
            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl w-full max-w-2xl border border-white/10 text-white flex flex-col md:flex-row justify-between gap-6">
               <div className="flex-1">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                    <Info size={18} className="text-blue-400" />
                    {selectedImage.type}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed italic">
                    {selectedImage.notes || 'Sin observaciones registradas.'}
                  </p>
               </div>
               <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2 text-white/80 font-bold text-sm bg-white/5 px-4 py-2 rounded-xl">
                    <Calendar size={14} />
                    {format(new Date(selectedImage.date), "d 'de' MMMM, yyyy", { locale: es })}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
