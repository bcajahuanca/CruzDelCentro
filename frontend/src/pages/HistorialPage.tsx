import { useEffect, useMemo, useState } from 'react'
import type { HistorialEstado } from '../types/Historial'
import { listarHistorialEstados } from '../services/historialService'
import { listarUnidades } from "../services/unidadService"
import type { Unidad } from "../types/Unidad"
import '../styles/historial.css'

function HistorialPage() {
  const [historial, setHistorial] = useState<HistorialEstado[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS')

  const [pagina, setPagina] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [totalGeneral, setTotalGeneral] = useState(0)
  const [totalMantenimiento, setTotalMantenimiento] = useState(0)
  const [totalFueraServicio, setTotalFueraServicio] = useState(0)

  const [unidadSeleccionada, setUnidadSeleccionada] = useState("TODAS")

  const [unidades, setUnidades] = useState<Unidad[]>([])

  useEffect(() => {
    const controller = new AbortController()

    const cargarUnidades = async () => {
      try {
        const data = await listarUnidades()
        setUnidades(data)
      } catch (error) {
        console.error('Error al cargar las unidades:', error)
      }
    }

    const cargarHistorial = async () => {
      setCargando(true)
      setError('')

      try {
        const datos = await listarHistorialEstados(
          pagina,
          busqueda,
          estadoFiltro,
          unidadSeleccionada,
          controller.signal
        )

        if (controller.signal.aborted) return

        setHistorial(datos.registros)
        setTotalPaginas(datos.totalPaginas)
        setTotalRegistros(datos.totalRegistros)
        setTotalGeneral(datos.totalGeneral)
        setTotalMantenimiento(datos.totalMantenimiento)
        setTotalFueraServicio(datos.totalFueraServicio)
      } catch (err) {
        if (controller.signal.aborted) return
        setError('No se pudo cargar el historial')
      } finally {
        if (!controller.signal.aborted) {
          setCargando(false)
        }
      }
    }

    cargarUnidades()
    cargarHistorial()

    return () => controller.abort()

  }, [pagina, busqueda, estadoFiltro, unidadSeleccionada])

  const historialFiltrado = useMemo(() => {
    return historial.filter((registro) => {
      const texto = busqueda.toLowerCase()

      const coincideBusqueda =
        registro.codigo.toLowerCase().includes(texto) ||
        (registro.placa ?? '').toLowerCase().includes(texto)

      const coincideEstado =
        estadoFiltro === 'TODOS' ||
        registro.estado === estadoFiltro

      const coincideUnidad =
        unidadSeleccionada === 'TODAS' ||
        String(registro.codigo).padStart(3, '0') ===
          String(unidadSeleccionada).padStart(3, '0')

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideUnidad
      )
    })
  }, [
    historial,
    busqueda,
    estadoFiltro,
    unidadSeleccionada
  ])

  const mostrarEstado = (estado: string) => {
    switch (estado) {
      case 'OPERATIVA':
        return 'Operativa'
      case 'EN_MANTENIMIENTO':
        return 'En mantenimiento'
      case 'FUERA_DE_SERVICIO':
        return 'Fuera de servicio'
      default:
        return estado
    }
  }

  const mostrarFecha = (fecha: string | null) => {
    if (!fecha) return 'Actual'

    // El backend devuelve timestamps UTC sin zona horaria.
    const fechaUTC = new Date(fecha.endsWith('Z') ? fecha : `${fecha}Z`)

    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(fechaUTC)
  }

  if (cargando) {
    return <div className="historial-page">Cargando historial...</div>
  }

  return (
    <div className="page-container">

      <div className="historial-header">
        <div>
          <h1>Historial</h1>
          <p>Consulta los movimientos y cambios de estado de la flota.</p>
        </div>
      </div>

      {error && <p className="historial-error">{error}</p>}

      {!error && (
        <>
          <div className="historial-resumen">
            <div>
              <span>Total de registros</span>
              <strong>{totalGeneral}</strong>
            </div>

            <div>
              <span>Registros de mantenimiento</span>
              <strong>
                {totalMantenimiento}
              </strong>
            </div>

            <div>
              <span>Registros fuera de servicio</span>
              <strong>
                {totalFueraServicio}
              </strong>
            </div>
          </div>

          <div className="historial-unidad-selector">
            <label>Unidad</label>

            <select
              value={unidadSeleccionada}
              onChange={(e) => {
                setUnidadSeleccionada(e.target.value)
                setPagina(0)
              }}
            >
              <option value="TODAS">Todas las unidades</option>

              {[...unidades]
                .sort((a, b) =>
                  Number(a.codigo) - Number(b.codigo)
                )
                .map((unidad) => (
                  <option
                    key={unidad.id}
                    value={unidad.codigo}
                  >
                    PAD {unidad.codigo} - {unidad.placa}
                  </option>
                ))}
            </select>
          </div>

          <div className="historial-filtros">
            <input
              type="text"
              placeholder="Buscar por PAD o placa..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(0)
              }}
            />

            <select
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value)
                setPagina(0)
              }}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="OPERATIVA">Operativa</option>
              <option value="EN_MANTENIMIENTO">En mantenimiento</option>
              <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
            </select>
          </div>

          <p className="historial-resultados">
            Mostrando {historialFiltrado.length} de {totalRegistros} registros
          </p>

          <div className="historial-tabla-wrapper">
            <table className="historial-tabla">
              <thead>
                <tr>
                  <th>PAD</th>
                  <th>Placa</th>
                  <th>Estado</th>
                  <th>Fecha de inicio</th>
                  <th>Fecha de fin</th>
                  <th>Motivo</th>
                </tr>
              </thead>

              <tbody>
                {historialFiltrado.map(registro => (
                  <tr key={registro.id}>
                    <td className="historial-pad">
                      {registro.codigo}
                    </td>

                    <td>{registro.placa || '-'}</td>

                    <td>
                      <span className={`historial-badge ${registro.estado.toLowerCase()}`}>
                        {mostrarEstado(registro.estado)}
                      </span>
                    </td>

                    <td>{mostrarFecha(registro.inicio)}</td>
                    <td>{mostrarFecha(registro.fin)}</td>
                    <td>{registro.motivo || 'Sin motivo registrado'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {historialFiltrado.length === 0 && (
              <p className="historial-vacio">
                No se encontraron registros.
              </p>
            )}
          </div>
          {!cargando && totalPaginas > 1 && (
            <div className="historial-paginacion">

              <button
                disabled={pagina === 0}
                onClick={() => setPagina(p => p - 1)}
              >
                ← Anterior
              </button>

              {Array.from(
                { length: totalPaginas },
                (_, i) => i
              ).map((numero) => (
                <button
                  key={numero}
                  className={
                    pagina === numero ? 'pagina-activa' : ''
                  }
                  onClick={() => setPagina(numero)}
                >
                  {numero + 1}
                </button>
              ))}

              <button
                disabled={pagina >= totalPaginas - 1}
                onClick={() => setPagina(p => p + 1)}
              >
                Siguiente →
              </button>

            </div>
          )}
        </>
      )}

    </div>
  )
}

export default HistorialPage