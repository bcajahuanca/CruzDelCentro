export interface UnidadDetalle {
  id: number
  codigo: string
  placa: string
  marca: string
  modelo: string
  tipoVehiculo: string
  anioFabricacion: number | null
  estado: string
  activo: boolean
  observaciones: string | null
  motivoCambio: string | null
}