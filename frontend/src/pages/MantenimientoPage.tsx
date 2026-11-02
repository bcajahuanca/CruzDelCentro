import {
  useEffect,
  useMemo,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import type {
  Mantenimiento
} from '../types/Mantenimiento'

import {
  listarMantenimientos,
  crearMantenimiento
} from '../services/mantemientoService'

import type {
  PlanMantenimiento
} from '../types/PlanMantenimiento'

import {
  listarPlanesMantenimiento
} from '../services/planMantenimientoService'

import {
  asignarPlanUnidad
} from '../services/planUnidadService'

import {
  crearPlanMantenimiento
} from '../services/planMantenimientoService'

import type { Unidad } from '../types/Unidad'
import { listarUnidades } from '../services/unidadService'

import CalendarioMantenimiento
  from '../components/CalendarioMantenimiento'

import '../styles/mantenimiento.css'


function MantenimientoPage() {

  const navigate = useNavigate()

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false)

  const [guardando, setGuardando] =
    useState(false)

  const [errorFormulario, setErrorFormulario] =
    useState('')

  const [unidades, setUnidades] =
    useState<Unidad[]>([])

  const [form, setForm] = useState({
    unidadId: '',
    tipo: 'CORRECTIVO',
    descripcion: '',
    fechaVencimiento: '',
    kilometrajeObjetivo: '',
    inicioProgramado: '',
    finProgramado: ''
  })

  const [
    mantenimientos,
    setMantenimientos
  ] = useState<Mantenimiento[]>([])

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
    situacionFiltro,
    setSituacionFiltro
  ] = useState('TODOS')

  const [
    mostrarPlanFormulario,
    setMostrarPlanFormulario
  ] = useState(false)

  const [
    guardandoPlan,
    setGuardandoPlan
  ] = useState(false)

  const [
    errorPlan,
    setErrorPlan
  ] = useState('')

  const [
    planForm,
    setPlanForm
  ] = useState({
    nombre: '',
    descripcion: '',
    criterio: 'KILOMETRAJE',
    intervaloDias: '',
    intervaloKm: '',
    anticipacionDias: '7',
    anticipacionKm: '500'
  })

  const [
    vista,
    setVista
  ] = useState<'LISTA' | 'CALENDARIO'>(
    'LISTA'
  )

  const [
    actividadesPlan,
    setActividadesPlan
  ] = useState([
    {
      descripcion: '',
      obligatoria: true
    }
  ])

  const [
    mostrarAsignarPlan,
    setMostrarAsignarPlan
  ] = useState(false)

  const [
    planes,
    setPlanes
  ] = useState<PlanMantenimiento[]>([])

  const [
    guardandoAsignacion,
    setGuardandoAsignacion
  ] = useState(false)

  const [
    errorAsignacion,
    setErrorAsignacion
  ] = useState('')

  const [
    asignacionForm,
    setAsignacionForm
  ] = useState({
    planId: '',
    unidadId: '',
    fechaBase: '',
    kilometrajeBase: ''
  })

  useEffect(() => {

    const cargar = async () => {

      try {

        setCargando(true)
        setError('')

        const data =
          await listarMantenimientos()

        setMantenimientos(data)

      } catch (error) {

        console.error(error)

        setError(
          'No se pudieron cargar los mantenimientos'
        )

      } finally {

        setCargando(false)

      }
    }

    cargar()

  }, [])

  useEffect(() => {

    const cargarUnidades = async () => {

      try {

        const data =
          await listarUnidades()

        setUnidades(data)

      } catch (error) {

        console.error(
          'Error cargando unidades:',
          error
        )

      }

    }

    cargarUnidades()

  }, [])

  useEffect(() => {

    const cargarPlanes = async () => {

      try {

        const data =
          await listarPlanesMantenimiento()

        setPlanes(data)

      } catch (error) {

        console.error(
          'Error cargando planes:',
          error
        )

      }

    }

    cargarPlanes()

  }, [])

  const mantenimientosFiltrados =
    useMemo(() => {

      return mantenimientos.filter(
        mantenimiento => {

          const texto =
            busqueda
              .trim()
              .toLowerCase()

          const coincideBusqueda =
            texto === '' ||
            mantenimiento.unidadCodigo
              .toLowerCase()
              .includes(texto) ||
            mantenimiento.placa
              ?.toLowerCase()
              .includes(texto) ||
            mantenimiento.descripcion
              .toLowerCase()
              .includes(texto)


          const coincideTipo =
            tipoFiltro === 'TODOS' ||
            mantenimiento.tipo ===
              tipoFiltro


          const coincideSituacion =
            situacionFiltro === 'TODOS' ||
            mantenimiento.situacion ===
              situacionFiltro


          return (
            coincideBusqueda &&
            coincideTipo &&
            coincideSituacion
          )
        }
      )

    }, [
      mantenimientos,
      busqueda,
      tipoFiltro,
      situacionFiltro
    ])

  const programarMantenimiento = async (
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

    if (!form.descripcion.trim()) {
      setErrorFormulario(
        'La descripción es obligatoria'
      )
      return
    }

    if (
      !form.fechaVencimiento &&
      !form.kilometrajeObjetivo
    ) {
      setErrorFormulario(
        'Debe indicar una fecha de vencimiento o kilometraje objetivo'
      )
      return
    }

    if (
      (form.inicioProgramado &&
        !form.finProgramado) ||
      (!form.inicioProgramado &&
        form.finProgramado)
    ) {
      setErrorFormulario(
        'Debe indicar inicio y fin programado'
      )
      return
    }

    try {

      setGuardando(true)

      await crearMantenimiento({

        unidadId:
          Number(form.unidadId),

        tipo:
          form.tipo as
            'PREVENTIVO' |
            'CORRECTIVO',

        descripcion:
          form.descripcion.trim(),

        fechaVencimiento:
          form.fechaVencimiento ||
          null,

        kilometrajeObjetivo:
          form.kilometrajeObjetivo
            ? Number(
                form.kilometrajeObjetivo
              )
            : null,

        inicioProgramado:
          form.inicioProgramado ||
          null,

        finProgramado:
          form.finProgramado ||
          null,

        responsableId: 3,

        planUnidadId: null,

        ciclo: null
      })


      // Recargar tabla

      const data =
        await listarMantenimientos()

      setMantenimientos(data)


      // Limpiar formulario

      setForm({
        unidadId: '',
        tipo: 'CORRECTIVO',
        descripcion: '',
        fechaVencimiento: '',
        kilometrajeObjetivo: '',
        inicioProgramado: '',
        finProgramado: ''
      })

      setMostrarFormulario(false)

    } catch (error) {

      console.error(error)

      setErrorFormulario(
        error instanceof Error
          ? error.message
          : 'No se pudo programar el mantenimiento'
      )

    } finally {

      setGuardando(false)

    }

  }

  const totalProgramados =
    mantenimientos.filter(
      m =>
        m.situacion === 'PROGRAMADO'
    ).length


  const totalProximos =
    mantenimientos.filter(
      m =>
        m.situacion === 'PROXIMO'
    ).length


  const totalVencidos =
    mantenimientos.filter(
      m =>
        m.situacion === 'VENCIDO'
    ).length


  const totalEjecucion =
    mantenimientos.filter(
      m =>
        m.situacion === 'EN_EJECUCION'
    ).length


  const mostrarTipo = (
    tipo: string
  ) => {

    switch (tipo) {

      case 'PREVENTIVO':
        return 'Preventivo'

      case 'CORRECTIVO':
        return 'Correctivo'

      default:
        return tipo
    }
  }


  const mostrarSituacion = (
    situacion: string
  ) => {

    switch (situacion) {

      case 'PROGRAMADO':
        return 'Programado'

      case 'PROXIMO':
        return 'Próximo'

      case 'VENCIDO':
        return 'Vencido'

      case 'EN_EJECUCION':
        return 'En ejecución'

      case 'COMPLETADO':
        return 'Completado'

      case 'CANCELADO':
        return 'Cancelado'

      case 'SIN_LECTURA':
        return 'Sin lectura'

      default:
        return situacion
    }
  }


  const mostrarFecha = (
    fecha: string | null
  ) => {

    if (!fecha) {
      return 'Sin fecha'
    }

    const partes =
      fecha.split('-')

    if (partes.length !== 3) {
      return fecha
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }


  const mostrarKilometraje = (
    kilometraje: number | null
  ) => {

    if (kilometraje === null) {
      return 'Sin lectura'
    }

    return `${kilometraje.toLocaleString(
      'es-PE'
    )} km`
  }

  const agregarActividad = () => {

    setActividadesPlan([
      ...actividadesPlan,
      {
        descripcion: '',
        obligatoria: true
      }
    ])
  }

  const eliminarActividad = (
    index: number
  ) => {

    if (actividadesPlan.length === 1) {
      return
    }

    setActividadesPlan(
      actividadesPlan.filter(
        (_, i) => i !== index
      )
    )
  }

  const cambiarActividad = (
    index: number,
    campo: 'descripcion' | 'obligatoria',
    valor: string | boolean
  ) => {

    const nuevas =
      [...actividadesPlan]

    nuevas[index] = {
      ...nuevas[index],
      [campo]: valor
    }

    setActividadesPlan(nuevas)
  }

  const guardarPlanPreventivo = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    setErrorPlan('')

    if (!planForm.nombre.trim()) {
      setErrorPlan(
        'El nombre del plan es obligatorio'
      )
      return
    }

    if (
      planForm.criterio === 'FECHA' &&
      !planForm.intervaloDias
    ) {
      setErrorPlan(
        'Debe indicar el intervalo en días'
      )
      return
    }

    if (
      planForm.criterio ===
        'KILOMETRAJE' &&
      !planForm.intervaloKm
    ) {
      setErrorPlan(
        'Debe indicar el intervalo en kilómetros'
      )
      return
    }

    if (
      planForm.criterio === 'MIXTO' &&
      (
        !planForm.intervaloDias ||
        !planForm.intervaloKm
      )
    ) {
      setErrorPlan(
        'Debe indicar intervalo en días y kilómetros'
      )
      return
    }

    const actividadesValidas =
      actividadesPlan.filter(
        actividad =>
          actividad.descripcion.trim() !== ''
      )

    if (actividadesValidas.length === 0) {
      setErrorPlan(
        'Debe agregar al menos una actividad'
      )
      return
    }

    try {

      setGuardandoPlan(true)

      await crearPlanMantenimiento({

        nombre:
          planForm.nombre.trim(),

        descripcion:
          planForm.descripcion.trim(),

        criterio:
          planForm.criterio as
            'FECHA' |
            'KILOMETRAJE' |
            'MIXTO',

        intervaloDias:
          planForm.criterio ===
            'KILOMETRAJE'
            ? null
            : Number(
                planForm.intervaloDias
              ),

        intervaloKm:
          planForm.criterio ===
            'FECHA'
            ? null
            : Number(
                planForm.intervaloKm
              ),

        anticipacionDias:
          Number(
            planForm.anticipacionDias
          ),

        anticipacionKm:
          Number(
            planForm.anticipacionKm
          ),

        actividades:
          actividadesValidas.map(
            actividad => ({
              descripcion:
                actividad.descripcion.trim(),

              obligatoria:
                actividad.obligatoria
            })
          )
      })


      setPlanForm({
        nombre: '',
        descripcion: '',
        criterio: 'KILOMETRAJE',
        intervaloDias: '',
        intervaloKm: '',
        anticipacionDias: '7',
        anticipacionKm: '500'
      })

      setActividadesPlan([
        {
          descripcion: '',
          obligatoria: true
        }
      ])

      setMostrarPlanFormulario(false)

    } catch (error) {

      console.error(error)

      setErrorPlan(
        error instanceof Error
          ? error.message
          : 'No se pudo crear el plan'
      )

    } finally {

      setGuardandoPlan(false)

    }
  }

  const guardarAsignacionPlan = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    setErrorAsignacion('')

    if (!asignacionForm.planId) {
      setErrorAsignacion(
        'Debe seleccionar un plan'
      )
      return
    }

    if (!asignacionForm.unidadId) {
      setErrorAsignacion(
        'Debe seleccionar una unidad'
      )
      return
    }

    if (!asignacionForm.fechaBase) {
      setErrorAsignacion(
        'Debe indicar la fecha base'
      )
      return
    }

    if (!asignacionForm.kilometrajeBase) {
      setErrorAsignacion(
        'Debe indicar el kilometraje base'
      )
      return
    }

    try {

      setGuardandoAsignacion(true)

      await asignarPlanUnidad({

        planId:
          Number(
            asignacionForm.planId
          ),

        unidadId:
          Number(
            asignacionForm.unidadId
          ),

        fechaBase:
          asignacionForm.fechaBase,

        kilometrajeBase:
          Number(
            asignacionForm.kilometrajeBase
          ),
        
          responsableId: 3
      })

      setAsignacionForm({
        planId: '',
        unidadId: '',
        fechaBase: '',
        kilometrajeBase: ''
      })

      setMostrarAsignarPlan(false)

    } catch (error) {

      console.error(error)

      setErrorAsignacion(
        error instanceof Error
          ? error.message
          : 'No se pudo asignar el plan'
      )

    } finally {

      setGuardandoAsignacion(false)

    }
  }

  return (

    <div className="page-container">

      <div className="mantenimiento-page">


        {/* HEADER */}

        <div className="mantenimiento-header">

          <div>

            <h1>
              Mantenimiento
            </h1>

            <p>
              Programación y seguimiento
              de mantenimientos de la flota.
            </p>

          </div>


          <div className="mantenimiento-header-acciones">

            <button
              type="button"
              className="btn-plan-mantenimiento"
              onClick={() => {

                setErrorPlan('')
                setMostrarPlanFormulario(true)

              }}
            >
              + Crear plan preventivo
            </button>

            <div className="mantenimiento-selector-vista">

              <button
                type="button"
                className={
                  vista === 'LISTA'
                    ? 'activo'
                    : ''
                }
                onClick={() =>
                  setVista('LISTA')
                }
              >
                Lista
              </button>

              <button
                type="button"
                className={
                  vista === 'CALENDARIO'
                    ? 'activo'
                    : ''
                }
                onClick={() =>
                  setVista('CALENDARIO')
                }
              >
                Calendario
              </button>

            </div>

            <button
              type="button"
              className="btn-asignar-plan"
              onClick={() => {

                setErrorAsignacion('')

                setMostrarAsignarPlan(true)

              }}
            >
              Asignar plan a unidad
            </button>

            <button
              type="button"
              className="btn-programar-mantenimiento"
              onClick={() => {
                setErrorFormulario('')
                setMostrarFormulario(true)
              }}
            >
              + Programar mantenimiento
            </button>
          </div>

        </div>


        {/* RESUMEN */}

        <div className="mantenimiento-resumen">


          <div className="mantenimiento-card">

            <span>
              Programados
            </span>

            <strong>
              {totalProgramados}
            </strong>

          </div>


          <div className="mantenimiento-card">

            <span>
              Próximos
            </span>

            <strong>
              {totalProximos}
            </strong>

          </div>


          <div className="mantenimiento-card">

            <span>
              Vencidos
            </span>

            <strong>
              {totalVencidos}
            </strong>

          </div>


          <div className="mantenimiento-card">

            <span>
              En ejecución
            </span>

            <strong>
              {totalEjecucion}
            </strong>

          </div>

        </div>


        {/* FILTROS */}

        <div className="mantenimiento-filtros">

          <input
            type="text"
            placeholder="Buscar por PAD, placa o descripción..."
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
            value={situacionFiltro}
            onChange={(e) =>
              setSituacionFiltro(
                e.target.value
              )
            }
          >

            <option value="TODOS">
              Todas las situaciones
            </option>

            <option value="PROGRAMADO">
              Programado
            </option>

            <option value="PROXIMO">
              Próximo
            </option>

            <option value="VENCIDO">
              Vencido
            </option>

            <option value="EN_EJECUCION">
              En ejecución
            </option>

            <option value="SIN_LECTURA">
              Sin lectura
            </option>

            <option value="COMPLETADO">
              Completado
            </option>

            <option value="CANCELADO">
              Cancelado
            </option>

          </select>

        </div>


        <p className="mantenimiento-resultados">

          Mostrando{' '}
          {mantenimientosFiltrados.length}{' '}
          de {mantenimientos.length}{' '}
          mantenimientos

        </p>


        {/* CARGANDO */}

        {cargando && (

          <p>
            Cargando mantenimientos...
          </p>

        )}


        {/* ERROR */}

        {error && (

          <p className="mantenimiento-error">

            {error}

          </p>

        )}


        {/* TABLA */}

        {!cargando && 
          !error && 
          vista === 'LISTA' && (

          <div className="mantenimiento-tabla-wrapper">

            <table className="mantenimiento-tabla">

              <thead>

                <tr>

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
                    Fecha vencimiento
                  </th>

                  <th>
                    Km objetivo
                  </th>

                  <th>
                    Km actual
                  </th>

                  <th>
                    Responsable
                  </th>

                  <th>
                    Situación
                  </th>

                  <th>
                    Acciones
                  </th>

                </tr>

              </thead>


              <tbody>

                {mantenimientosFiltrados.map(
                  mantenimiento => (

                    <tr
                      key={mantenimiento.id}
                    >

                      <td>

                        <strong>
                          PAD{' '}
                          {
                            mantenimiento.unidadCodigo
                          }
                        </strong>

                        {mantenimiento.placa && (

                          <span className="mantenimiento-placa">

                            {
                              mantenimiento.placa
                            }

                          </span>

                        )}

                      </td>


                      <td>

                        <span
                          className={
                            `mantenimiento-tipo ${
                              mantenimiento.tipo
                                .toLowerCase()
                            }`
                          }
                        >
                          {mostrarTipo(
                            mantenimiento.tipo
                          )}
                        </span>

                      </td>


                      <td>

                        {
                          mantenimiento.descripcion
                        }

                      </td>


                      <td>

                        {mostrarFecha(
                          mantenimiento
                            .fechaVencimiento
                        )}

                      </td>


                      <td>

                        {mantenimiento
                          .kilometrajeObjetivo !==
                        null
                          ? mostrarKilometraje(
                              mantenimiento
                                .kilometrajeObjetivo
                            )
                          : '—'
                        }

                      </td>


                      <td>

                        {mostrarKilometraje(
                          mantenimiento
                            .kilometrajeActual
                        )}

                      </td>


                      <td>

                        {
                          mantenimiento.responsable
                        }

                      </td>


                      <td>

                        <span
                          className={
                            `mantenimiento-situacion ${
                              mantenimiento.situacion
                                .toLowerCase()
                            }`
                          }
                        >

                          {mostrarSituacion(
                            mantenimiento.situacion
                          )}

                        </span>

                      </td>


                      <td>
                        <button
                          type="button"
                          className="btn-ver-mantenimiento"
                          onClick={() =>
                            navigate(
                              `/mantenimiento/${mantenimiento.id}`
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


            {mantenimientosFiltrados.length === 0 && (

              <p className="mantenimiento-vacio">

                No se encontraron mantenimientos.

              </p>

            )}

          </div>

        )}

        {!cargando &&
          !error &&
          vista === 'CALENDARIO' && (

          <CalendarioMantenimiento
            mantenimientos={
              mantenimientosFiltrados
            }
          />

        )}

        {mostrarFormulario && (

          <div className="mantenimiento-modal-fondo">

            <div className="mantenimiento-modal">

              <div className="mantenimiento-modal-header">

                <div>

                  <h2>
                    Programar mantenimiento
                  </h2>

                  <p>
                    Registra una nueva intervención
                    para una unidad.
                  </p>

                </div>


                <button
                  type="button"
                  className="mantenimiento-modal-cerrar"
                  onClick={() =>
                    setMostrarFormulario(false)
                  }
                >
                  ×
                </button>

              </div>


              <form
                className="mantenimiento-form"
                onSubmit={programarMantenimiento}
              >

                <div className="mantenimiento-form-grid">


                  {/* UNIDAD */}

                  <div className="mantenimiento-campo">

                    <label>
                      Unidad *
                    </label>

                    <select
                      value={form.unidadId}
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

                  <div className="mantenimiento-campo">

                    <label>
                      Tipo *
                    </label>

                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          tipo: e.target.value
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


                  {/* FECHA VENCIMIENTO */}

                  <div className="mantenimiento-campo">

                    <label>
                      Fecha de vencimiento
                    </label>

                    <input
                      type="date"
                      value={
                        form.fechaVencimiento
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          fechaVencimiento:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* KM OBJETIVO */}

                  <div className="mantenimiento-campo">

                    <label>
                      Kilometraje objetivo
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Ej. 360000"
                      value={
                        form.kilometrajeObjetivo
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          kilometrajeObjetivo:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* INICIO */}

                  <div className="mantenimiento-campo">

                    <label>
                      Inicio programado
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.inicioProgramado
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          inicioProgramado:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* FIN */}

                  <div className="mantenimiento-campo">

                    <label>
                      Fin programado
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.finProgramado
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          finProgramado:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* DESCRIPCIÓN */}

                  <div
                    className="
                      mantenimiento-campo
                      mantenimiento-campo-completo
                    "
                  >

                    <label>
                      Descripción *
                    </label>

                    <textarea
                      rows={4}
                      placeholder="Describe el mantenimiento a realizar..."
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


                <p className="mantenimiento-form-ayuda">
                  Debe indicar al menos una fecha de
                  vencimiento o un kilometraje objetivo.
                </p>


                {errorFormulario && (

                  <p className="mantenimiento-form-error">
                    {errorFormulario}
                  </p>

                )}


                <div className="mantenimiento-form-acciones">

                  <button
                    type="button"
                    className="btn-cancelar-mantenimiento"
                    disabled={guardando}
                    onClick={() =>
                      setMostrarFormulario(false)
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    className="btn-guardar-mantenimiento"
                    disabled={guardando}
                  >

                    {guardando
                      ? 'Programando...'
                      : 'Programar mantenimiento'
                    }

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {mostrarPlanFormulario && (

          <div className="mantenimiento-modal-fondo">

            <div className="mantenimiento-modal">

              <div className="mantenimiento-modal-header">

                <div>

                  <h2>
                    Crear plan preventivo
                  </h2>

                  <p>
                    Define la frecuencia y las
                    actividades del mantenimiento.
                  </p>

                </div>

                <button
                  type="button"
                  className="mantenimiento-modal-cerrar"
                  onClick={() =>
                    setMostrarPlanFormulario(false)
                  }
                >
                  ×
                </button>

              </div>


              <form
                className="mantenimiento-form"
                onSubmit={guardarPlanPreventivo}
              >

                <div className="mantenimiento-form-grid">


                  {/* NOMBRE */}

                  <div
                    className="
                      mantenimiento-campo
                      mantenimiento-campo-completo
                    "
                  >

                    <label>
                      Nombre del plan *
                    </label>

                    <input
                      type="text"
                      placeholder="Ej. Cambio de aceite cada 10,000 km"
                      value={planForm.nombre}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          nombre: e.target.value
                        })
                      }
                      required
                    />

                  </div>


                  {/* CRITERIO */}

                  <div className="mantenimiento-campo">

                    <label>
                      Criterio *
                    </label>

                    <select
                      value={planForm.criterio}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          criterio:
                            e.target.value
                        })
                      }
                    >

                      <option value="KILOMETRAJE">
                        Kilometraje
                      </option>

                      <option value="FECHA">
                        Fecha
                      </option>

                      <option value="MIXTO">
                        Mixto
                      </option>

                    </select>

                  </div>


                  {/* ANTICIPACIÓN DÍAS */}

                  <div className="mantenimiento-campo">

                    <label>
                      Anticipación en días
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        planForm.anticipacionDias
                      }
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          anticipacionDias:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* INTERVALO DÍAS */}

                  {(
                    planForm.criterio ===
                      'FECHA' ||
                    planForm.criterio ===
                      'MIXTO'
                  ) && (

                    <div className="mantenimiento-campo">

                      <label>
                        Intervalo en días *
                      </label>

                      <input
                        type="number"
                        min="1"
                        placeholder="Ej. 180"
                        value={
                          planForm.intervaloDias
                        }
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            intervaloDias:
                              e.target.value
                          })
                        }
                      />

                    </div>

                  )}


                  {/* INTERVALO KM */}

                  {(
                    planForm.criterio ===
                      'KILOMETRAJE' ||
                    planForm.criterio ===
                      'MIXTO'
                  ) && (

                    <div className="mantenimiento-campo">

                      <label>
                        Intervalo en kilómetros *
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        placeholder="Ej. 10000"
                        value={
                          planForm.intervaloKm
                        }
                        onChange={(e) =>
                          setPlanForm({
                            ...planForm,
                            intervaloKm:
                              e.target.value
                          })
                        }
                      />

                    </div>

                  )}


                  {/* ANTICIPACIÓN KM */}

                  <div className="mantenimiento-campo">

                    <label>
                      Anticipación en kilómetros
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={
                        planForm.anticipacionKm
                      }
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          anticipacionKm:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  {/* DESCRIPCIÓN */}

                  <div
                    className="
                      mantenimiento-campo
                      mantenimiento-campo-completo
                    "
                  >

                    <label>
                      Descripción
                    </label>

                    <textarea
                      rows={3}
                      placeholder="Descripción general del plan..."
                      value={
                        planForm.descripcion
                      }
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          descripcion:
                            e.target.value
                        })
                      }
                    />

                  </div>

                </div>


                {/* ACTIVIDADES */}

                <div className="plan-actividades">

                  <div className="plan-actividades-header">

                    <div>

                      <h3>
                        Actividades
                      </h3>

                      <p>
                        Define las tareas que se
                        realizarán durante el mantenimiento.
                      </p>

                    </div>

                    <button
                      type="button"
                      className="btn-agregar-actividad"
                      onClick={agregarActividad}
                    >
                      + Agregar actividad
                    </button>

                  </div>


                  {actividadesPlan.map(
                    (actividad, index) => (

                      <div
                        key={index}
                        className="plan-actividad-fila"
                      >

                        <div className="plan-actividad-numero">
                          {index + 1}
                        </div>


                        <input
                          type="text"
                          placeholder="Ej. Cambio de filtro de aceite"
                          value={
                            actividad.descripcion
                          }
                          onChange={(e) =>
                            cambiarActividad(
                              index,
                              'descripcion',
                              e.target.value
                            )
                          }
                        />


                        <label className="plan-actividad-check">

                          <input
                            type="checkbox"
                            checked={
                              actividad.obligatoria
                            }
                            onChange={(e) =>
                              cambiarActividad(
                                index,
                                'obligatoria',
                                e.target.checked
                              )
                            }
                          />

                          Obligatoria

                        </label>


                        <button
                          type="button"
                          className="btn-eliminar-actividad"
                          onClick={() =>
                            eliminarActividad(index)
                          }
                          disabled={
                            actividadesPlan.length === 1
                          }
                        >
                          ×
                        </button>

                      </div>

                    )
                  )}

                </div>


                {errorPlan && (

                  <p className="mantenimiento-form-error">
                    {errorPlan}
                  </p>

                )}


                <div className="mantenimiento-form-acciones">

                  <button
                    type="button"
                    className="btn-cancelar-mantenimiento"
                    disabled={guardandoPlan}
                    onClick={() =>
                      setMostrarPlanFormulario(false)
                    }
                  >
                    Cancelar
                  </button>


                  <button
                    type="submit"
                    className="btn-guardar-mantenimiento"
                    disabled={guardandoPlan}
                  >

                    {guardandoPlan
                      ? 'Creando...'
                      : 'Crear plan preventivo'
                    }

                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {mostrarAsignarPlan && (

          <div className="mantenimiento-modal-fondo">

            <div className="mantenimiento-modal">

              <div className="mantenimiento-modal-header">

                <div>

                  <h2>
                    Asignar plan preventivo
                  </h2>

                  <p>
                    Asigna un plan de mantenimiento
                    a una unidad de la flota.
                  </p>

                </div>

                <button
                  type="button"
                  className="mantenimiento-modal-cerrar"
                  onClick={() =>
                    setMostrarAsignarPlan(false)
                  }
                >
                  ×
                </button>

              </div>


              <form
                className="mantenimiento-form"
                onSubmit={guardarAsignacionPlan}
              >

                <div className="mantenimiento-form-grid">


                  {/* PLAN */}

                  <div className="mantenimiento-campo">

                    <label>
                      Plan preventivo *
                    </label>

                    <select
                      value={asignacionForm.planId}
                      onChange={(e) =>
                        setAsignacionForm({
                          ...asignacionForm,
                          planId:
                            e.target.value
                        })
                      }
                      required
                    >

                      <option value="">
                        Seleccionar plan
                      </option>

                      {planes.map(
                        plan => (

                          <option
                            key={plan.id}
                            value={plan.id}
                          >
                            {plan.nombre}
                          </option>

                        )
                      )}

                    </select>

                  </div>


                  {/* UNIDAD */}

                  <div className="mantenimiento-campo">

                    <label>
                      Unidad *
                    </label>

                    <select
                      value={
                        asignacionForm.unidadId
                      }
                      onChange={(e) => {

                        const unidadId =
                          e.target.value

                        const unidad =
                          unidades.find(
                            u =>
                              u.id ===
                              Number(unidadId)
                          )

                        setAsignacionForm({
                          ...asignacionForm,

                          unidadId,

                          kilometrajeBase:
                            unidad
                              ?.kilometrajeActual
                              ?.toString() || ''
                        })

                      }}
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
                        .map(
                          unidad => (

                            <option
                              key={unidad.id}
                              value={unidad.id}
                            >
                              PAD {unidad.codigo}
                              {' - '}
                              {unidad.placa}
                            </option>

                          )
                        )}

                    </select>

                  </div>


                  {/* FECHA BASE */}

                  <div className="mantenimiento-campo">

                    <label>
                      Fecha base *
                    </label>

                    <input
                      type="date"
                      value={
                        asignacionForm.fechaBase
                      }
                      onChange={(e) =>
                        setAsignacionForm({
                          ...asignacionForm,
                          fechaBase:
                            e.target.value
                        })
                      }
                      required
                    />

                  </div>


                  {/* KM BASE */}

                  <div className="mantenimiento-campo">

                    <label>
                      Kilometraje base *
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Kilometraje actual"
                      value={
                        asignacionForm
                          .kilometrajeBase
                      }
                      onChange={(e) =>
                        setAsignacionForm({
                          ...asignacionForm,
                          kilometrajeBase:
                            e.target.value
                        })
                      }
                      required
                    />

                  </div>

                </div>


                <p className="mantenimiento-form-ayuda">
                  El kilometraje base se completa
                  automáticamente con la última lectura
                  disponible de la unidad.
                </p>


                {errorAsignacion && (

                  <p className="mantenimiento-form-error">

                    {errorAsignacion}

                  </p>

                )}


                <div className="mantenimiento-form-acciones">

                  <button
                    type="button"
                    className="btn-cancelar-mantenimiento"
                    disabled={
                      guardandoAsignacion
                    }
                    onClick={() =>
                      setMostrarAsignarPlan(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-guardar-mantenimiento"
                    disabled={
                      guardandoAsignacion
                    }
                  >

                    {guardandoAsignacion
                      ? 'Asignando...'
                      : 'Asignar plan'
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

export default MantenimientoPage