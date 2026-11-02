import type {
  OrdenTrabajo,
  OrdenTrabajoCreateRequest
} from '../types/OrdenTrabajo'

const API_URL =
  import.meta.env.VITE_API_URL +
  '/api/ordenes-trabajo'


export const listarOrdenesTrabajo =
  async (): Promise<OrdenTrabajo[]> => {

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
        'No se pudieron cargar las órdenes de trabajo'
      )
    }

    return response.json()
  }


export const obtenerOrdenTrabajo =
  async (
    id: number
  ): Promise<OrdenTrabajo> => {

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
        'No se pudo obtener la orden de trabajo'
      )
    }

    return response.json()
  }


export const crearOrdenTrabajo =
  async (
    datos: OrdenTrabajoCreateRequest
  ): Promise<OrdenTrabajo> => {

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
        error?.mensaje ||
        error?.message ||
        'No se pudo crear la orden de trabajo'
      )
    }

    return response.json()
  }