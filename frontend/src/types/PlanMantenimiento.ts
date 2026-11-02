export interface ActividadPlan {
  id?: number
  descripcion: string
  ordenVisual?: number
  obligatoria: boolean
}

export interface PlanMantenimiento {
  id: number
  nombre: string
  descripcion: string | null
  criterio: 'FECHA' | 'KILOMETRAJE' | 'MIXTO'
  intervaloDias: number | null
  intervaloKm: number | null
  anticipacionDias: number
  anticipacionKm: number
  activo: boolean
  actividades: ActividadPlan[]
}

export interface PlanMantenimientoCreateRequest {
  nombre: string
  descripcion?: string
  criterio: 'FECHA' | 'KILOMETRAJE' | 'MIXTO'
  intervaloDias: number | null
  intervaloKm: number | null
  anticipacionDias: number
  anticipacionKm: number
  actividades: {
    descripcion: string
    obligatoria: boolean
  }[]
}