import type {
  PlanUnidad,
  PlanUnidadCreateRequest
} from '../types/PlanUnidad'

const API_URL =
  import.meta.env.VITE_API_URL +
  '/api/planes-mantenimiento/asignaciones'

export const listarAsignaciones =
  async (): Promise<PlanUnidad[]> => {

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
        'No se pudieron cargar las asignaciones'
      )
    }

    return response.json()
  }

export const asignarPlanUnidad =
  async (
    datos: PlanUnidadCreateRequest
  ): Promise<PlanUnidad> => {

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
        'No se pudo asignar el plan'
      )
    }

    return response.json()
  }