export interface Unidad {
  id: number
  codigo: string
  placa: string
  marca: string
  modelo: string
  tipoVehiculo: string
  anioFabricacion: number | null
  estado: string
  kilometrajeActual: number | null
}

export interface CrearUnidadRequest {
  codigo: String
  placa: string
  modeloId: number
  tipoVehiculo: string
  anioFabricacion: number | null
  estado: string
  activo: boolean
  observaciones: string
}

export interface Marca {
  id: number
  nombre: string
}

export interface ModeloVehiculo {
  id: number
  marcaId: number
  nombre: string
}