export interface Mantenimiento {
  id: number
  unidadId: number
  unidadCodigo: string
  placa: string | null
  tipo: string
  descripcion: string
  fechaVencimiento: string | null
  kilometrajeObjetivo: number | null
  kilometrajeActual: number | null
  inicioProgramado: string | null
  finProgramado: string | null
  responsableId: number
  responsable: string
  estado: string
  situacion: string
}

export interface MantenimientoCreateRequest {
  unidadId: number
  tipo: 'PREVENTIVO' | 'CORRECTIVO'
  descripcion: string
  fechaVencimiento: string | null
  kilometrajeObjetivo: number | null
  inicioProgramado: string | null
  finProgramado: string | null
  responsableId: number
  planUnidadId: number | null
  ciclo: number | null
}