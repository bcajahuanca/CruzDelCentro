import type {
  Incidencia,
  IncidenciasPaginadas
} from '../types/Incidencias'

const API_URL =
  import.meta.env.VITE_API_URL + '/api/incidencias'


export interface CrearIncidenciaRequest {
  unidadId: number
  tipoIncidenciaId: number
  descripcion: string
  prioridad: string
  ubicacion?: string
  kilometrajeReporte?: number | null
}


export const listarIncidencias = async (
  pagina: number = 0,
  busqueda: string = '',
  estado: string = 'TODOS',
  prioridad: string = 'TODAS',
  signal?: AbortSignal
): Promise<IncidenciasPaginadas> => {

  const token = localStorage.getItem('token')

  const params = new URLSearchParams({
    page: pagina.toString(),
    busqueda,
    estado,
    prioridad
  })

  const response = await fetch(
    `${API_URL}?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      'Error al cargar las incidencias'
    )
  }

  return response.json()
}


export const crearIncidencia = async (
  datos: CrearIncidenciaRequest
): Promise<Incidencia> => {

  const token = localStorage.getItem('token')

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

    const error = await response
      .json()
      .catch(() => null)

    throw new Error(
      error?.message ||
      'No se pudo registrar la incidencia'
    )
  }

  return response.json()
}

export const obtenerIncidencia = async (
  id: number
): Promise<Incidencia> => {

  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudo cargar la incidencia'
    )
  }

  return response.json()
}