import {
  useEffect,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import type {
  HistorialEstado,
  HistorialMantenimiento
} from '../types/Historial'

import {
  listarHistorialEstados,
  listarHistorialMantenimientos
} from '../services/historialService'

import {
  listarUnidades
} from '../services/unidadService'

import type {
  Unidad
} from '../types/Unidad'

import '../styles/historial.css'


function HistorialPage() {

  const navigate = useNavigate()

  const [tab, setTab] =
    useState<'ESTADOS' | 'MANTENIMIENTOS'>(
      'ESTADOS'
    )


  const [historial, setHistorial] =
    useState<HistorialEstado[]>([])

  const [
    mantenimientos,
    setMantenimientos
  ] = useState<HistorialMantenimiento[]>([])


  const [busqueda, setBusqueda] =
    useState('')

  const [estadoFiltro, setEstadoFiltro] =
    useState('TODOS')

  const [tipoFiltro, setTipoFiltro] =
    useState('TODOS')

  const [
    unidadSeleccionada,
    setUnidadSeleccionada
  ] = useState('TODAS')


  const [pagina, setPagina] =
    useState(0)

  const [
    totalPaginas,
    setTotalPaginas
  ] = useState(0)

  const [
    totalRegistros,
    setTotalRegistros
  ] = useState(0)


  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')


  const [
    totalGeneral,
    setTotalGeneral
  ] = useState(0)

  const [
    totalMantenimiento,
    setTotalMantenimiento
  ] = useState(0)

  const [
    totalFueraServicio,
    setTotalFueraServicio
  ] = useState(0)


  const [unidades, setUnidades] =
    useState<Unidad[]>([])


  /*
   * Cargar unidades una sola vez
   */
  useEffect(() => {

    const cargarUnidades = async () => {

      try {

        const data =
          await listarUnidades()

        setUnidades(data)

      } catch (error) {

        console.error(
          'Error al cargar unidades:',
          error
        )

      }

    }

    cargarUnidades()

  }, [])


  /*
   * Cargar historial según tab
   */
  useEffect(() => {

    const controller =
      new AbortController()


    const cargarHistorial = async () => {

      try {

        setCargando(true)
        setError('')


        if (tab === 'ESTADOS') {

          const datos =
            await listarHistorialEstados(
              pagina,
              busqueda,
              estadoFiltro,
              unidadSeleccionada,
              controller.signal
            )

          if (
            controller.signal.aborted
          ) return


          setHistorial(
            datos.registros
          )

          setTotalPaginas(
            datos.totalPaginas
          )

          setTotalRegistros(
            datos.totalRegistros
          )

          setTotalGeneral(
            datos.totalGeneral
          )

          setTotalMantenimiento(
            datos.totalMantenimiento
          )

          setTotalFueraServicio(
            datos.totalFueraServicio
          )

        } else {

          const datos =
            await listarHistorialMantenimientos(
              pagina,
              busqueda,
              tipoFiltro,
              unidadSeleccionada,
              controller.signal
            )

          if (
            controller.signal.aborted
          ) return


          setMantenimientos(
            datos.registros
          )

          setTotalPaginas(
            datos.totalPaginas
          )

          setTotalRegistros(
            datos.totalRegistros
          )
        }

      } catch (error) {

        if (
          controller.signal.aborted
        ) return

        console.error(error)

        setError(
          'No se pudo cargar el historial'
        )

      } finally {

        if (
          !controller.signal.aborted
        ) {
          setCargando(false)
        }

      }

    }


    cargarHistorial()


    return () =>
      controller.abort()

  }, [
    tab,
    pagina,
    busqueda,
    estadoFiltro,
    tipoFiltro,
    unidadSeleccionada
  ])


  const cambiarTab = (
    nuevoTab:
      'ESTADOS' |
      'MANTENIMIENTOS'
  ) => {

    setTab(nuevoTab)

    setPagina(0)
    setBusqueda('')
    setEstadoFiltro('TODOS')
    setTipoFiltro('TODOS')
  }


  const mostrarEstado = (
    estado: string
  ) => {

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


  const mostrarTipo = (
    tipo: string
  ) => {

    switch (tipo) {

      case 'CORRECTIVO':
        return 'Correctivo'

      case 'PREVENTIVO':
        return 'Preventivo'

      default:
        return tipo
    }
  }


  const mostrarFecha = (
    fecha: string | null
  ) => {

    if (!fecha) {
      return '-'
    }

    const fechaUTC =
      new Date(
        fecha.endsWith('Z')
          ? fecha
          : `${fecha}Z`
      )

    return new Intl.DateTimeFormat(
      'es-PE',
      {
        timeZone:
          'America/Lima',

        day: '2-digit',
        month: '2-digit',
        year: 'numeric',

        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(fechaUTC)
  }


  const mostrarDinero = (
    valor: number | null
  ) => {

    if (
      valor === null ||
      valor === undefined
    ) {
      return 'S/ 0.00'
    }

    return new Intl.NumberFormat(
      'es-PE',
      {
        style: 'currency',
        currency: 'PEN'
      }
    ).format(valor)
  }


  return (

    <div className="page-container">

      <div className="historial-header">

        <div>

          <h1>
            Historial
          </h1>

          <p>
            Consulta los cambios de estado
            y mantenimientos realizados
            a la flota.
          </p>

        </div>

      </div>


      {/* TABS */}

      <div className="historial-tabs">

        <button
          type="button"
          className={
            tab === 'ESTADOS'
              ? 'historial-tab activo'
              : 'historial-tab'
          }
          onClick={() =>
            cambiarTab('ESTADOS')
          }
        >
          Estados de unidad
        </button>


        <button
          type="button"
          className={
            tab === 'MANTENIMIENTOS'
              ? 'historial-tab activo'
              : 'historial-tab'
          }
          onClick={() =>
            cambiarTab(
              'MANTENIMIENTOS'
            )
          }
        >
          Mantenimientos
        </button>

      </div>


      {error && (

        <p className="historial-error">
          {error}
        </p>

      )}


      {!error && (

        <>

          {/* RESUMEN SOLO ESTADOS */}

          {tab === 'ESTADOS' && (

            <div className="historial-resumen">

              <div>
                <span>
                  Total de registros
                </span>

                <strong>
                  {totalGeneral}
                </strong>
              </div>


              <div>
                <span>
                  Registros de mantenimiento
                </span>

                <strong>
                  {totalMantenimiento}
                </strong>
              </div>


              <div>
                <span>
                  Registros fuera de servicio
                </span>

                <strong>
                  {totalFueraServicio}
                </strong>
              </div>

            </div>

          )}


          {/* UNIDAD */}

          <div className="historial-unidad-selector">

            <label>
              Unidad
            </label>

            <select
              value={
                unidadSeleccionada
              }
              onChange={(e) => {

                setUnidadSeleccionada(
                  e.target.value
                )

                setPagina(0)
              }}
            >

              <option value="TODAS">
                Todas las unidades
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
                    value={unidad.codigo}
                  >
                    PAD {unidad.codigo}
                    {' - '}
                    {unidad.placa}
                  </option>

                ))}

            </select>

          </div>


          {/* FILTROS */}

          <div className="historial-filtros">

            <input
              type="text"
              placeholder={
                tab === 'ESTADOS'
                  ? 'Buscar por PAD o placa...'
                  : 'Buscar por OT, PAD o placa...'
              }
              value={busqueda}
              onChange={(e) => {

                setBusqueda(
                  e.target.value
                )

                setPagina(0)
              }}
            />


            {tab === 'ESTADOS' && (

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

                <option value="OPERATIVA">
                  Operativa
                </option>

                <option value="EN_MANTENIMIENTO">
                  En mantenimiento
                </option>

                <option value="FUERA_DE_SERVICIO">
                  Fuera de servicio
                </option>

              </select>

            )}


            {tab === 'MANTENIMIENTOS' && (

              <select
                value={tipoFiltro}
                onChange={(e) => {

                  setTipoFiltro(
                    e.target.value
                  )

                  setPagina(0)
                }}
              >

                <option value="TODOS">
                  Todos los tipos
                </option>

                <option value="CORRECTIVO">
                  Correctivo
                </option>

                <option value="PREVENTIVO">
                  Preventivo
                </option>

              </select>

            )}

          </div>


          <p className="historial-resultados">

            Mostrando{' '}

            {tab === 'ESTADOS'
              ? historial.length
              : mantenimientos.length}

            {' '}de{' '}

            {totalRegistros}

            {' '}registros

          </p>


          {/* TABLA ESTADOS */}

          {tab === 'ESTADOS' && (

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

                  {historial.map(
                    registro => (

                      <tr
                        key={
                          registro.id
                        }
                      >

                        <td className="historial-pad">
                          {registro.codigo}
                        </td>

                        <td>
                          {registro.placa || '-'}
                        </td>

                        <td>

                          <span
                            className={
                              `historial-badge ${registro.estado.toLowerCase()}`
                            }
                          >
                            {mostrarEstado(
                              registro.estado
                            )}
                          </span>

                        </td>

                        <td>
                          {mostrarFecha(
                            registro.inicio
                          )}
                        </td>

                        <td>
                          {registro.fin
                            ? mostrarFecha(
                                registro.fin
                              )
                            : 'Actual'
                          }
                        </td>

                        <td>
                          {registro.motivo ||
                            'Sin motivo registrado'}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>


              {historial.length === 0 && (

                <p className="historial-vacio">
                  No se encontraron registros.
                </p>

              )}

            </div>

          )}


          {/* TABLA MANTENIMIENTOS */}

          {tab === 'MANTENIMIENTOS' && (

            <div className="historial-tabla-wrapper">

              <table className="historial-tabla">

                <thead>

                  <tr>
                    <th>OT</th>
                    <th>PAD</th>
                    <th>Placa</th>
                    <th>Tipo</th>
                    <th>Fecha cierre</th>
                    <th>Kilometraje</th>
                    <th>Costo real</th>
                    <th>Costo estimado</th>
                  </tr>

                </thead>


                <tbody>

                  {mantenimientos.map(
                    mantenimiento => (

                      <tr
                        key={
                          mantenimiento.ordenId
                        }
                        className="historial-fila-click"
                        onClick={() =>
                          navigate(
                            `/ordenes-trabajo/${mantenimiento.ordenId}`
                          )
                        }
                      >

                        <td className="historial-pad">
                          {mantenimiento.codigo}
                        </td>

                        <td>
                          {mantenimiento.unidad}
                        </td>

                        <td>
                          {mantenimiento.placa ||
                            '-'}
                        </td>

                        <td>

                          <span
                            className={
                              `historial-badge ${mantenimiento.tipo.toLowerCase()}`
                            }
                          >
                            {mostrarTipo(
                              mantenimiento.tipo
                            )}
                          </span>

                        </td>

                        <td>
                          {mostrarFecha(
                            mantenimiento.fechaCierre
                          )}
                        </td>

                        <td>
                          {mantenimiento
                            .kilometrajeIntervencion
                            ?.toLocaleString(
                              'es-PE'
                            )
                            ?? '-'
                          }
                        </td>

                        <td>
                          {mostrarDinero(
                            mantenimiento.costoReal
                          )}
                        </td>

                        <td>
                          {mostrarDinero(
                            mantenimiento.costoEstimado
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>


              {mantenimientos.length === 0 && (

                <p className="historial-vacio">
                  No se encontraron mantenimientos.
                </p>

              )}

            </div>

          )}


          {/* PAGINACIÓN */}

          {!cargando &&
            totalPaginas > 1 && (

            <div className="historial-paginacion">

              <button
                disabled={
                  pagina === 0
                }
                onClick={() =>
                  setPagina(
                    p => p - 1
                  )
                }
              >
                ← Anterior
              </button>


              {Array.from(
                {
                  length:
                    totalPaginas
                },
                (_, i) => i
              ).map(numero => (

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
                    p => p + 1
                  )
                }
              >
                Siguiente →
              </button>

            </div>

          )}

        </>

      )}


      {cargando && (

        <p className="historial-vacio">
          Cargando historial...
        </p>

      )}

    </div>

  )
}

export default HistorialPage