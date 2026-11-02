import type {
  Mantenimiento,
  MantenimientoCreateRequest
} from '../types/Mantenimiento'

const API_URL =
  import.meta.env.VITE_API_URL + '/api/mantenimientos'


export const listarMantenimientos =
  async (): Promise<Mantenimiento[]> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      API_URL,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(
        'No se pudieron cargar los mantenimientos'
      )
    }

    return response.json()
  }


export const crearMantenimiento =
  async (
    datos: MantenimientoCreateRequest
  ): Promise<Mantenimiento> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          Authorization:
            `Bearer ${token}`
        },

        body: JSON.stringify(datos)
      }
    )

    if (!response.ok) {

      const error =
        await response
          .json()
          .catch(() => null)

      throw new Error(
        error?.message ||
        'No se pudo programar el mantenimiento'
      )
    }

    return response.json()
  }

export const obtenerMantenimiento =
  async (
    id: number
  ): Promise<Mantenimiento> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      `${API_URL}/${id}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(
        'No se pudo obtener el mantenimiento'
      )
    }

    return response.json()
  }