'use client'

import React, { useMemo } from 'react'
import { ToothStatus, OdontogramRecord } from '@/types'
import { useClinicalFlow } from '@/hooks/useClinicalFlow'
import { OdontogramUI } from './OdontogramUI'

export interface OdontogramProps {
  patientId: string
  initialData: OdontogramRecord[]
}

/**
 * Componente Contenedor (Smart Component) del Odontograma.
 * Carga el hook orquestador (useClinicalFlow), formatea los datos inyectados por
 * el backend (ahora desde la tabla rápida patient_teeth) y pasa estado al UI.
 */
export default function Odontogram({ patientId, initialData }: OdontogramProps) {
  
  // Convertimos el arreglo optimizado de la BD en un diccionario para acceso O(1)
  const recordsMap = useMemo(() => {
    const acc: Record<number, OdontogramRecord> = {}
    initialData.forEach((rec) => { 
      acc[rec.tooth_number] = rec 
    })
    return acc
  }, [initialData])

  // Hook que maneja: estados, notas, y orquestación de la IA
  const flow = useClinicalFlow(patientId, recordsMap)

  // Función derivadora para buscar el estado en O(1). 
  // Da prioridad al estado en memoria local si se está editando, 
  // o cae en el estado guardado en DB.
  const getStatus = (num: number): ToothStatus => {
    if (flow.selectedTooth === num) {
       return flow.condition // Si está editando este diente, mostramos su estado en vivo
    }
    return recordsMap[num]?.status || 'Sano'
  }

  return (
    <OdontogramUI
      selectedTooth={flow.selectedTooth}
      getStatus={getStatus}
      onToothSelect={flow.handleToothSelect}
      flowProps={flow} // Propagamos los callbacks (setCondition, setNotes, handleSave)
    />
  )
}
