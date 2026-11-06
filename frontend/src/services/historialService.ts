import type {
  HistorialPaginado,
  HistorialMantenimientoPaginado,
  HistorialResumenUnidad,
} from '../types/Historial'

const API_URL =
  import.meta.env.VITE_API_URL +
  '/api/historial'


export const listarHistorialEstados = async (
  pagina: number = 0,
  busqueda: string = '',
  estado: string = 'TODOS',
  unidadCodigo: string = 'TODAS',
  signal?: AbortSignal
): Promise<HistorialPaginado> => {

  const token =
    localStorage.getItem('token')

  const params =
    new URLSearchParams({
      page: pagina.toString(),
      busqueda,
      estado,
      unidadCodigo
    })

  const response = await fetch(
    `${API_URL}/estados?${params.toString()}`,
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
      'Error al cargar el historial'
    )
  }

  return response.json()
}


export const listarHistorialMantenimientos = async (
  pagina: number = 0,
  busqueda: string = '',
  tipo: string = 'TODOS',
  unidadCodigo: string = 'TODAS',
  fechaDesde: string = '',
  fechaHasta: string = '',
  signal?: AbortSignal
): Promise<HistorialMantenimientoPaginado> => {

  const token =
    localStorage.getItem('token')

  const params =
    new URLSearchParams({
      page: pagina.toString(),
      busqueda,
      tipo,
      unidadCodigo
    })

  if (fechaDesde) {
    params.set(
      'fechaDesde',
      fechaDesde
    )
  }

  if (fechaHasta) {
    params.set(
      'fechaHasta',
      fechaHasta
    )
  }

  const response = await fetch(
    `${API_URL}/mantenimientos?${params.toString()}`,
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
      'Error al cargar mantenimientos'
    )
  }

  return response.json()
}

export const listarResumenUnidades = async (
  fechaDesde: string = '',
  fechaHasta: string = '',
  unidadCodigo: string = 'TODAS',
  signal?: AbortSignal
): Promise<HistorialResumenUnidad[]> => {

  const token = localStorage.getItem('token')

  const params = new URLSearchParams({
    unidadCodigo
  })

  if (fechaDesde) {
    params.set('fechaDesde', fechaDesde)
  }

  if (fechaHasta) {
    params.set('fechaHasta', fechaHasta)
  }

  const response = await fetch(
    `${API_URL}/resumen-unidades?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      'Error al cargar costos e inmovilización'
    )
  }

  return response.json()
}