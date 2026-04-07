'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 5000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border min-w-[300px] animate-in slide-in-from-right-10 fade-in duration-300",
              t.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
              t.type === 'error' ? "bg-red-50 border-red-100 text-red-800" :
              "bg-blue-50 border-blue-100 text-blue-800"
            )}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
            {t.type === 'error' && <AlertCircle size={18} className="text-red-500" />}
            {t.type === 'info' && <Info size={18} className="text-blue-500" />}
            <p className="text-sm font-bold flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="p-1 hover:bg-black/5 rounded-lg transition-all">
              <X size={16} className="opacity-50" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
