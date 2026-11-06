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