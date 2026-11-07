import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { useAuth } from '../context/AuthContext'

import { useEffect, useMemo, useState } from 'react'
import type { Unidad, CrearUnidadRequest, Marca, ModeloVehiculo } from '../types/Unidad'
import type { UnidadDetalle } from '../types/UnidadDetalle'

import '../styles/unidades.css'
import {
  listarUnidades,
  obtenerUnidadPorId,
  actualizarUnidad,
  crearUnidad,
  listarMarcas,
  listarModelos,
} from '../services/unidadService'

import {
  BusFront,
  CircleCheck,
  Wrench,
  TriangleAlert,
  Search,
  Download,
  Plus,
  Eye
} from 'lucide-react'

function UnidadesPage() {

  const {
    tienePermiso
  } = useAuth()

  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modoEdicion, setModoEdicion] = useState(false)

  // const [unidadesSeleccionadas, setUnidadesSeleccionadas] = useState<Unidad | null>(null)
  const [unidadSeleccionada, setUnidadSeleccionada] =
    useState<UnidadDetalle | null>(null)

  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS')

  const [formEdicion, setFormEdicion] = useState({
    placa: '',
    tipoVehiculo: '',
    anioFabricacion: '',
    estado: 'OPERATIVA',
    activo: true,
    observaciones: '',
    motivoCambio: ''
  })

  const [modalNuevaUnidad, setModalNuevaUnidad] =
    useState(false)

  const [guardandoNuevaUnidad, setGuardandoNuevaUnidad] =
    useState(false)

  const [errorNuevaUnidad, setErrorNuevaUnidad] =
    useState('')

  const [formNuevaUnidad, setFormNuevaUnidad] =
    useState({
      codigo: '',
      placa: '',
      marcaId: '',
      modeloId: '',
      tipoVehiculo: 'BUS',
      anioFabricacion: '',
      estado: 'OPERATIVA',
      activo: true,
      observaciones: ''
    })

  const [marcas, setMarcas] =
    useState<Marca[]>([])

  const [modelos, setModelos] =
    useState<ModeloVehiculo[]>([])

  useEffect(() => {
    const cargarUnidades = async () => {
      try {
        const data = await listarUnidades()
        setUnidades(data)
      } catch (err) {
        setError('Error al cargar las unidades')
      } finally {
        setCargando(false)
      }
    }

    cargarUnidades()
  }, [])

  const unidadesFiltradas = useMemo(() => {
    return unidades.filter((unidad) => {
      const textoBusqueda = busqueda.toLowerCase()

      const coincideBusqueda =
        unidad.codigo.toLowerCase().includes(textoBusqueda) ||
        unidad.placa.toLowerCase().includes(textoBusqueda) ||
        unidad.marca.toLowerCase().includes(textoBusqueda) ||
        unidad.modelo.toLowerCase().includes(textoBusqueda)

      const coincideEstado =
        estadoFiltro === 'TODOS' ||
        unidad.estado === estadoFiltro

      return coincideBusqueda && coincideEstado
    })
  }, [unidades, busqueda, estadoFiltro])

  const descargarUnidadesPDF = () => {
    const unidadesFiltradas =
      estadoFiltro === "TODOS"
        ? unidades
        : unidades.filter(
          (unidad) => unidad.estado === estadoFiltro
        )

    if (unidadesFiltradas.length === 0) {
      alert("No hay unidades para descargar")
      return
    }

    const doc = new jsPDF({
      orientation: "landscape"
    })

    doc.setFontSize(16)
    doc.text("Reporte de Unidades - Cruz del Centro", 14, 15)

    doc.setFontSize(10)
    doc.text(
      `Estado: ${estadoFiltro === "TODOS"
        ? "Todos los estados"
        : estadoFiltro.replaceAll("_", " ")
      }`,
      14,
      22
    )

    const filas = unidadesFiltradas.map((unidad) => [
      unidad.codigo,
      unidad.placa,
      unidad.marca,
      unidad.modelo,
      unidad.tipoVehiculo,
      unidad.anioFabricacion ?? "",
      unidad.estado.replaceAll("_", " "),
    ])

    autoTable(doc, {
      startY: 28,
      head: [[
        "Código",
        "Placa",
        "Marca",
        "Modelo",
        "Tipo",
        "Año",
        "Estado",
      ]],
      body: filas,
      styles: {
        fontSize: 8
      },
      headStyles: {
        fontStyle: "bold"
      },
      columnStyles: {
        7: {
          cellWidth: 55
        }
      }
    })

    const nombreArchivo =
      estadoFiltro === "TODOS"
        ? "unidades_todas.pdf"
        : `unidades_${estadoFiltro.toLowerCase()}.pdf`

    doc.save(nombreArchivo)
  }

  const verDetalle = async (id: number) => {
    try {
      setCargandoDetalle(true)

      const data = await obtenerUnidadPorId(id)
      setUnidadSeleccionada(data)

      setFormEdicion({
        placa: data.placa,
        tipoVehiculo: data.tipoVehiculo,
        anioFabricacion: data.anioFabricacion?.toString() ?? '',
        estado: data.estado,
        activo: data.activo,
        observaciones: data.observaciones ?? '',
        motivoCambio: ''
      })

      setModoEdicion(false)
    } catch (err) {
      setError('Error al cargar el detalle de la unidad')
    } finally {
      setCargandoDetalle(false)
    }
  }

  const guardarCambios = async () => {
    if (!unidadSeleccionada) return

    if (
      formEdicion.estado !== unidadSeleccionada.estado &&
      !formEdicion.motivoCambio.trim()
    ) {
      alert('Debes ingresar el motivo del cambio de estado')
      return
    }

    try {

      const data = await actualizarUnidad(unidadSeleccionada.id, {
        placa: formEdicion.placa,
        tipoVehiculo: formEdicion.tipoVehiculo,
        anioFabricacion: formEdicion.anioFabricacion
          ? parseInt(formEdicion.anioFabricacion)
          : null,
        estado: formEdicion.estado,
        activo: formEdicion.activo,
        observaciones: formEdicion.observaciones,
        motivoCambio: formEdicion.motivoCambio
      })

      setUnidadSeleccionada(data)
      setModoEdicion(false)

      setUnidades((anteriores) =>
        anteriores.map((u) =>
          u.id === data.id
            ? {
              ...u,
              placa: data.placa,
              tipoVehiculo: data.tipoVehiculo,
              anioFabricacion: data.anioFabricacion,
              estado: data.estado
            }
            : u
        )
      )
    } catch (err) {
      setError('Error al guardar los cambios')
    }
  }

  const guardarNuevaUnidad = async () => {

    if (!formNuevaUnidad.codigo.trim()) {
      setErrorNuevaUnidad(
        'El código PAD es obligatorio'
      )
      return
    }

    if (!formNuevaUnidad.placa.trim()) {
      setErrorNuevaUnidad(
        'La placa es obligatoria'
      )
      return
    }

    if (!formNuevaUnidad.tipoVehiculo.trim()) {
      setErrorNuevaUnidad(
        'El tipo de vehículo es obligatorio'
      )
      return
    }

    if (!formNuevaUnidad.modeloId) {
      setErrorNuevaUnidad(
        'Debes seleccionar un modelo'
      )
      return
    }

    try {

      setGuardandoNuevaUnidad(true)
      setErrorNuevaUnidad('')

      const request: CrearUnidadRequest = {

        codigo:
          formNuevaUnidad.codigo.trim().toUpperCase(),

        placa:
          formNuevaUnidad.placa
            .trim()
            .toUpperCase(),

        modeloId:
          Number(
            formNuevaUnidad.modeloId
          ),

        tipoVehiculo:
          formNuevaUnidad.tipoVehiculo,

        anioFabricacion:
          formNuevaUnidad.anioFabricacion
            ? Number(
              formNuevaUnidad
                .anioFabricacion
            )
            : null,

        estado:
          formNuevaUnidad.estado,

        activo:
          formNuevaUnidad.activo,

        observaciones:
          formNuevaUnidad.observaciones
            .trim()
      }


      await crearUnidad(request)

      const actualizados = await listarUnidades()

      setUnidades(actualizados)

      setModalNuevaUnidad(false)

    } catch (error) {

      console.error(error)

      setErrorNuevaUnidad(
        'No se pudo registrar la unidad'
      )

    } finally {

      setGuardandoNuevaUnidad(false)

    }
  }

  const abrirNuevaUnidad = async () => {

    setFormNuevaUnidad({
      codigo: '',
      placa: '',
      marcaId: '',
      modeloId: '',
      tipoVehiculo: 'BUS',
      anioFabricacion: '',
      estado: 'OPERATIVA',
      activo: true,
      observaciones: ''
    })

    setModalNuevaUnidad(true)
    setModelos([])
    setErrorNuevaUnidad('')

    try {
      const data =
        await listarMarcas()

      setMarcas(data)
      setModalNuevaUnidad(true)

    } catch (error) {
      console.error(error)
    }
  }

  if (cargando) {
    return <p>Cargando unidades...</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  return (
    <div className="page-container">

      <div className="unidades-header">

        <div>
          <h1>Unidades</h1>
          <p>
            Consulta el estado, kilometraje y datos
            principales de la flota.
          </p>
        </div>

        <div className="unidades-header-acciones">

          <button
            type="button"
            className="btn-descargar"
            onClick={descargarUnidadesPDF}
          >
            <Download size={17} />
            Exportar PDF
          </button>

          {tienePermiso('unidad.editar') && (
            <button
              type="button"
              className="btn-nueva-unidad"
              onClick={() => abrirNuevaUnidad()}
            >
              <Plus size={17} />
              Nueva unidad
            </button>
          )}

        </div>

      </div>

      <div className="unidades-resumen">

        <div className="unidad-kpi">

          <div className="unidad-kpi-icon">
            <BusFront size={21} />
          </div>

          <div>
            <span>Total de unidades</span>
            <strong>{unidades.length}</strong>
          </div>

        </div>


        <div className="unidad-kpi">

          <div className="unidad-kpi-icon operativa">
            <CircleCheck size={21} />
          </div>

          <div>
            <span>Operativas</span>

            <strong>
              {
                unidades.filter(
                  u => u.estado === 'OPERATIVA'
                ).length
              }
            </strong>
          </div>

        </div>


        <div className="unidad-kpi">

          <div className="unidad-kpi-icon mantenimiento">
            <Wrench size={21} />
          </div>

          <div>
            <span>En mantenimiento</span>

            <strong>
              {
                unidades.filter(
                  u =>
                    u.estado ===
                    'EN_MANTENIMIENTO'
                ).length
              }
            </strong>
          </div>

        </div>


        <div className="unidad-kpi">

          <div className="unidad-kpi-icon fuera-servicio">
            <TriangleAlert size={21} />
          </div>

          <div>
            <span>Fuera de servicio</span>

            <strong>
              {
                unidades.filter(
                  u =>
                    u.estado ===
                    'FUERA_DE_SERVICIO'
                ).length
              }
            </strong>
          </div>

        </div>

      </div>

      <div className="unidades-panel">

        <div className="unidades-filtros">

          <div className="unidades-buscador">

            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar por PAD, placa, marca o modelo..."
              value={busqueda}
              onChange={
                e =>
                  setBusqueda(e.target.value)
              }
            />

          </div>


          <select
            value={estadoFiltro}
            onChange={
              e =>
                setEstadoFiltro(
                  e.target.value
                )
            }
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

        </div>


        <div className="unidades-resultados">
          Mostrando{' '}
          <strong>
            {unidadesFiltradas.length}
          </strong>{' '}
          de {unidades.length} unidades
        </div>


        <div className="tabla-wrapper">

          {/* tu tabla actual */}

        </div>

      </div>

      <div className="unidades-resultados">
        Mostrando {unidadesFiltradas.length} de {unidades.length} unidades
      </div>

      <div className="tabla-wrapper">

        <table className="unidades-table">

          <thead>
            <tr>
              <th>Unidad</th>
              <th>Placa</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Tipo</th>
              <th>Año</th>
              <th>Estado</th>
              <th>Kilometraje</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {unidadesFiltradas.map((unidad) => (

              <tr key={unidad.id}>

                <td>
                  <div className="unidad-identificador">
                    <span className="unidad-pad">
                      PAD {unidad.codigo}
                    </span>
                  </div>
                </td>

                <td>
                  {unidad.placa}
                </td>

                <td>
                  {unidad.marca}
                </td>

                <td>
                  {unidad.modelo}
                </td>

                <td>
                  {unidad.tipoVehiculo}
                </td>

                <td>
                  {unidad.anioFabricacion ?? '-'}
                </td>

                <td>
                  <span
                    className={`estado-badge ${unidad.estado.toLowerCase()}`}
                  >
                    {unidad.estado.replaceAll('_', ' ')}
                  </span>
                </td>

                <td className="unidad-kilometraje">
                  {unidad.kilometrajeActual !== null
                    ? `${unidad.kilometrajeActual.toLocaleString('es-PE')} km`
                    : 'Sin lectura'}
                </td>

                <td>
                  <button
                    className="btn-ver"
                    onClick={() =>
                      verDetalle(unidad.id)
                    }
                  >
                    <Eye size={16} />
                    Ver detalle
                  </button>
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {cargandoDetalle && (
        <div className="modal-overlay">
          <div className="modal-unidad">
            <p>Cargando información...</p>
          </div>
        </div>
      )}

      {unidadSeleccionada && !cargandoDetalle && (
        <div
          className="modal-overlay"
          onClick={() => setUnidadSeleccionada(null)}
        >
          <div
            className="modal-unidad modal-unidad-detalle"
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER */}
            <div className="modal-header modal-header-detalle">

              <div className="modal-header-info">

                <h2>
                  Unidad {unidadSeleccionada.codigo}
                </h2>

                <p>
                  {unidadSeleccionada.placa}
                </p>

                <span
                  className={`estado-badge ${unidadSeleccionada.estado.toLowerCase()}`}
                >
                  {unidadSeleccionada.estado === 'OPERATIVA' &&
                    'Operativa'}

                  {unidadSeleccionada.estado === 'EN_MANTENIMIENTO' &&
                    'En mantenimiento'}

                  {unidadSeleccionada.estado === 'FUERA_DE_SERVICIO' &&
                    'Fuera de servicio'}
                </span>

              </div>


              <div className="modal-acciones">

                {tienePermiso('unidad.editar') && (
                  <button
                    type="button"
                    className="btn-editar"
                    onClick={() =>
                      setModoEdicion(true)
                    }
                  >
                    Editar
                  </button>
                )}


                <button
                  type="button"
                  className="modal-cerrar"
                  onClick={() =>
                    setUnidadSeleccionada(null)
                  }
                >
                  ×
                </button>

              </div>

            </div>


            {/* SI ESTÁ EDITANDO */}

            {modoEdicion &&
              tienePermiso('unidad.editar') ? (

              <div className="form-edicion">

                <div className="form-edicion-header">
                  <h3>Editar unidad</h3>

                  <p>
                    Actualiza la información
                    principal de la unidad.
                  </p>
                </div>


                <div className="form-grid">

                  <label className="campo-formulario">
                    <span>Placa</span>

                    <input
                      type="text"
                      value={formEdicion.placa}
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          placa: e.target.value
                        })
                      }
                    />
                  </label>

                  <label className="campo-formulario">
                    <span>
                      Tipo de vehículo
                    </span>

                    <input
                      type="text"
                      value={
                        formEdicion.tipoVehiculo
                      }
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          tipoVehiculo:
                            e.target.value
                        })
                      }
                    />
                  </label>


                  <label className="campo-formulario">
                    <span>
                      Año de fabricación
                    </span>

                    <input
                      type="number"
                      value={
                        formEdicion.anioFabricacion
                      }
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          anioFabricacion:
                            e.target.value
                        })
                      }
                    />
                  </label>


                  <label className="campo-formulario">
                    <span>
                      Estado operativo
                    </span>

                    <select
                      value={formEdicion.estado}
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          estado:
                            e.target.value
                        })
                      }
                    >

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
                  </label>

                </div>


                {formEdicion.estado !==
                  unidadSeleccionada.estado && (

                    <label className="campo-formulario campo-observaciones">

                      <span>
                        Motivo del cambio de estado *
                      </span>

                      <textarea
                        placeholder="Ejemplo: El bus presenta fallas en el sistema de frenos..."
                        value={
                          formEdicion.motivoCambio
                        }
                        onChange={(e) =>
                          setFormEdicion({
                            ...formEdicion,
                            motivoCambio:
                              e.target.value
                          })
                        }
                        rows={3}
                        required
                      />

                    </label>

                  )}


                <label className="campo-formulario campo-observaciones">

                  <span>
                    Observaciones
                  </span>

                  <textarea
                    placeholder="Agrega una observación sobre la unidad..."
                    value={
                      formEdicion.observaciones
                    }
                    onChange={(e) =>
                      setFormEdicion({
                        ...formEdicion,
                        observaciones:
                          e.target.value
                      })
                    }
                  />

                </label>


                <div className="estado-activo">

                  <div>
                    <strong>
                      Unidad activa
                    </strong>

                    <p>
                      Indica si la unidad debe
                      aparecer disponible dentro
                      del sistema.
                    </p>
                  </div>


                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={
                        formEdicion.activo
                      }
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          activo:
                            e.target.checked
                        })
                      }
                    />

                    <span className="slider" />

                  </label>

                </div>


                <div className="acciones-edicion">

                  <button
                    type="button"
                    className="btn-cancelar"
                    onClick={() =>
                      setModoEdicion(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn-guardar"
                    onClick={guardarCambios}
                  >
                    Guardar cambios
                  </button>

                </div>

              </div>

            ) : (

              <>
                {/* RESUMEN */}

                <div className="detalle-resumen">

                  <div className="detalle-resumen-card">
                    <span>PAD</span>

                    <strong>
                      {unidadSeleccionada.codigo}
                    </strong>
                  </div>


                  <div className="detalle-resumen-card">
                    <span>Estado</span>

                    <strong>
                      {unidadSeleccionada.estado ===
                        'OPERATIVA' &&
                        'Operativa'}

                      {unidadSeleccionada.estado ===
                        'EN_MANTENIMIENTO' &&
                        'En mantenimiento'}

                      {unidadSeleccionada.estado ===
                        'FUERA_DE_SERVICIO' &&
                        'Fuera de servicio'}
                    </strong>
                  </div>


                  <div className="detalle-resumen-card">
                    <span>Activo</span>

                    <strong>
                      {unidadSeleccionada.activo
                        ? 'Sí'
                        : 'No'}
                    </strong>
                  </div>


                  <div className="detalle-resumen-card">
                    <span>Año</span>

                    <strong>
                      {
                        unidadSeleccionada
                          .anioFabricacion ??
                        '-'
                      }
                    </strong>
                  </div>

                </div>


                {/* SECCIONES */}

                <div className="detalle-secciones">

                  {/* INFORMACIÓN GENERAL */}

                  <div className="detalle-card">

                    <div className="detalle-card-header">
                      <h3>
                        Información general
                      </h3>

                      <p>
                        Datos principales de la
                        unidad.
                      </p>
                    </div>


                    <div className="detalle-grid">

                      <div>
                        <span>Placa</span>

                        <strong>
                          {unidadSeleccionada.placa ||
                            '-'}
                        </strong>
                      </div>


                      <div>
                        <span>Marca</span>

                        <strong>
                          {unidadSeleccionada.marca ||
                            '-'}
                        </strong>
                      </div>


                      <div>
                        <span>Modelo</span>

                        <strong>
                          {unidadSeleccionada.modelo ||
                            '-'}
                        </strong>
                      </div>


                      <div>
                        <span>
                          Tipo de vehículo
                        </span>

                        <strong>
                          {
                            unidadSeleccionada
                              .tipoVehiculo ||
                            '-'
                          }
                        </strong>
                      </div>

                    </div>

                  </div>


                  {/* ESTADO */}

                  <div className="detalle-card">

                    <div className="detalle-card-header">

                      <h3>
                        Estado de la unidad
                      </h3>

                      <p>
                        Condición actual de
                        operación.
                      </p>

                    </div>


                    <div className="detalle-grid">

                      <div>
                        <span>
                          Estado operativo
                        </span>

                        <strong>
                          {unidadSeleccionada.estado ===
                            'OPERATIVA' &&
                            'Operativa'}

                          {unidadSeleccionada.estado ===
                            'EN_MANTENIMIENTO' &&
                            'En mantenimiento'}

                          {unidadSeleccionada.estado ===
                            'FUERA_DE_SERVICIO' &&
                            'Fuera de servicio'}
                        </strong>
                      </div>


                      <div>
                        <span>Activo</span>

                        <strong>
                          {unidadSeleccionada.activo
                            ? 'Sí'
                            : 'No'}
                        </strong>
                      </div>

                    </div>

                  </div>


                  {/* OBSERVACIONES */}

                  <div className="detalle-card detalle-card-full">

                    <div className="detalle-card-header">

                      <h3>
                        Observaciones
                      </h3>

                      <p>
                        Notas adicionales
                        registradas para la unidad.
                      </p>

                    </div>


                    <div className="detalle-observaciones-box">

                      {unidadSeleccionada
                        .observaciones
                        ?.trim()
                        ? unidadSeleccionada
                          .observaciones
                        : 'No se registraron observaciones.'}

                    </div>

                  </div>

                </div>

              </>

            )}

          </div>
        </div>
      )}

      {modalNuevaUnidad && (

        <div
          className="modal-overlay"
          onClick={() =>
            setModalNuevaUnidad(false)
          }
        >

          <div
            className="modal-unidad modal-nueva-unidad"
            onClick={
              e => e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>Nueva unidad</h2>

                <p>
                  Registra una nueva unidad
                  en la flota.
                </p>
              </div>

              <button
                type="button"
                className="modal-cerrar"
                onClick={() =>
                  setModalNuevaUnidad(false)
                }
              >
                ×
              </button>

            </div>


            <div className="form-edicion">

              <div className="form-grid">

                <label className="campo-formulario">
                <span>Código PAD *</span>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej. 280"
                  value={formNuevaUnidad.codigo}
                  onChange={e => {
                    const valor =
                      e.target.value.replace(/\D/g, '')

                    setFormNuevaUnidad({
                      ...formNuevaUnidad,
                      codigo: valor
                    })
                  }}
                />
              </label>

                <label className="campo-formulario">
                  <span>Placa *</span>

                  <input
                    type="text"
                    placeholder="Ej. CSM-124"
                    value={
                      formNuevaUnidad.placa
                    }
                    onChange={e =>
                      setFormNuevaUnidad({
                        ...formNuevaUnidad,
                        placa: e.target.value
                      })
                    }
                  />
                </label>


                <label className="campo-formulario">
                  <span>
                    Tipo de vehículo *
                  </span>

                  <select
                    value={
                      formNuevaUnidad.tipoVehiculo
                    }
                    onChange={e =>
                      setFormNuevaUnidad({
                        ...formNuevaUnidad,
                        tipoVehiculo:
                          e.target.value
                      })
                    }
                  >
                    <option value="BUS">
                      Bus
                    </option>

                    <option value="MINIBUS">
                      Minibus
                    </option>

                    <option value="OTRO">
                      Otro
                    </option>
                  </select>
                </label>

                <label className="campo-formulario">
                  <span>Marca *</span>

                  <select
                    value={formNuevaUnidad.marcaId}
                    onChange={async (e) => {

                      const marcaId =
                        e.target.value

                      setFormNuevaUnidad({
                        ...formNuevaUnidad,
                        marcaId,
                        modeloId: ''
                      })

                      if (!marcaId) {
                        setModelos([])
                        return
                      }

                      try {

                        const data =
                          await listarModelos(
                            Number(marcaId)
                          )

                        setModelos(data)

                      } catch (error) {

                        console.error(error)

                        setModelos([])

                        setErrorNuevaUnidad(
                          'No se pudieron cargar los modelos'
                        )
                      }
                    }}
                  >
                    <option value="">
                      Seleccionar marca
                    </option>

                    {marcas.map(
                      marca => (
                        <option
                          key={marca.id}
                          value={marca.id}
                        >
                          {marca.nombre}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="campo-formulario">
                  <span>Modelo *</span>

                  <select
                    value={formNuevaUnidad.modeloId}
                    disabled={
                      !formNuevaUnidad.marcaId
                    }
                    onChange={e =>
                      setFormNuevaUnidad({
                        ...formNuevaUnidad,
                        modeloId:
                          e.target.value
                      })
                    }
                  >
                    <option value="">
                      Seleccionar modelo
                    </option>

                    {modelos.map(
                      modelo => (
                        <option
                          key={modelo.id}
                          value={modelo.id}
                        >
                          {modelo.nombre}
                        </option>
                      )
                    )}
                  </select>
                </label>


                <label className="campo-formulario">
                  <span>
                    Año de fabricación
                  </span>

                  <input
                    type="number"
                    min="1990"
                    max={
                      new Date().getFullYear() + 1
                    }
                    placeholder="2026"
                    value={
                      formNuevaUnidad
                        .anioFabricacion
                    }
                    onChange={e =>
                      setFormNuevaUnidad({
                        ...formNuevaUnidad,
                        anioFabricacion:
                          e.target.value
                      })
                    }
                  />
                </label>


                <label className="campo-formulario">
                  <span>
                    Estado inicial
                  </span>

                  <select
                    value={
                      formNuevaUnidad.estado
                    }
                    onChange={e =>
                      setFormNuevaUnidad({
                        ...formNuevaUnidad,
                        estado:
                          e.target.value
                      })
                    }
                  >
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
                </label>

              </div>


              <label className="campo-formulario campo-observaciones">

                <span>Observaciones</span>

                <textarea
                  rows={4}
                  placeholder="Observaciones adicionales..."
                  value={
                    formNuevaUnidad.observaciones
                  }
                  onChange={e =>
                    setFormNuevaUnidad({
                      ...formNuevaUnidad,
                      observaciones:
                        e.target.value
                    })
                  }
                />

              </label>


              <div className="estado-activo">

                <div>
                  <strong>
                    Unidad activa
                  </strong>

                  <p>
                    Permite que la unidad aparezca
                    disponible dentro del sistema.
                  </p>
                </div>

                <label className="switch">

                  <input
                    type="checkbox"
                    checked={
                      formNuevaUnidad.activo
                    }
                    onChange={e =>
                      setFormNuevaUnidad({
                        ...formNuevaUnidad,
                        activo:
                          e.target.checked
                      })
                    }
                  />

                  <span className="slider" />

                </label>

              </div>


              {errorNuevaUnidad && (
                <div className="unidad-form-error">
                  {errorNuevaUnidad}
                </div>
              )}


              <div className="acciones-edicion">

                <button
                  type="button"
                  className="btn-cancelar"
                  disabled={
                    guardandoNuevaUnidad
                  }
                  onClick={() =>
                    setModalNuevaUnidad(false)
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn-guardar"
                  disabled={
                    guardandoNuevaUnidad
                  }
                  onClick={
                    guardarNuevaUnidad
                  }
                >
                  {guardandoNuevaUnidad
                    ? 'Registrando...'
                    : 'Registrar unidad'}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

export default UnidadesPage