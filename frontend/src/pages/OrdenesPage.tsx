import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  useNavigate
} from 'react-router-dom'

import type {
  OrdenTrabajo
} from '../types/OrdenTrabajo'

import type {
  Unidad
} from '../types/Unidad'

import {
  useAuth
} from '../context/AuthContext'

import {
  listarOrdenesTrabajo,
  crearOrdenTrabajo
} from '../services/ordenTrabajoService'

import {
  listarUnidades
} from '../services/unidadService'

import '../styles/ordenesTrabajo.css'


function OrdenesTrabajoPage() {

  const navigate = useNavigate()


  const [
    ordenes,
    setOrdenes
  ] = useState<OrdenTrabajo[]>([])


  const [
    unidades,
    setUnidades
  ] = useState<Unidad[]>([])


  const [
    cargando,
    setCargando
  ] = useState(true)


  const [
    error,
    setError
  ] = useState('')


  const [
    busqueda,
    setBusqueda
  ] = useState('')


  const [
    tipoFiltro,
    setTipoFiltro
  ] = useState('TODOS')


  const [
    estadoFiltro,
    setEstadoFiltro
  ] = useState('TODOS')


  const [
    mostrarFormulario,
    setMostrarFormulario
  ] = useState(false)


  const [
    guardando,
    setGuardando
  ] = useState(false)


  const [
    errorFormulario,
    setErrorFormulario
  ] = useState('')


  const [
    form,
    setForm
  ] = useState({
    unidadId: '',
    programacionId: '',
    tipo: 'CORRECTIVO',
    responsableId: '3',
    proveedorId: '',
    fechaEstimadaFin: ''
  })

  const {
    tienePermiso
  } = useAuth()

  useEffect(() => {

    const cargarDatos = async () => {

      try {

        setCargando(true)
        setError('')

        const [
          ordenesData,
          unidadesData
        ] = await Promise.all([
          listarOrdenesTrabajo(),
          listarUnidades()
        ])

        setOrdenes(ordenesData)
        setUnidades(unidadesData)

      } catch (error) {

        console.error(error)

        setError(
          'No se pudieron cargar las órdenes de trabajo'
        )

      } finally {

        setCargando(false)

      }

    }

    cargarDatos()

  }, [])


  const ordenesFiltradas =
    useMemo(() => {

      return ordenes.filter(
        orden => {

          const texto =
            busqueda
              .trim()
              .toLowerCase()


          const coincideBusqueda =
            texto === '' ||

            orden.codigo
              .toLowerCase()
              .includes(texto) ||

            orden.unidadCodigo
              .toLowerCase()
              .includes(texto) ||

            orden.placa
              ?.toLowerCase()
              .includes(texto) ||

            orden.responsable
              .toLowerCase()
              .includes(texto)


          const coincideTipo =
            tipoFiltro === 'TODOS' ||
            orden.tipo === tipoFiltro


          const coincideEstado =
            estadoFiltro === 'TODOS' ||
            orden.estado === estadoFiltro


          return (
            coincideBusqueda &&
            coincideTipo &&
            coincideEstado
          )

        }
      )

    }, [
      ordenes,
      busqueda,
      tipoFiltro,
      estadoFiltro
    ])


  const totalAbiertas =
    ordenes.filter(
      o => o.estado === 'ABIERTA'
    ).length


  const totalEjecucion =
    ordenes.filter(
      o => o.estado === 'EN_EJECUCION'
    ).length


  const totalPendientes =
    ordenes.filter(
      o =>
        o.estado ===
        'PENDIENTE_VALIDACION'
    ).length


  const totalCerradas =
    ordenes.filter(
      o => o.estado === 'CERRADA'
    ).length


  const mostrarEstado = (
    estado: string
  ) => {

    switch (estado) {

      case 'ABIERTA':
        return 'Abierta'

      case 'ASIGNADA':
        return 'Asignada'

      case 'EN_EJECUCION':
        return 'En ejecución'

      case 'PENDIENTE_VALIDACION':
        return 'Pendiente validación'

      case 'CERRADA':
        return 'Cerrada'

      case 'CANCELADA':
        return 'Cancelada'

      default:
        return estado
    }
  }


  const mostrarTipo = (
    tipo: string
  ) => {

    return tipo === 'PREVENTIVO'
      ? 'Preventivo'
      : 'Correctivo'
  }


  const mostrarFecha = (
    fecha: string | null
  ) => {

    if (!fecha) {
      return 'No definida'
    }

    return new Date(
      fecha
    ).toLocaleString(
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
    )
  }


  const guardarOrden = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    setErrorFormulario('')


    if (!form.unidadId) {

      setErrorFormulario(
        'Debe seleccionar una unidad'
      )

      return
    }


    if (!form.responsableId) {

      setErrorFormulario(
        'Debe seleccionar un responsable'
      )

      return
    }


    try {

      setGuardando(true)


      await crearOrdenTrabajo({

        unidadId:
          Number(form.unidadId),

        programacionId:
          form.programacionId
            ? Number(
                form.programacionId
              )
            : null,

        tipo:
          form.tipo as
            'PREVENTIVO' |
            'CORRECTIVO',

        responsableId:
          Number(
            form.responsableId
          ),

        proveedorId:
          form.proveedorId
            ? Number(
                form.proveedorId
              )
            : null,

        fechaEstimadaFin:
          form.fechaEstimadaFin ||
          null
      })


      const nuevasOrdenes =
        await listarOrdenesTrabajo()

      setOrdenes(nuevasOrdenes)


      setForm({
        unidadId: '',
        programacionId: '',
        tipo: 'CORRECTIVO',
        responsableId: '3',
        proveedorId: '',
        fechaEstimadaFin: ''
      })


      setMostrarFormulario(false)

    } catch (error) {

      console.error(error)

      setErrorFormulario(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la orden'
      )

    } finally {

      setGuardando(false)

    }

  }


  return (

    <div className="page-container">

      <div className="ordenes-page">


        {/* HEADER */}

        <div className="ordenes-header">

          <div>

            <h1>
              Órdenes de Trabajo
            </h1>

            <p>
              Gestión de intervenciones
              preventivas y correctivas
              de la flota.
            </p>

          </div>

          {tienePermiso('orden.crear') && (

            <button
              type="button"
              className="btn-nueva-orden"
              onClick={() => {

                setErrorFormulario('')

                setMostrarFormulario(
                  true
                )

              }}
            >
              + Nueva orden
            </button>

          )}

        </div>


        {/* RESUMEN */}

        <div className="ordenes-resumen">

          <div className="orden-card">

            <span>
              Abiertas
            </span>

            <strong>
              {totalAbiertas}
            </strong>

          </div>


          <div className="orden-card">

            <span>
              En ejecución
            </span>

            <strong>
              {totalEjecucion}
            </strong>

          </div>


          <div className="orden-card">

            <span>
              Pendientes de validación
            </span>

            <strong>
              {totalPendientes}
            </strong>

          </div>


          <div className="orden-card">

            <span>
              Cerradas
            </span>

            <strong>
              {totalCerradas}
            </strong>

          </div>

        </div>


        {/* FILTROS */}

        <div className="ordenes-filtros">

          <input
            type="text"
            placeholder="Buscar por OT, PAD, placa o responsable..."
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
          />


          <select
            value={tipoFiltro}
            onChange={(e) =>
              setTipoFiltro(
                e.target.value
              )
            }
          >

            <option value="TODOS">
              Todos los tipos
            </option>

            <option value="PREVENTIVO">
              Preventivo
            </option>

            <option value="CORRECTIVO">
              Correctivo
            </option>

          </select>


          <select
            value={estadoFiltro}
            onChange={(e) =>
              setEstadoFiltro(
                e.target.value
              )
            }
          >

            <option value="TODOS">
              Todos los estados
            </option>

            <option value="ABIERTA">
              Abierta
            </option>

            <option value="ASIGNADA">
              Asignada
            </option>

            <option value="EN_EJECUCION">
              En ejecución
            </option>

            <option value="PENDIENTE_VALIDACION">
              Pendiente validación
            </option>

            <option value="CERRADA">
              Cerrada
            </option>

            <option value="CANCELADA">
              Cancelada
            </option>

          </select>

        </div>


        <p className="ordenes-resultados">

          Mostrando{' '}
          {ordenesFiltradas.length}{' '}
          de {ordenes.length}{' '}
          órdenes

        </p>


        {/* LOADING */}

        {cargando && (

          <p>
            Cargando órdenes...
          </p>

        )}


        {/* ERROR */}

        {error && (

          <p className="ordenes-error">
            {error}
          </p>

        )}


        {/* TABLA */}

        {!cargando &&
          !error && (

          <div className="ordenes-tabla-wrapper">

            <table className="ordenes-tabla">

              <thead>

                <tr>

                  <th>
                    Código
                  </th>

                  <th>
                    Unidad
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    Responsable
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Apertura
                  </th>

                  <th>
                    Fin estimado
                  </th>

                  <th>
                    Acciones
                  </th>

                </tr>

              </thead>


              <tbody>

                {ordenesFiltradas.map(
                  orden => (

                    <tr
                      key={orden.id}
                    >

                      <td>

                        <strong>
                          {orden.codigo}
                        </strong>

                      </td>


                      <td>

                        <strong>
                          PAD{' '}
                          {
                            orden.unidadCodigo
                          }
                        </strong>

                        <span className="orden-placa">
                          {orden.placa}
                        </span>

                      </td>


                      <td>

                        <span
                          className={
                            `orden-tipo ${
                              orden.tipo
                                .toLowerCase()
                            }`
                          }
                        >
                          {mostrarTipo(
                            orden.tipo
                          )}
                        </span>

                      </td>


                      <td>
                        {
                          orden.responsable
                        }
                      </td>


                      <td>

                        <span
                          className={
                            `orden-estado ${
                              orden.estado
                                .toLowerCase()
                            }`
                          }
                        >
                          {mostrarEstado(
                            orden.estado
                          )}
                        </span>

                      </td>


                      <td>
                        {mostrarFecha(
                          orden.fechaApertura
                        )}
                      </td>


                      <td>
                        {mostrarFecha(
                          orden.fechaEstimadaFin
                        )}
                      </td>


                      <td>

                        <button
                          type="button"
                          className="btn-ver-orden"
                          onClick={() =>
                            navigate(
                              `/ordenes-trabajo/${orden.id}`
                            )
                          }
                        >
                          Ver
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>


            {ordenesFiltradas.length ===
              0 && (

              <p className="ordenes-vacio">

                No se encontraron
                órdenes de trabajo.

              </p>

            )}

          </div>

        )}


        {/* MODAL */}

        {mostrarFormulario && 
          tienePermiso('orden.crear') && (

          <div className="orden-modal-fondo">

            <div className="orden-modal">

              <div className="orden-modal-header">

                <div>

                  <h2>
                    Nueva orden de trabajo
                  </h2>

                  <p>
                    Registra una nueva
                    intervención para una unidad.
                  </p>

                </div>


                <button
                  type="button"
                  className="orden-modal-cerrar"
                  onClick={() =>
                    setMostrarFormulario(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>


              <form
                className="orden-form"
                onSubmit={guardarOrden}
              >

                <div className="orden-form-grid">


                  {/* UNIDAD */}

                  <div className="orden-campo">

                    <label>
                      Unidad *
                    </label>

                    <select
                      value={
                        form.unidadId
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          unidadId:
                            e.target.value
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
                            Number(
                              a.codigo
                            ) -
                            Number(
                              b.codigo
                            )
                        )
                        .map(
                          unidad => (

                            <option
                              key={
                                unidad.id
                              }
                              value={
                                unidad.id
                              }
                            >
                              PAD{' '}
                              {unidad.codigo}
                              {' - '}
                              {unidad.placa}
                            </option>

                          )
                        )}

                    </select>

                  </div>


                  {/* TIPO */}

                  <div className="orden-campo">

                    <label>
                      Tipo *
                    </label>

                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tipo:
                            e.target.value
                        })
                      }
                    >

                      <option value="CORRECTIVO">
                        Correctivo
                      </option>

                      <option value="PREVENTIVO">
                        Preventivo
                      </option>

                    </select>

                  </div>


                  {/* FIN ESTIMADO */}

                  <div className="orden-campo">

                    <label>
                      Fecha estimada de fin
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.fechaEstimadaFin
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fechaEstimadaFin:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* RESPONSABLE */}

                  <div className="orden-campo">

                    <label>
                      Responsable *
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        form.responsableId
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          responsableId:
                            e.target.value
                        })
                      }
                    />

                    <small>
                      Por ahora usamos el ID
                      del usuario responsable.
                    </small>

                  </div>


                  {/* PROGRAMACIÓN */}

                  <div className="orden-campo">

                    <label>
                      Programación relacionada
                    </label>

                    <input
                      type="number"
                      min="1"
                      placeholder="Opcional"
                      value={
                        form.programacionId
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          programacionId:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* PROVEEDOR */}

                  <div className="orden-campo">

                    <label>
                      Proveedor
                    </label>

                    <input
                      type="number"
                      min="1"
                      placeholder="Opcional"
                      value={
                        form.proveedorId
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          proveedorId:
                            e.target.value
                        })
                      }
                    />

                  </div>

                </div>


                {errorFormulario && (

                  <p className="orden-form-error">
                    {errorFormulario}
                  </p>

                )}


                <div className="orden-form-acciones">

                  <button
                    type="button"
                    className="btn-cancelar-orden"
                    disabled={
                      guardando
                    }
                    onClick={() =>
                      setMostrarFormulario(
                        false
                      )
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    className="btn-guardar-orden"
                    disabled={
                      guardando
                    }
                  >
                    {guardando
                      ? 'Creando...'
                      : 'Crear orden'
                    }
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>

    </div>
  )
}

export default OrdenesTrabajoPage