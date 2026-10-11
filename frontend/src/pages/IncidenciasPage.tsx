import { useEffect, useState } from 'react'

import type { Incidencia } from '../types/Incidencias'
import { listarIncidencias } from '../services/incidenciaService'

import { listarUnidades } from '../services/unidadService'

import { useNavigate } from 'react-router-dom'

import {
  crearIncidencia
} from '../services/incidenciaService'

import {
  listarTiposIncidencia,
  type TipoIncidencia
} from '../services/tipoIncidenciaService'

import type { Unidad } from '../types/Unidad'

import '../styles/incidencias.css'

function IncidenciasPage() {

  const [incidencias, setIncidencias] = useState<Incidencia[]>([])

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS')
  const [prioridadFiltro, setPrioridadFiltro] = useState('TODAS')

  const [pagina, setPagina] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalRegistros, setTotalRegistros] = useState(0)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [unidades, setUnidades] =
    useState<Unidad[]>([])

  const [tiposIncidencia, setTiposIncidencia] =
    useState<TipoIncidencia[]>([])

  const [guardando, setGuardando] =
    useState(false)

  const [errorFormulario, setErrorFormulario] =
    useState('')

  const navigate = useNavigate()

  const [form, setForm] = useState({
    unidadId: '',
    tipoIncidenciaId: '',
    descripcion: '',
    prioridad: 'MEDIA',
    ubicacion: '',
    kilometrajeReporte: ''
  })

  useEffect(() => {

    const controller = new AbortController()

    const cargarIncidencias = async () => {

      setCargando(true)
      setError('')

      try {

        const data = await listarIncidencias(
          pagina,
          busqueda,
          estadoFiltro,
          prioridadFiltro,
          controller.signal
        )

        if (controller.signal.aborted) return

        setIncidencias(data.registros)
        setTotalPaginas(data.totalPaginas)
        setTotalRegistros(data.totalRegistros)

      } catch (error) {

        if (controller.signal.aborted) return

        console.error(error)

        setError(
          'No se pudieron cargar las incidencias'
        )

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false)
        }

      }

    }

    cargarIncidencias()

    return () => controller.abort()

  }, [
    pagina,
    busqueda,
    estadoFiltro,
    prioridadFiltro
  ])

  useEffect(() => {

    const cargarCatalogos = async () => {

      try {

        const [
          unidadesData,
          tiposData
        ] = await Promise.all([
          listarUnidades(),
          listarTiposIncidencia()
        ])

        setUnidades(unidadesData)
        setTiposIncidencia(tiposData)

      } catch (error) {

        console.error(
          'Error cargando catálogos:',
          error
        )

      }

    }

    cargarCatalogos()

  }, [])


  const mostrarPrioridad = (
    prioridad: string
  ) => {

    switch (prioridad) {

      case 'BAJA':
        return 'Baja'

      case 'MEDIA':
        return 'Media'

      case 'ALTA':
        return 'Alta'

      case 'CRITICA':
        return 'Crítica'

      default:
        return prioridad

    }

  }


  const mostrarEstado = (
    estado: string
  ) => {

    switch (estado) {

      case 'REGISTRADA':
        return 'Registrada'

      case 'EN_EVALUACION':
        return 'En evaluación'

      case 'ASIGNADA':
        return 'Asignada'

      case 'EN_ATENCION':
        return 'En atención'

      case 'RESUELTA':
        return 'Resuelta'

      case 'CERRADA':
        return 'Cerrada'

      case 'ANULADA':
        return 'Anulada'

      default:
        return estado

    }

  }


  const mostrarFecha = (
    fecha: string
  ) => {

    const fechaUTC =
      new Date(
        fecha.endsWith('Z')
          ? fecha
          : `${fecha}Z`
      )

    return new Intl.DateTimeFormat(
      'es-PE',
      {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(fechaUTC)

  }


  const cambiarEstadoRapido = (
    estado: string
  ) => {

    setEstadoFiltro(estado)
    setPagina(0)

  }

  const registrarIncidencia = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    setErrorFormulario('')

    if (!form.unidadId) {
      setErrorFormulario(
        'Selecciona una unidad'
      )
      return
    }

    if (!form.tipoIncidenciaId) {
      setErrorFormulario(
        'Selecciona un tipo de incidencia'
      )
      return
    }

    if (!form.descripcion.trim()) {
      setErrorFormulario(
        'Ingresa una descripción'
      )
      return
    }

    try {

      setGuardando(true)

      await crearIncidencia({
        unidadId: Number(form.unidadId),

        tipoIncidenciaId:
          Number(form.tipoIncidenciaId),

        descripcion:
          form.descripcion.trim(),

        prioridad:
          form.prioridad,

        ubicacion:
          form.ubicacion.trim() || undefined,

        kilometrajeReporte:
          form.kilometrajeReporte
            ? Number(form.kilometrajeReporte)
            : null
      })

      setMostrarFormulario(false)

      setForm({
        unidadId: '',
        tipoIncidenciaId: '',
        descripcion: '',
        prioridad: 'MEDIA',
        ubicacion: '',
        kilometrajeReporte: ''
      })

      setPagina(0)

      const data =
        await listarIncidencias(
          0,
          busqueda,
          estadoFiltro,
          prioridadFiltro
        )

      setIncidencias(data.registros)
      setTotalPaginas(data.totalPaginas)
      setTotalRegistros(data.totalRegistros)

    } catch (error) {

      setErrorFormulario(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar la incidencia'
      )

    } finally {

      setGuardando(false)

    }
  }


  return (

    <div className="page-container">

      <div className="incidencias-page">


        {/* HEADER */}

        <div className="incidencias-header">

          <div>

            <h1>
              Incidencias
            </h1>

            <p>
              Registro y seguimiento de incidencias de las unidades.
            </p>

          </div>


          <button
            type="button"
            className="btn-registrar-incidencia"
            onClick={() => {
              setErrorFormulario('')
              setMostrarFormulario(true)
            }}
          >
            + Registrar incidencia
          </button>

        </div>


        {/* FILTROS RÁPIDOS */}

        <div className="incidencias-filtros-estado">

          <button
            className={
              estadoFiltro === 'TODOS'
                ? 'activo'
                : ''
            }
            onClick={() =>
              cambiarEstadoRapido('TODOS')
            }
          >
            Todas
          </button>


          <button
            className={
              prioridadFiltro === 'CRITICA'
                ? 'activo'
                : ''
            }
            onClick={() => {

              setPrioridadFiltro(
                prioridadFiltro === 'CRITICA'
                  ? 'TODAS'
                  : 'CRITICA'
              )

              setPagina(0)

            }}
          >
            Críticas
          </button>


          <button
            className={
              estadoFiltro === 'REGISTRADA'
                ? 'activo'
                : ''
            }
            onClick={() =>
              cambiarEstadoRapido(
                'REGISTRADA'
              )
            }
          >
            Registradas
          </button>


          <button
            className={
              estadoFiltro === 'EN_ATENCION'
                ? 'activo'
                : ''
            }
            onClick={() =>
              cambiarEstadoRapido(
                'EN_ATENCION'
              )
            }
          >
            En atención
          </button>


          <button
            className={
              estadoFiltro === 'RESUELTA'
                ? 'activo'
                : ''
            }
            onClick={() =>
              cambiarEstadoRapido(
                'RESUELTA'
              )
            }
          >
            Resueltas
          </button>

        </div>


        {/* FILTROS */}

        <div className="incidencias-filtros">

          <input
            type="text"
            placeholder="Buscar por código, unidad, placa, tipo o descripción..."
            value={busqueda}
            onChange={(e) => {

              setBusqueda(
                e.target.value
              )

              setPagina(0)

            }}
          />


          <select
            value={prioridadFiltro}
            onChange={(e) => {

              setPrioridadFiltro(
                e.target.value
              )

              setPagina(0)

            }}
          >

            <option value="TODAS">
              Todas las prioridades
            </option>

            <option value="BAJA">
              Baja
            </option>

            <option value="MEDIA">
              Media
            </option>

            <option value="ALTA">
              Alta
            </option>

            <option value="CRITICA">
              Crítica
            </option>

          </select>


          <select
            value={estadoFiltro}
            onChange={(e) => {

              setEstadoFiltro(
                e.target.value
              )

              setPagina(0)

            }}
          >

            <option value="TODOS">
              Todos los estados
            </option>

            <option value="REGISTRADA">
              Registrada
            </option>

            <option value="EN_EVALUACION">
              En evaluación
            </option>

            <option value="ASIGNADA">
              Asignada
            </option>

            <option value="EN_ATENCION">
              En atención
            </option>

            <option value="RESUELTA">
              Resuelta
            </option>

            <option value="CERRADA">
              Cerrada
            </option>

            <option value="ANULADA">
              Anulada
            </option>

          </select>

        </div>


        {/* RESULTADOS */}

        <p className="incidencias-resultados">

          Mostrando {incidencias.length} de{' '}
          {totalRegistros} incidencias

        </p>


        {/* CARGANDO */}

        {cargando && (

          <p>
            Cargando incidencias...
          </p>

        )}


        {/* ERROR */}

        {error && (

          <p className="incidencias-error">
            {error}
          </p>

        )}


        {/* TABLA */}

        {!cargando && !error && (

          <div className="incidencias-tabla-wrapper">

            <table className="incidencias-tabla">

              <thead>

                <tr>

                  <th>
                    Folio
                  </th>

                  <th>
                    Unidad
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    Descripción
                  </th>

                  <th>
                    Prioridad
                  </th>

                  <th>
                    Reportó
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Acciones
                  </th>

                </tr>

              </thead>


              <tbody>

                {incidencias.map(
                  (incidencia) => (

                    <tr key={incidencia.id}>

                      <td
                        className="incidencias-folio"
                      >
                        {incidencia.codigo}
                      </td>


                      <td>

                        PAD{' '}
                        {incidencia.unidadCodigo}

                        {incidencia.placa && (
                          <>
                            {' - '}
                            {incidencia.placa}
                          </>
                        )}

                      </td>


                      <td>
                        {incidencia.tipo}
                      </td>


                      <td>
                        {incidencia.descripcion}
                      </td>


                      <td>

                        <span
                          className={
                            `incidencias-badge ${
                              incidencia.prioridad
                                .toLowerCase()
                            }`
                          }
                        >

                          {mostrarPrioridad(
                            incidencia.prioridad
                          )}

                        </span>

                      </td>


                      <td>
                        {incidencia.reportadoPor}
                      </td>


                      <td>

                        {mostrarFecha(
                          incidencia.fechaReporte
                        )}

                      </td>


                      <td>

                        <span
                          className={
                            `incidencias-badge ${
                              incidencia.estado
                                .toLowerCase()
                            }`
                          }
                        >

                          {mostrarEstado(
                            incidencia.estado
                          )}

                        </span>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="btn-ver-incidencia"
                          onClick={() => {
                            navigate(`/incidencias/${incidencia.id}`)
                          }}
                        >
                          Ver
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>


            {incidencias.length === 0 && (

              <p className="incidencias-vacio">

                No se encontraron incidencias.

              </p>

            )}

          </div>

        )}


        {/* PAGINACIÓN */}

        {!cargando &&
          !error &&
          totalPaginas > 1 && (

            <div className="incidencias-paginacion">

              <button
                disabled={pagina === 0}
                onClick={() =>
                  setPagina(
                    paginaAnterior =>
                      paginaAnterior - 1
                  )
                }
              >
                ← Anterior
              </button>


              {Array.from(
                {
                  length: totalPaginas
                },
                (_, i) => i
              ).map((numero) => (

                <button
                  key={numero}
                  className={
                    pagina === numero
                      ? 'pagina-activa'
                      : ''
                  }
                  onClick={() =>
                    setPagina(numero)
                  }
                >
                  {numero + 1}
                </button>

              ))}


              <button
                disabled={
                  pagina >=
                  totalPaginas - 1
                }
                onClick={() =>
                  setPagina(
                    paginaAnterior =>
                      paginaAnterior + 1
                  )
                }
              >
                Siguiente →
              </button>

            </div>

          )}

      </div>

      {mostrarFormulario && (

        <div className="incidencia-modal-fondo">

          <div className="incidencia-modal">

            <div className="incidencia-modal-header">

              <div>
                <h2>Registrar incidencia</h2>

                <p>
                  Registra una nueva incidencia
                  asociada a una unidad.
                </p>
              </div>

              <button
                type="button"
                className="incidencia-modal-cerrar"
                onClick={() =>
                  setMostrarFormulario(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={registrarIncidencia}
              className="incidencia-form"
            >

              <div className="incidencia-form-grid">


                {/* UNIDAD */}

                <div className="incidencia-campo">

                  <label>
                    Unidad *
                  </label>

                  <select
                    value={form.unidadId}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        unidadId: e.target.value
                      })
                    }
                    required
                  >

                    <option value="">
                      Seleccionar unidad
                    </option>

                    {[...unidades]
                      .sort(
                        (a, b) =>
                          Number(a.codigo) -
                          Number(b.codigo)
                      )
                      .map((unidad) => (

                        <option
                          key={unidad.id}
                          value={unidad.id}
                        >
                          PAD {unidad.codigo}
                          {unidad.placa
                            ? ` - ${unidad.placa}`
                            : ''}
                        </option>

                      ))}

                  </select>

                </div>


                {/* TIPO */}

                <div className="incidencia-campo">

                  <label>
                    Tipo de incidencia *
                  </label>

                  <select
                    value={
                      form.tipoIncidenciaId
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        tipoIncidenciaId:
                          e.target.value
                      })
                    }
                    required
                  >

                    <option value="">
                      Seleccionar tipo
                    </option>

                    {tiposIncidencia.map(
                      (tipo) => (

                        <option
                          key={tipo.id}
                          value={tipo.id}
                        >
                          {tipo.nombre}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* PRIORIDAD */}

                <div className="incidencia-campo">

                  <label>
                    Prioridad *
                  </label>

                  <select
                    value={form.prioridad}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        prioridad:
                          e.target.value
                      })
                    }
                  >

                    <option value="BAJA">
                      Baja
                    </option>

                    <option value="MEDIA">
                      Media
                    </option>

                    <option value="ALTA">
                      Alta
                    </option>

                    <option value="CRITICA">
                      Crítica
                    </option>

                  </select>

                </div>


                {/* KILOMETRAJE */}

                <div className="incidencia-campo">

                  <label>
                    Kilometraje
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ej. 125430.5"
                    value={
                      form.kilometrajeReporte
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        kilometrajeReporte:
                          e.target.value
                      })
                    }
                  />

                </div>


                {/* UBICACIÓN */}

                <div className="incidencia-campo incidencia-campo-completo">

                  <label>
                    Ubicación
                  </label>

                  <input
                    type="text"
                    placeholder="Ej. Patio principal"
                    value={form.ubicacion}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        ubicacion:
                          e.target.value
                      })
                    }
                  />

                </div>


                {/* DESCRIPCIÓN */}

                <div className="incidencia-campo incidencia-campo-completo">

                  <label>
                    Descripción *
                  </label>

                  <textarea
                    rows={4}
                    placeholder="Describe la incidencia encontrada..."
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        descripcion:
                          e.target.value
                      })
                    }
                    required
                  />

                </div>

              </div>


              {errorFormulario && (

                <p className="incidencia-form-error">
                  {errorFormulario}
                </p>

              )}


              <div className="incidencia-form-acciones">

                <button
                  type="button"
                  className="btn-cancelar-incidencia"
                  onClick={() =>
                    setMostrarFormulario(false)
                  }
                  disabled={guardando}
                >
                  Cancelar
                </button>


                <button
                  type="submit"
                  className="btn-guardar-incidencia"
                  disabled={guardando}
                >

                  {guardando
                    ? 'Registrando...'
                    : 'Registrar incidencia'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  )

}

export default IncidenciasPage