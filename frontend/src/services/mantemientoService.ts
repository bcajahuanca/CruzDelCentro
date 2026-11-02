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

  export interface ReprogramarMantenimientoRequest {
  fechaVencimiento: string | null
  kilometrajeObjetivo: number | null
  motivo: string
}

export const reprogramarMantenimiento =
  async (
    id: number,
    datos: ReprogramarMantenimientoRequest
  ): Promise<Mantenimiento> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      `${API_URL}/${id}/reprogramar`,
      {
        method: 'PUT',

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
        error?.mensaje ||
        error?.message ||
        'No se pudo reprogramar el mantenimiento'
      )
    }

    return response.json()
  }

export const cancelarMantenimiento =
  async (
    id: number,
    motivo: string
  ): Promise<Mantenimiento> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      `${API_URL}/${id}/cancelar`,
      {
        method: 'PUT',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          motivo
        })
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
        'No se pudo cancelar el mantenimiento'
      )
    }

    return response.json()
  }

export const iniciarMantenimiento =
  async (
    id: number
  ): Promise<Mantenimiento> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      `${API_URL}/${id}/iniciar`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {

      const error =
        await response
          .json()
          .catch(() => null)

      throw new Error(
        error?.mensaje ||
        'No se pudo iniciar el mantenimiento'
      )
    }

    return response.json()
  }

export const completarMantenimiento =
  async (
    id: number
  ): Promise<Mantenimiento> => {

    const token =
      localStorage.getItem('token')

    const response = await fetch(
      `${API_URL}/${id}/completar`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {

      const error =
        await response
          .json()
          .catch(() => null)

      throw new Error(
        error?.mensaje ||
        'No se pudo completar el mantenimiento'
      )
    }

    return response.json()
  }