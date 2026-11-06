import type {
    DashboardProximoMantenimiento,
    DashboardResumen,
    DashboardSituacion,
    DashboardTendenciaMantenimiento,
    DashboardUnidadAtencion
} from '../types/Dashboard'

const API_URL =
    import.meta.env.VITE_API_URL +
    '/api/dashboard'

export const obtenerResumenDashboard =
    async (
        signal?: AbortSignal
    ): Promise<DashboardResumen> => {

        const token =
            localStorage.getItem('token')

        const response = await fetch(
            `${API_URL}/resumen`,
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
                'Error al cargar el dashboard'
            )
        }

        return response.json()
    }

export const obtenerSituacionDashboard =
    async (
        signal?: AbortSignal
    ): Promise<DashboardSituacion> => {

        const token =
            localStorage.getItem('token')

        const response = await fetch(
            `${API_URL}/situacion`,
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
                'Error al cargar la situación operativa'
            )
        }

        return response.json()
    }

export const obtenerUnidadesAtencion =
    async (
        signal?: AbortSignal
    ): Promise<DashboardUnidadAtencion[]> => {

        const token =
            localStorage.getItem('token')

        const response = await fetch(
            `${API_URL}/unidades-atencion`,
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
                'Error al cargar unidades que requieren atención'
            )
        }

        return response.json()
    }

export const obtenerProximosMantenimientos =
    async (
        signal?: AbortSignal
    ): Promise<DashboardProximoMantenimiento[]> => {

        const token =
            localStorage.getItem('token')

        const response = await fetch(
            `${API_URL}/proximos-mantenimientos`,
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
                'Error al cargar próximos mantenimientos'
            )
        }

        return response.json()
    }

export const obtenerTendenciaMantenimientos =
    async (
        signal?: AbortSignal
    ): Promise<DashboardTendenciaMantenimiento[]> => {

        const token =
            localStorage.getItem('token')

        const response = await fetch(
            `${API_URL}/tendencia-mantenimientos`,
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
                'Error al cargar tendencia de mantenimientos'
            )
        }

        return response.json()
    }