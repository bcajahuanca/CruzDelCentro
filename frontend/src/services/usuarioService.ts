import type {
  Usuario,
  RolUsuario,
  CambiarEstadoUsuarioRequest,
  CrearUsuarioRequest,
  ActualizarUsuarioRequest
} from '../types/Usuario'

const API_URL =
  `${import.meta.env.VITE_API_URL}/api/usuarios`

function obtenerToken() {
  return localStorage.getItem('token')
}

export async function listarUsuarios(
  signal?: AbortSignal
): Promise<Usuario[]> {

  const response = await fetch(
    API_URL,
    {
      headers: {
        Authorization:
          `Bearer ${obtenerToken()}`
      },
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar los usuarios'
    )
  }

  return response.json()
}

export async function listarRoles(
  signal?: AbortSignal
): Promise<RolUsuario[]> {

  const response = await fetch(
    `${API_URL}/roles`,
    {
      headers: {
        Authorization:
          `Bearer ${obtenerToken()}`
      },
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar los roles'
    )
  }

  return response.json()
}

export async function crearUsuario(
  request: CrearUsuarioRequest
): Promise<Usuario> {

  const response = await fetch(
    API_URL,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization:
          `Bearer ${obtenerToken()}`
      },

      body: JSON.stringify(request)
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudo crear el usuario'
    )
  }

  return response.json()
}


export async function actualizarUsuario(
  id: number,
  request: ActualizarUsuarioRequest
): Promise<Usuario> {

  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: 'PUT',

      headers: {
        'Content-Type': 'application/json',
        Authorization:
          `Bearer ${obtenerToken()}`
      },

      body: JSON.stringify(request)
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudo actualizar el usuario'
    )
  }

  return response.json()
}


export async function cambiarEstadoUsuario(
  id: number,
  activo: boolean
): Promise<Usuario> {

  const request:
    CambiarEstadoUsuarioRequest = {
      activo
    }

  const response = await fetch(
    `${API_URL}/${id}/estado`,
    {
      method: 'PATCH',

      headers: {
        'Content-Type': 'application/json',
        Authorization:
          `Bearer ${obtenerToken()}`
      },

      body: JSON.stringify(request)
    }
  )

  if (!response.ok) {
    throw new Error(
      activo
        ? 'No se pudo activar el usuario'
        : 'No se pudo desactivar el usuario'
    )
  }

  return response.json()
}

