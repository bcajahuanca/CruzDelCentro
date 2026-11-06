export type EstadoStock =
  | 'NORMAL'
  | 'BAJO'
  | 'SIN_STOCK'

export interface AlmacenExistencia {
  repuestoId: number
  codigo: string
  nombre: string
  unidadMedida: string
  stockMinimo: number

  almacenId: number
  almacen: string
  ubicacion: string | null

  cantidad: number
  estadoStock: EstadoStock
}

export interface AlmacenExistenciasPaginado {
  registros: AlmacenExistencia[]

  paginaActual: number
  totalRegistros: number
  totalPaginas: number

  totalRepuestos: number
  stockBajo: number
  sinStock: number
  movimientos30Dias: number
}

export type TipoMovimiento =
  | 'ENTRADA'
  | 'SALIDA'
  | 'DEVOLUCION'
  | 'AJUSTE_POSITIVO'
  | 'AJUSTE_NEGATIVO'

export interface MovimientoRepuesto {
  id: number
  fecha: string

  repuestoId: number
  codigoRepuesto: string
  nombreRepuesto: string

  almacenId: number
  almacen: string

  tipo: TipoMovimiento
  cantidad: number
  precioUnitario: number

  ordenId: number | null
  codigoOrden: string | null

  proveedorId: number | null
  proveedor: string | null

  registradoPor: number
  usuario: string

  motivo: string
}

export interface MovimientosPaginado {
  registros: MovimientoRepuesto[]
  paginaActual: number
  totalRegistros: number
  totalPaginas: number
}

export interface EntradaRepuestoRequest {
  repuestoId: number
  almacenId: number
  cantidad: number
  precioUnitario: number
  proveedorId: number | null
  motivo: string
}

export interface AjusteRepuestoRequest {
  repuestoId: number
  almacenId: number
  tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO'
  cantidad: number
  motivo: string
}