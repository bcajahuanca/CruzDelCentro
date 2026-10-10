import type { Unidad } from '../types/Unidad'
import type { UnidadDetalle } from '../types/UnidadDetalle'

const API_URL = import.meta.env.VITE_API_URL + '/api/unidades'

const obtenerToken = () => {
  return localStorage.getItem('token')
}

export const listarUnidades = async (): Promise<Unidad[]> => {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${obtenerToken()}`
    }
  })

  if (!response.ok) {
    throw new Error('No se pudieron cargar las unidades')
  }

  return response.json()
}

export const obtenerUnidadPorId = async (
  id: number
): Promise<UnidadDetalle> => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${obtenerToken()}`
    }
  })

  if (!response.ok) {
    throw new Error('No se pudo cargar la unidad')
  }

  return response.json()
}

export const actualizarUnidad = async (
  id: number,
  datos: {
    placa: string
    tipoVehiculo: string
    anioFabricacion: number | null
    estado: string
    activo: boolean
    observaciones: string
  }
): Promise<UnidadDetalle> => {

  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${obtenerToken()}`
    },
    body: JSON.stringify(datos)
  })

  if (!response.ok) {
    throw new Error('No se pudo actualizar la unidad')
  }

  return response.json()
}