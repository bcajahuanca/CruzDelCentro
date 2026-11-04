export interface OrdenTrabajo {
  id: number
  codigo: string

  unidadId: number
  unidadCodigo: string
  placa: string | null

  programacionId: number | null

  tipo: 'PREVENTIVO' | 'CORRECTIVO'
  diagnostico: string | null

  responsableId: number
  responsable: string

  proveedorId: number | null

  estado:
    | 'ABIERTA'
    | 'ASIGNADA'
    | 'EN_EJECUCION'
    | 'PENDIENTE_VALIDACION'
    | 'CERRADA'
    | 'CANCELADA'

  fechaApertura: string
  inicioReal: string | null
  finReal: string | null
  fechaEstimadaFin: string | null
  fechaCierre: string | null
}

export interface OrdenTrabajoCreateRequest {
  unidadId: number
  programacionId: number | null
  tipo: 'PREVENTIVO' | 'CORRECTIVO'
  responsableId: number
  proveedorId: number | null
  fechaEstimadaFin: string | null
}

export interface OrdenIncidencia {
  id: number
  codigo: string

  unidadId: number
  unidadCodigo: string
  placa: string | null

  tipo: string
  descripcion: string

  prioridad: string
  estado: string

  fechaReporte: string
}

export interface OrdenActividad {
  id: number
  ordenId: number
  descripcion: string
  ordenVisual: number
  obligatoria: boolean
  completada: boolean
  realizadaPor: number | null
  completadaEn: string | null
  observaciones: string | null
}

export interface OrdenSeguimiento {
  id: number
  usuarioId: number | null
  usuarioNombre: string | null
  fecha: string
  estadoAnterior: string | null
  estadoNuevo: string
  comentario: string | null
}