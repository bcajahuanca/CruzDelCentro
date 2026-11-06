import type {
  OrdenTrabajo,
  OrdenTrabajoCreateRequest,
  OrdenIncidencia,
  OrdenActividad,
  OrdenSeguimiento,
  RepuestoDisponible,
  SalidaRepuestoResponse,
  OrdenCosto,
  OrdenEvidencia,
  OrdenResponsable
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

export async function vincularIncidenciaOrden(
  ordenId: number,
  incidenciaId: number
): Promise<void> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/incidencias/${incidenciaId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {

    const texto =
      await response.text()

    console.error(
      'Error vinculando incidencia:',
      response.status,
      texto
    )

    throw new Error(
      texto ||
      'No se pudo vincular la incidencia'
    )
  }
}

export async function listarIncidenciasOrden(
  ordenId: number
): Promise<OrdenIncidencia[]> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/incidencias`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {

    throw new Error(
      'No se pudieron cargar las incidencias vinculadas'
    )
  }

  return response.json()
}

export async function actualizarDiagnosticoOrden(
  ordenId: number,
  diagnostico: string
): Promise<OrdenTrabajo> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/diagnostico`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: diagnostico
    }
  )

  if (!response.ok) {

    const texto =
      await response.text()

    throw new Error(
      texto ||
      'No se pudo guardar el diagnóstico'
    )
  }

  return response.json()
}


export async function listarActividadesOrden(
  ordenId: number
): Promise<OrdenActividad[]> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/actividades`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar las actividades'
    )
  }

  return response.json()
}


export async function completarActividadOrden(
  ordenId: number,
  actividadId: number,
  observaciones?: string
): Promise<void> {

  const token =
    localStorage.getItem('token')

  const params =
    new URLSearchParams()

  if (
    observaciones &&
    observaciones.trim()
  ) {
    params.set(
      'observaciones',
      observaciones.trim()
    )
  }

  const query =
    params.toString()
      ? `?${params.toString()}`
      : ''

  const response = await fetch(
    `${API_URL}/${ordenId}/actividades/${actividadId}/completar${query}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {

    const texto =
      await response.text()

    throw new Error(
      texto ||
      'No se pudo completar la actividad'
    )
  }
}

export async function crearActividadOrden(
  ordenId: number,
  data: {
    descripcion: string
    obligatoria: boolean
  }
): Promise<OrdenActividad> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/actividades`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {

    const texto =
      await response.text()

    throw new Error(
      texto ||
      'No se pudo agregar la actividad'
    )
  }

  return response.json()
}

export async function iniciarOrdenTrabajo(
  ordenId: number
): Promise<OrdenTrabajo> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/iniciar`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {

    const texto =
      await response.text()

    throw new Error(
      texto ||
      'No se pudo iniciar la orden'
    )
  }

  return response.json()
}

export async function listarSeguimientoOrden(
  ordenId: number
): Promise<OrdenSeguimiento[]> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/seguimiento`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudo cargar el seguimiento'
    )
  }

  return response.json()
}

export async function registrarAvanceOrden(
  ordenId: number,
  comentario: string
): Promise<void> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/avances`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        comentario
      })
    }
  )

  if (!response.ok) {

    const texto =
      await response.text()

    throw new Error(
      texto ||
      'No se pudo registrar el avance'
    )
  }
}

export async function finalizarOrdenTrabajo(
  ordenId: number
): Promise<OrdenTrabajo> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/finalizar`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {

    const texto =
      await response.text()

    throw new Error(
      texto ||
      'No se pudo finalizar la orden'
    )
  }

  return response.json()
}

export async function listarRepuestosDisponibles(): Promise<RepuestoDisponible[]> {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/repuestos-disponibles`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar los repuestos disponibles'
    )
  }

  return response.json()
}

export async function registrarSalidaRepuesto(
  ordenId: number,
  data: {
    repuestoId: number
    almacenId: number
    cantidad: number
    precioUnitario: number
    motivo: string
  }
): Promise<SalidaRepuestoResponse> {

  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/repuestos/salida`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {
    const texto = await response.text()

    throw new Error(
      texto || 'No se pudo registrar la salida'
    )
  }

  return response.json()
}

export async function listarCostosOrden(
  ordenId: number
): Promise<OrdenCosto[]> {

  const token =
    localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/costos`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar los costos'
    )
  }

  return response.json()
}

export async function crearCostoOrden(
  ordenId: number,
  data: {
    categoria: 'MANO_OBRA' | 'SERVICIO' | 'OTRO'
    naturaleza: 'ESTIMADO' | 'REAL'
    descripcion: string
    cantidad: number
    precioUnitario: number
  }
): Promise<OrdenCosto> {

  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/costos`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {
    const texto = await response.text()

    throw new Error(
      texto || 'No se pudo registrar el costo'
    )
  }

  return response.json()
}

export async function actualizarResultadoPruebasOrden(
  ordenId: number,
  resultadoPruebas: string
) {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/resultado-pruebas`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resultadoPruebas
      })
    }
  )

  if (!response.ok) {
    const texto = await response.text()

    throw new Error(
      texto || 'No se pudo guardar el resultado de pruebas'
    )
  }

  return response.json()
}

export async function listarEvidenciasOrden(
  ordenId: number
): Promise<OrdenEvidencia[]> {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/evidencias`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudieron cargar las evidencias'
    )
  }

  return response.json()
}

export async function subirEvidenciaOrden(
  ordenId: number,
  archivo: File,
  descripcion: string
): Promise<OrdenEvidencia> {
  const token = localStorage.getItem('token')

  const formData = new FormData()

  formData.append(
    'archivo',
    archivo
  )

  formData.append(
    'descripcion',
    descripcion
  )

  const response = await fetch(
    `${API_URL}/${ordenId}/evidencias`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    }
  )

  if (!response.ok) {
    const texto = await response.text()

    throw new Error(
      texto || 'No se pudo subir la evidencia'
    )
  }

  return response.json()
}

export async function abrirEvidenciaOrden(
  ordenId: number,
  evidenciaId: number,
) {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/evidencias/${evidenciaId}/archivo`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (!response.ok) {
    throw new Error(
      'No se pudo abrir la evidencia'
    )
  }

  const blob = await response.blob()

  const url = URL.createObjectURL(blob)

  window.open(
    url,
    '_blank'
  )

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 60000)
}

export async function actualizarKilometrajeOrden(
  ordenId: number,
  kilometraje: number
) {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/kilometraje`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        kilometraje
      })
    }
  )

  if (!response.ok) {
    const texto = await response.text()

    throw new Error(
      texto || 'No se pudo guardar el kilometraje'
    )
  }

  return response.json()
}

export async function cerrarOrdenTrabajo(
  ordenId: number,
  observaciones: string
): Promise<OrdenTrabajo> {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/cerrar`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        observaciones
      })
    }
  )

  if (!response.ok) {
    const texto = await response.text()

    throw new Error(
      texto || 'No se pudo cerrar la orden'
    )
  }

  return response.json()
}

export async function cancelarOrdenTrabajo(
  ordenId: number,
  motivo: string
): Promise<OrdenTrabajo> {

  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/${ordenId}/cancelar`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        motivo
      })
    }
  )

  if (!response.ok) {
    const texto = await response.text()

    throw new Error(
      texto || 'No se pudo cancelar la orden'
    )
  }

  return response.json()
}

export async function listarResponsablesDisponibles(): Promise<OrdenResponsable[]> {
  const token = localStorage.getItem('token')

  const response = await fetch(
    `${API_URL}/responsables-disponibles`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('No se pudieron cargar los responsables')
  }

  return response.json()
}