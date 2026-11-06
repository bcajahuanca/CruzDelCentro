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

  resultadoPruebas?: string | null

  kilometrajeIntervencion?: number | null

  observacionesCierre?: string | null

  motivoEstado?: string | null
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

export interface RepuestoDisponible {
  repuestoId: number
  codigo: string
  nombre: string
  unidadMedida: string
  almacenId: number
  almacenNombre: string
  stock: number
}

export interface SalidaRepuestoResponse {
  movimientoId: number
  costoId: number
  repuestoId: number
  repuestoCodigo: string
  repuestoNombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface OrdenCosto {
  id: number
  ordenId: number
  categoria: string
  naturaleza: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  origenInventario: boolean
}

export interface OrdenEvidencia {
  id: number
  ordenId: number
  nombreArchivo: string
  tipoContenido: string
  tamanioBytes: number
  descripcion: string | null
  subidoPor: number
  usuarioNombre: string
  creadoEn: string
}

export interface OrdenResponsable {
  id: number
  nombres: string
  apellidos: string
  correo: string
  rol: string
}