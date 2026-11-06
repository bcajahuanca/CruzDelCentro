import type {
  AlmacenExistenciasPaginado
} from '../types/Almacen'

const API_URL =
  import.meta.env.VITE_API_URL +
  '/api/almacen'

export const listarExistencias = async (
  pagina: number = 0,
  busqueda: string = '',
  almacenId?: number,
  estadoStock: string = 'TODOS',
  signal?: AbortSignal
): Promise<AlmacenExistenciasPaginado> => {

  const token =
    localStorage.getItem('token')

  const params =
    new URLSearchParams({
      page: pagina.toString(),
      busqueda,
      estadoStock
    })

  if (almacenId) {
    params.set(
      'almacenId',
      almacenId.toString()
    )
  }

  const response = await fetch(
    `${API_URL}/existencias?${params.toString()}`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      },
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      'Error al cargar almacén'
    )
  }

  return response.json()
}