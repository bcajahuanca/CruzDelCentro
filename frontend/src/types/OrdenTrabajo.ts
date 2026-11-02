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