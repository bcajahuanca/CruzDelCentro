export interface HistorialEstado {
  id: number
  unidadId: number
  codigo: string
  placa: string
  estado: string
  inicio: string
  fin: string | null
  motivo: string | null
  registradoPor: number | null
}

export interface HistorialPaginado {
  registros: HistorialEstado[]
  paginaActual: number
  totalRegistros: number
  totalPaginas: number
  totalGeneral: number
  totalMantenimiento: number
  totalFueraServicio: number
}