'use client'

import React, { useState } from 'react'
import { UploadCloud, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { uploadRadiograph } from '@/lib/actions/radiographs'
import { useToast } from './ui/Toast'

export default function RadiographUpload({ patientId }: { patientId: string }) {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      if (!selected.type.startsWith('image/')) {
        setError('Por favor, selecciona una imagen válida (JPG/PNG).')
        return
      }
      setFile(selected)
      setError(null)
      
      const objectUrl = URL.createObjectURL(selected)
      setPreviewUrl(objectUrl)
    }
  }

  const clearFile = () => {
    setFile(null)
    setPreviewUrl(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('patient_id', patientId)
    formData.append('file', file)

    try {
      const result = await uploadRadiograph(formData)
      if (result.error) {
        setError(result.error)
        toast(result.error, 'error')
      } else {
        clearFile()
        toast('Radiografía vinculada con éxito', 'success')
        const target = e.target as HTMLFormElement
        target.reset()
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado al subir radiografía.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
          <UploadCloud size={20} />
        </div>
        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Imagenológica Dental</h3>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100 animate-shake">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Camada de Archivo */}
        <div className="relative border-2 border-dashed border-slate-200 rounded-[2rem] bg-white hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center overflow-hidden min-h-[160px] group">
           {previewUrl ? (
              <>
                <button type="button" onClick={clearFile} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-all z-20">
                   <X size={16} />
                </button>
                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" />
              </>
           ) : (
              <div className="flex flex-col items-center p-6">
                <UploadCloud size={40} className="text-slate-300 mb-3 group-hover:scale-110 group-hover:text-blue-400 transition-all" />
                <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-widest">Arrastra o Selecciona</p>
                <p className="text-[10px] text-slate-300 mt-1 font-bold">JPG, PNG (Max 5MB)</p>
                <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
           )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Estudio</label>
             <select name="type" required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700">
                <option value="Periapical">Periapical</option>
                <option value="Panorámica">Panorámica</option>
                <option value="Aleta de Mordida">Aleta de Mordida</option>
                <option value="Cefalométrica">Cefalométrica</option>
                <option value="CBCT">Tomografía (CBCT)</option>
             </select>
          </div>
          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Fecha</label>
             <input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700" />
          </div>
          <div>
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Notas Rápidas</label>
             <textarea name="notes" placeholder="Hallazgos..." className="w-full h-24 p-4 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 font-medium"></textarea>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!file || loading}
        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
           <><Loader2 size={16} className="animate-spin" /> Subiendo...</>
        ) : (
           <><UploadCloud size={16} /> Vincular Imagen</>
        )}
      </button>
    </form>
  )
}
