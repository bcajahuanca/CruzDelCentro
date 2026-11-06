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

export interface HistorialMantenimiento {
  ordenId: number
  codigo: string
  unidadId: number
  unidad: string
  placa: string | null
  tipo: 'PREVENTIVO' | 'CORRECTIVO'

  fechaCierre: string | null
  inicioReal: string | null
  finReal: string | null

  kilometrajeIntervencion: number | null

  diagnostico: string | null
  resultadoPruebas: string | null

  responsableId: number | null
  proveedorId: number | null

  costoReal: number | null
  costoEstimado: number | null
}

export interface HistorialMantenimientoPaginado {
  registros: HistorialMantenimiento[]
  paginaActual: number
  totalRegistros: number
  totalPaginas: number
}