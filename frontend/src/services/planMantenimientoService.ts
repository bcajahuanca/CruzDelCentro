import type {
  PlanMantenimiento,
  PlanMantenimientoCreateRequest
} from '../types/PlanMantenimiento'

const API_URL =
  import.meta.env.VITE_API_URL +
  '/api/planes-mantenimiento'


export const listarPlanesMantenimiento =
  async (): Promise<PlanMantenimiento[]> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      API_URL,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(
        'No se pudieron cargar los planes de mantenimiento'
      )
    }

    return response.json()
  }


export const crearPlanMantenimiento =
  async (
    datos: PlanMantenimientoCreateRequest
  ): Promise<PlanMantenimiento> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
        'No se pudo crear el plan preventivo'
      )
    }

    return response.json()
  }