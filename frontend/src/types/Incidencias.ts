export interface Incidencia {
  id: number
  codigo: string
  unidadId: number
  unidadCodigo: string
  placa: string | null
  tipoIncidenciaId: number
  tipo: string
  descripcion: string
  prioridad: string
  reportadoPor: string
  fechaReporte: string
  estado: string
}

export interface IncidenciasPaginadas {
  registros: Incidencia[]
  paginaActual: number
  totalRegistros: number
  totalPaginas: number
}