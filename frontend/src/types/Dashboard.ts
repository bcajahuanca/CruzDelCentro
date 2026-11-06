export interface DashboardEstadoFlota {
  estado:
    | 'OPERATIVA'
    | 'EN_MANTENIMIENTO'
    | 'FUERA_DE_SERVICIO'

  cantidad: number
}

export interface DashboardResumen {
  totalUnidades: number
  operativas: number
  enMantenimiento: number
  fueraServicio: number
  porcentajeDisponibilidad: number
  distribucionEstados: DashboardEstadoFlota[]
}

export interface DashboardSituacion {
  incidenciasAbiertas: number
  ordenesActivas: number
  pendientesValidacion: number
  mantenimientosPendientes: number
}

export interface DashboardUnidadAtencion {
  unidadId: number
  codigo: string
  placa: string | null
  estadoOperativo: string

  ordenId: number | null
  codigoOrden: string | null

  incidenciaId: number | null
  codigoIncidencia: string | null

  situacion: string
}

export interface DashboardProximoMantenimiento {
  programacionId: number
  unidadId: number
  codigo: string
  placa: string | null

  tipo: string
  descripcion: string | null

  fechaVencimiento: string | null
  kilometrajeObjetivo: number | null

  inicioProgramado: string | null
  finProgramado: string | null

  kilometrajeActual: number | null

  estado: string
  situacion: string | null
}

export interface DashboardTendenciaMantenimiento {
  mes: string
  preventivos: number
  correctivos: number
}