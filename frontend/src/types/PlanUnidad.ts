export interface PlanUnidad {
  id: number
  planId: number
  planNombre: string
  unidadId: number
  unidadCodigo: string
  placa: string | null
  fechaBase: string
  kilometrajeBase: number
  activo: boolean
}

export interface PlanUnidadCreateRequest {
  planId: number
  unidadId: number
  fechaBase: string
  kilometrajeBase: number
  responsableId: number
}