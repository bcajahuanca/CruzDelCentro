export interface Usuario {
  id: number
  nombres: string
  apellidos: string
  correo: string
  telefono: string | null
  activo: boolean

  rolId: number | null
  rolCodigo: string | null
  rolNombre: string | null
}

export interface RolUsuario {
  id: number
  codigo: string
  nombre: string
}

export interface CrearUsuarioRequest {
  nombres: string
  apellidos: string
  telefono: string
  rolId: number
  password: string
}

export interface ActualizarUsuarioRequest {
  nombres: string
  apellidos: string
  telefono: string
  rolId: number
  nuevaPassword: string
}

export interface CambiarEstadoUsuarioRequest {
  activo: boolean
}