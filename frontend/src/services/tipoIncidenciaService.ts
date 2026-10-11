const API_URL =
  import.meta.env.VITE_API_URL +
  '/api/tipos-incidencia'

export interface TipoIncidencia {
  id: number
  nombre: string
  descripcion: string | null
}

export const listarTiposIncidencia =
  async (): Promise<TipoIncidencia[]> => {

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
        'No se pudieron cargar los tipos de incidencia'
      )
    }

    return response.json()
  }