import type {
  AlmacenExistenciasPaginado,
  MovimientosPaginado,
  EntradaRepuestoRequest,
  AjusteRepuestoRequest
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

export const listarMovimientos = async (
  pagina: number = 0,
  repuestoId?: number,
  almacenId?: number,
  tipo: string = 'TODOS',
  fechaDesde: string = '',
  fechaHasta: string = '',
  signal?: AbortSignal
): Promise<MovimientosPaginado> => {

  const token = localStorage.getItem('token')

  const params = new URLSearchParams({
    page: pagina.toString(),
    tipo
  })

  if (repuestoId) {
    params.set(
      'repuestoId',
      repuestoId.toString()
    )
  }

  if (almacenId) {
    params.set(
      'almacenId',
      almacenId.toString()
    )
  }

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
    `${API_URL}/movimientos?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal
    }
  )

  if (!response.ok) {
    throw new Error(
      'Error al cargar movimientos'
    )
  }

  return response.json()
}

export const registrarEntrada = async (
  data: EntradaRepuestoRequest
): Promise<void> => {

  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/movimientos/entrada`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {

    const mensaje =
      await response.text()

    throw new Error(
      mensaje ||
      'Error al registrar entrada'
    )
  }
}

export const registrarAjuste = async (
  data: AjusteRepuestoRequest
): Promise<void> => {

  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/movimientos/ajuste`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {
    const mensaje = await response.text()

    throw new Error(
      mensaje || 'Error al realizar el ajuste'
    )
  }
}