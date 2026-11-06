import {
    useEffect,
    useState,
    type FormEvent
} from 'react'

import {
    useNavigate,
    useParams
} from 'react-router-dom'

import type {
    OrdenTrabajo,
    OrdenIncidencia,
    OrdenActividad,
    OrdenSeguimiento,
    RepuestoDisponible,
    OrdenCosto,
    OrdenEvidencia,
} from '../types/OrdenTrabajo'

import {
    obtenerOrdenTrabajo,
    listarIncidenciasOrden,
    listarActividadesOrden,
    actualizarDiagnosticoOrden,
    completarActividadOrden,
    crearActividadOrden,
    iniciarOrdenTrabajo,
    listarSeguimientoOrden,
    registrarAvanceOrden,
    finalizarOrdenTrabajo,
    listarRepuestosDisponibles,
    registrarSalidaRepuesto,
    listarCostosOrden,
    crearCostoOrden,
    listarEvidenciasOrden,
    subirEvidenciaOrden,
    abrirEvidenciaOrden,
    actualizarResultadoPruebasOrden,
    actualizarKilometrajeOrden,
    cerrarOrdenTrabajo,
    cancelarOrdenTrabajo,
} from '../services/ordenTrabajoService'

import { useAuth } from '../context/AuthContext'

import '../styles/ordenTrabajoDetalle.css'

type TabOrden = 'trabajo' | 'recursos' | 'seguimiento'

function OrdenTrabajoDetallePage() {

    const { id } = useParams()
    const navigate = useNavigate()
    const { tienePermiso } = useAuth()

    const [orden, setOrden] = useState<OrdenTrabajo | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState('')

    const [tabActiva, setTabActiva] = useState<TabOrden>('trabajo')

    const [incidencias, setIncidencias] = useState<OrdenIncidencia[]>([])
    const [actividades, setActividades] = useState<OrdenActividad[]>([])
    const [seguimiento, setSeguimiento] = useState<OrdenSeguimiento[]>([])
    const [costos, setCostos] = useState<OrdenCosto[]>([])
    const [repuestosDisponibles, setRepuestosDisponibles] = useState<RepuestoDisponible[]>([])

    const [diagnostico, setDiagnostico] = useState('')
    const [guardandoDiagnostico, setGuardandoDiagnostico] = useState(false)
    const [errorDiagnostico, setErrorDiagnostico] = useState('')

    const [actividadEnProceso, setActividadEnProceso] = useState<number | null>(null)
    const [mostrarNuevaActividad, setMostrarNuevaActividad] = useState(false)
    const [nuevaActividad, setNuevaActividad] = useState({
        descripcion: '',
        obligatoria: true
    })
    const [guardandoActividad, setGuardandoActividad] = useState(false)
    const [errorActividad, setErrorActividad] = useState('')

    const [iniciandoTrabajo, setIniciandoTrabajo] = useState(false)
    const [finalizandoTrabajo, setFinalizandoTrabajo] = useState(false)

    const [nuevoAvance, setNuevoAvance] = useState('')
    const [guardandoAvance, setGuardandoAvance] = useState(false)
    const [errorAvance, setErrorAvance] = useState('')

    const [
        mostrarNuevoCosto,
        setMostrarNuevoCosto
    ] = useState(false)

    const [
        resultadoPruebas,
        setResultadoPruebas
    ] = useState('')

    const [
        guardandoResultado,
        setGuardandoResultado
    ] = useState(false)

    const [
        errorResultado,
        setErrorResultado
    ] = useState('')

    const [
        evidencias,
        setEvidencias
    ] = useState<OrdenEvidencia[]>([])

    const [
        archivoEvidencia,
        setArchivoEvidencia
    ] = useState<File | null>(null)

    const [
        descripcionEvidencia,
        setDescripcionEvidencia
    ] = useState('')

    const [
        subiendoEvidencia,
        setSubiendoEvidencia
    ] = useState(false)

    const [
        errorEvidencia,
        setErrorEvidencia
    ] = useState('')

    const [
        kilometrajeIntervencion,
        setKilometrajeIntervencion
    ] = useState('')

    const [
        guardandoKilometraje,
        setGuardandoKilometraje
    ] = useState(false)

    const [
        errorKilometraje,
        setErrorKilometraje
    ] = useState('')

    const [
        mostrarCerrarOrden,
        setMostrarCerrarOrden
    ] = useState(false)

    const [
        observacionesCierre,
        setObservacionesCierre
    ] = useState('')

    const [
        cerrandoOrden,
        setCerrandoOrden
    ] = useState(false)

    const [
        errorCierre,
        setErrorCierre
    ] = useState('')

    const [
        mostrarCancelarOrden,
        setMostrarCancelarOrden
    ] = useState(false)

    const [
        motivoCancelacion,
        setMotivoCancelacion
    ] = useState('')

    const [
        cancelandoOrden,
        setCancelandoOrden
    ] = useState(false)

    const [
        errorCancelacion,
        setErrorCancelacion
    ] = useState('')

    const [
        nuevoCosto,
        setNuevoCosto
    ] = useState({
        categoria: 'MANO_OBRA' as
            'MANO_OBRA' |
            'SERVICIO' |
            'OTRO',

        naturaleza: 'REAL' as
            'ESTIMADO' |
            'REAL',

        descripcion: '',
        cantidad: '1',
        precioUnitario: ''
    })

    const [
        guardandoCosto,
        setGuardandoCosto
    ] = useState(false)

    const [
        errorCosto,
        setErrorCosto
    ] = useState('')

    const [salidaRepuesto, setSalidaRepuesto] = useState({
        repuestoId: '',
        cantidad: '',
        precioUnitario: '',
        motivo: ''
    })
    const [guardandoSalida, setGuardandoSalida] = useState(false)
    const [errorSalida, setErrorSalida] = useState('')

    const repuestoSeleccionado = repuestosDisponibles.find(
        repuesto => repuesto.repuestoId === Number(salidaRepuesto.repuestoId)
    )

    const costosEstimados = costos
        .filter(costo => costo.naturaleza === 'ESTIMADO')
        .reduce((total, costo) => total + Number(costo.subtotal), 0)

    const costosReales = costos
        .filter(costo => costo.naturaleza === 'REAL')
        .reduce((total, costo) => total + Number(costo.subtotal), 0)

    const desviacionCostos = costosReales - costosEstimados

    const repuestosConsumidos = costos.filter(
        costo => costo.categoria === 'REPUESTO' && costo.origenInventario
    )

    useEffect(() => {

        const cargarOrden = async () => {

            if (!id) {
                setError('Orden de trabajo no válida')
                setCargando(false)
                return
            }

            try {
                setCargando(true)
                setError('')

                const [
                    ordenData,
                    incidenciasData,
                    actividadesData,
                    seguimientoData,
                    costosData,
                    repuestosData,
                    evidenciasData,
                ] = await Promise.all([
                    obtenerOrdenTrabajo(Number(id)),
                    listarIncidenciasOrden(Number(id)),
                    listarActividadesOrden(Number(id)),
                    listarSeguimientoOrden(Number(id)),
                    listarCostosOrden(Number(id)),
                    listarRepuestosDisponibles(),
                    listarEvidenciasOrden(Number(id))
                ])

                setOrden(ordenData)
                setIncidencias(incidenciasData)
                setActividades(actividadesData)
                setSeguimiento(seguimientoData)
                setCostos(costosData)
                setRepuestosDisponibles(repuestosData)
                setDiagnostico(ordenData.diagnostico || '')
                setEvidencias(evidenciasData)

                setResultadoPruebas(ordenData.resultadoPruebas || '')

                setKilometrajeIntervencion(
                    ordenData.kilometrajeIntervencion !== null
                        ? String(ordenData.kilometrajeIntervencion)
                        : ''
                )

            } catch (error) {
                console.error(error)
                setError('No se pudo cargar la orden de trabajo')
            } finally {
                setCargando(false)
            }
        }

        cargarOrden()

    }, [id])

    const mostrarTipo = (tipo: string) => {
        return tipo === 'PREVENTIVO'
            ? 'Preventivo'
            : 'Correctivo'
    }

    const mostrarEstado = (estado: string) => {
        switch (estado) {
            case 'ABIERTA':
                return 'Abierta'
            case 'ASIGNADA':
                return 'Asignada'
            case 'EN_EJECUCION':
                return 'En ejecución'
            case 'PENDIENTE_VALIDACION':
                return 'Pendiente de validación'
            case 'CERRADA':
                return 'Cerrada'
            case 'CANCELADA':
                return 'Cancelada'
            default:
                return estado
        }
    }

    const mostrarFecha = (fecha: string | null) => {
        if (!fecha) return 'No registrada'

        return new Date(fecha).toLocaleString(
            'es-PE',
            {
                timeZone: 'America/Lima',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        )
    }

    const mostrarFechaSeguimiento = (fecha: string) => {
        return new Date(fecha).toLocaleString(
            'es-PE',
            {
                timeZone: 'America/Lima',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }
        )
    }

    const formatearMoneda = (valor: number) => {
        return new Intl.NumberFormat(
            'es-PE',
            {
                style: 'currency',
                currency: 'PEN'
            }
        ).format(valor)
    }

    const mostrarCategoriaCosto = (categoria: string) => {
        switch (categoria) {
            case 'REPUESTO':
                return 'Repuesto'
            case 'MANO_OBRA':
                return 'Mano de obra'
            case 'SERVICIO':
                return 'Servicio'
            case 'OTRO':
                return 'Otro'
            default:
                return categoria
        }
    }

    const guardarDiagnostico = async () => {
        if (!orden) return

        if (!diagnostico.trim()) {
            setErrorDiagnostico('Debe ingresar un diagnóstico')
            return
        }

        try {
            setGuardandoDiagnostico(true)
            setErrorDiagnostico('')

            const actualizado = await actualizarDiagnosticoOrden(
                orden.id,
                diagnostico
            )

            setOrden(actualizado)
            setDiagnostico(actualizado.diagnostico || '')

        } catch (error) {
            setErrorDiagnostico(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar el diagnóstico'
            )
        } finally {
            setGuardandoDiagnostico(false)
        }
    }

    const completarActividad = async (actividadId: number) => {
        if (!orden) return

        try {
            setActividadEnProceso(actividadId)

            await completarActividadOrden(
                orden.id,
                actividadId
            )

            const actualizadas = await listarActividadesOrden(orden.id)
            setActividades(actualizadas)

        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : 'No se pudo completar la actividad'
            )
        } finally {
            setActividadEnProceso(null)
        }
    }

    const guardarNuevaActividad = async (e: FormEvent) => {
        e.preventDefault()

        if (!orden) return

        if (!nuevaActividad.descripcion.trim()) {
            setErrorActividad('Debe ingresar una descripción')
            return
        }

        try {
            setGuardandoActividad(true)
            setErrorActividad('')

            await crearActividadOrden(
                orden.id,
                {
                    descripcion: nuevaActividad.descripcion.trim(),
                    obligatoria: nuevaActividad.obligatoria
                }
            )

            const actualizadas = await listarActividadesOrden(orden.id)
            setActividades(actualizadas)

            setNuevaActividad({
                descripcion: '',
                obligatoria: true
            })

            setMostrarNuevaActividad(false)

        } catch (error) {
            setErrorActividad(
                error instanceof Error
                    ? error.message
                    : 'No se pudo agregar la actividad'
            )
        } finally {
            setGuardandoActividad(false)
        }
    }

    const iniciarTrabajo = async () => {
        if (!orden) return

        try {
            setIniciandoTrabajo(true)

            const actualizada = await iniciarOrdenTrabajo(orden.id)
            setOrden(actualizada)

            const seguimientoActualizado = await listarSeguimientoOrden(orden.id)
            setSeguimiento(seguimientoActualizado)

        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : 'No se pudo iniciar el trabajo'
            )
        } finally {
            setIniciandoTrabajo(false)
        }
    }

    const guardarAvance = async (e: FormEvent) => {
        e.preventDefault()

        if (!orden) return

        if (!nuevoAvance.trim()) {
            setErrorAvance('Debe ingresar un comentario')
            return
        }

        try {
            setGuardandoAvance(true)
            setErrorAvance('')

            await registrarAvanceOrden(
                orden.id,
                nuevoAvance.trim()
            )

            const actualizado = await listarSeguimientoOrden(orden.id)
            setSeguimiento(actualizado)
            setNuevoAvance('')

        } catch (error) {
            setErrorAvance(
                error instanceof Error
                    ? error.message
                    : 'No se pudo registrar el avance'
            )
        } finally {
            setGuardandoAvance(false)
        }
    }

    const finalizarTrabajo = async () => {
        if (!orden) return

        try {
            setFinalizandoTrabajo(true)

            const actualizada = await finalizarOrdenTrabajo(orden.id)
            setOrden(actualizada)

            const seguimientoActualizado = await listarSeguimientoOrden(orden.id)
            setSeguimiento(seguimientoActualizado)

        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : 'No se pudo finalizar el trabajo'
            )
        } finally {
            setFinalizandoTrabajo(false)
        }
    }

    const guardarSalidaRepuesto = async (e: FormEvent) => {
        e.preventDefault()

        if (!orden) return

        if (!repuestoSeleccionado) {
            setErrorSalida('Seleccione un repuesto')
            return
        }

        if (
            !salidaRepuesto.cantidad ||
            Number(salidaRepuesto.cantidad) <= 0
        ) {
            setErrorSalida('Ingrese una cantidad válida')
            return
        }

        if (
            salidaRepuesto.precioUnitario === '' ||
            Number(salidaRepuesto.precioUnitario) < 0
        ) {
            setErrorSalida('Ingrese un precio válido')
            return
        }

        if (!salidaRepuesto.motivo.trim()) {
            setErrorSalida('Ingrese el motivo')
            return
        }

        try {
            setGuardandoSalida(true)
            setErrorSalida('')

            await registrarSalidaRepuesto(
                orden.id,
                {
                    repuestoId: repuestoSeleccionado.repuestoId,
                    almacenId: repuestoSeleccionado.almacenId,
                    cantidad: Number(salidaRepuesto.cantidad),
                    precioUnitario: Number(salidaRepuesto.precioUnitario),
                    motivo: salidaRepuesto.motivo.trim()
                }
            )

            const [
                repuestosActualizados,
                costosActualizados
            ] = await Promise.all([
                listarRepuestosDisponibles(),
                listarCostosOrden(orden.id)
            ])

            setRepuestosDisponibles(repuestosActualizados)
            setCostos(costosActualizados)

            setSalidaRepuesto({
                repuestoId: '',
                cantidad: '',
                precioUnitario: '',
                motivo: ''
            })

        } catch (error) {
            setErrorSalida(
                error instanceof Error
                    ? error.message
                    : 'No se pudo registrar la salida'
            )
        } finally {
            setGuardandoSalida(false)
        }
    }

    const totalEstimado = costos
        .filter(
            costo =>
                costo.naturaleza === 'ESTIMADO'
        )
        .reduce(
            (total, costo) =>
                total + Number(costo.subtotal),
            0
        )

    const totalReal = costos
        .filter(
            costo =>
                costo.naturaleza === 'REAL'
        )
        .reduce(
            (total, costo) =>
                total + Number(costo.subtotal),
            0
        )

    const diferenciaCosto =
        totalReal - totalEstimado

    const guardarCosto = async (
        e: React.FormEvent
    ) => {

        e.preventDefault()

        if (!orden) return

        if (!nuevoCosto.descripcion.trim()) {
            setErrorCosto(
                'Ingrese una descripción'
            )
            return
        }

        if (
            !nuevoCosto.cantidad ||
            Number(nuevoCosto.cantidad) <= 0
        ) {
            setErrorCosto(
                'Ingrese una cantidad válida'
            )
            return
        }

        if (
            nuevoCosto.precioUnitario === '' ||
            Number(
                nuevoCosto.precioUnitario
            ) < 0
        ) {
            setErrorCosto(
                'Ingrese un precio válido'
            )
            return
        }

        try {

            setGuardandoCosto(true)
            setErrorCosto('')

            await crearCostoOrden(
                orden.id,
                {
                    categoria:
                        nuevoCosto.categoria,

                    naturaleza:
                        nuevoCosto.naturaleza,

                    descripcion:
                        nuevoCosto.descripcion.trim(),

                    cantidad:
                        Number(
                            nuevoCosto.cantidad
                        ),

                    precioUnitario:
                        Number(
                            nuevoCosto.precioUnitario
                        )
                }
            )

            const costosActualizados =
                await listarCostosOrden(
                    orden.id
                )

            setCostos(
                costosActualizados
            )

            setNuevoCosto({
                categoria: 'MANO_OBRA',
                naturaleza: 'REAL',
                descripcion: '',
                cantidad: '1',
                precioUnitario: ''
            })

            setMostrarNuevoCosto(false)

        } catch (error) {

            setErrorCosto(
                error instanceof Error
                    ? error.message
                    : 'No se pudo registrar el costo'
            )

        } finally {

            setGuardandoCosto(false)
        }
    }

    const guardarResultadoPruebas = async () => {
        if (!orden) return

        if (!resultadoPruebas.trim()) {
            setErrorResultado(
                'Debe ingresar el resultado de las pruebas'
            )
            return
        }

        try {
            setGuardandoResultado(true)
            setErrorResultado('')

            await actualizarResultadoPruebasOrden(
                orden.id,
                resultadoPruebas.trim()
            )

            setOrden({
                ...orden,
                resultadoPruebas:
                    resultadoPruebas.trim()
            })

        } catch (error) {
            setErrorResultado(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar el resultado'
            )

        } finally {
            setGuardandoResultado(false)
        }
    }

    const guardarEvidencia = async (
        e: React.FormEvent
    ) => {
        e.preventDefault()

        if (!orden) return

        if (!archivoEvidencia) {
            setErrorEvidencia(
                'Seleccione un archivo'
            )
            return
        }

        try {
            setSubiendoEvidencia(true)
            setErrorEvidencia('')

            await subirEvidenciaOrden(
                orden.id,
                archivoEvidencia,
                descripcionEvidencia.trim()
            )

            const actualizadas =
                await listarEvidenciasOrden(
                    orden.id
                )

            setEvidencias(actualizadas)

            setArchivoEvidencia(null)
            setDescripcionEvidencia('')

            const input =
                document.getElementById(
                    'archivo-evidencia'
                ) as HTMLInputElement | null

            if (input) {
                input.value = ''
            }

        } catch (error) {
            setErrorEvidencia(
                error instanceof Error
                    ? error.message
                    : 'No se pudo subir la evidencia'
            )

        } finally {
            setSubiendoEvidencia(false)
        }
    }

    const guardarKilometraje = async () => {

        if (!orden) return

        if (
            kilometrajeIntervencion === '' ||
            Number(kilometrajeIntervencion) < 0
        ) {
            setErrorKilometraje(
                'Ingrese un kilometraje válido'
            )
            return
        }

        try {

            setGuardandoKilometraje(true)
            setErrorKilometraje('')

            await actualizarKilometrajeOrden(
                orden.id,
                Number(kilometrajeIntervencion)
            )

            setOrden({
                ...orden,
                kilometrajeIntervencion:
                    Number(kilometrajeIntervencion)
            })

        } catch (error) {

            setErrorKilometraje(
                error instanceof Error
                    ? error.message
                    : 'No se pudo guardar el kilometraje'
            )

        } finally {

            setGuardandoKilometraje(false)
        }
    }

    const confirmarCierreOrden = async (
        e: React.FormEvent
    ) => {

        e.preventDefault()

        if (!orden) return

        try {

            setCerrandoOrden(true)
            setErrorCierre('')

            const actualizada =
                await cerrarOrdenTrabajo(
                    orden.id,
                    observacionesCierre.trim()
                )

            setOrden(actualizada)

            setMostrarCerrarOrden(false)

        } catch (error) {

            setErrorCierre(
                error instanceof Error
                    ? error.message
                    : 'No se pudo cerrar la orden'
            )

        } finally {

            setCerrandoOrden(false)
        }
    }

    const confirmarCancelacion = async (
        e: React.FormEvent
    ) => {

        e.preventDefault()

        if (!orden) return

        if (!motivoCancelacion.trim()) {
            setErrorCancelacion(
                'Debe indicar el motivo de cancelación'
            )
            return
        }

        try {

            setCancelandoOrden(true)
            setErrorCancelacion('')

            const actualizada =
                await cancelarOrdenTrabajo(
                    orden.id,
                    motivoCancelacion.trim()
                )

            setOrden(actualizada)

            const seguimientoActualizado =
                await listarSeguimientoOrden(
                    orden.id
                )

            setSeguimiento(
                seguimientoActualizado
            )

            setMostrarCancelarOrden(false)

        } catch (error) {

            setErrorCancelacion(
                error instanceof Error
                    ? error.message
                    : 'No se pudo cancelar la orden'
            )

        } finally {

            setCancelandoOrden(false)
        }
    }

    if (cargando) {
        return (
            <div className="page-container">
                Cargando orden de trabajo...
            </div>
        )
    }

    if (error || !orden) {
        return (
            <div className="page-container">
                <p>
                    {error || 'Orden de trabajo no encontrada'}
                </p>

                <button
                    onClick={() => navigate('/ordenes-trabajo')}
                >
                    Volver
                </button>
            </div>
        )
    }

    return (
        <div className="page-container">
            <div className="orden-detalle-page">

                <button
                    type="button"
                    className="btn-volver-orden"
                    onClick={() => navigate('/ordenes-trabajo')}
                >
                    ← Volver a órdenes
                </button>

                <div className="orden-detalle-header orden-detalle-header-organizado">
                    <div>
                        <span className="orden-detalle-codigo">
                            {orden.codigo}
                        </span>

                        <h1>Orden de Trabajo</h1>

                        <p>
                            PAD {orden.unidadCodigo}
                            {orden.placa ? ` · ${orden.placa}` : ''}
                        </p>
                    </div>

                    <span
                        className={`orden-estado ${orden.estado.toLowerCase()}`}
                    >
                        {mostrarEstado(orden.estado)}
                    </span>
                </div>

                {/* ACCIÓN PRINCIPAL */}
                <div className="orden-detalle-acciones orden-acciones-superiores">
                    {tienePermiso('orden.ejecutar') &&
                        (orden.estado === 'ABIERTA' || orden.estado === 'ASIGNADA') && (
                            <button
                                type="button"
                                className="btn-iniciar-orden"
                                onClick={iniciarTrabajo}
                                disabled={iniciandoTrabajo}
                            >
                                {iniciandoTrabajo
                                    ? 'Iniciando...'
                                    : 'Iniciar trabajo'}
                            </button>
                        )}

                    {tienePermiso('orden.ejecutar') &&
                        orden.estado === 'EN_EJECUCION' && (
                            <button
                                type="button"
                                className="btn-finalizar-orden"
                                onClick={finalizarTrabajo}
                                disabled={finalizandoTrabajo}
                            >
                                {finalizandoTrabajo
                                    ? 'Finalizando...'
                                    : 'Finalizar trabajo'}
                            </button>
                        )}

                    {tienePermiso('orden.cerrar') &&
                        orden.estado === 'PENDIENTE_VALIDACION' && (

                            <button
                                type="button"
                                className="btn-cerrar-orden"
                                onClick={() => {
                                    setErrorCierre('')
                                    setMostrarCerrarOrden(true)
                                }}
                            >
                                Cerrar orden
                            </button>

                        )}

                    {tienePermiso('orden.cerrar') &&
                        orden.estado !== 'CERRADA' &&
                        orden.estado !== 'CANCELADA' && (

                            <button
                                type="button"
                                className="btn-cancelar-orden"
                                onClick={() => {
                                    setErrorCancelacion('')
                                    setMostrarCancelarOrden(true)
                                }}
                            >
                                Cancelar orden
                            </button>

                        )}
                </div>

                {/* RESUMEN */}
                <div className="orden-detalle-card orden-resumen-card">
                    <div className="orden-seccion-titulo">
                        <div>
                            <h2>Resumen de la orden</h2>
                            <p>Información principal y tiempos de ejecución.</p>
                        </div>
                    </div>

                    <div className="orden-resumen-grid">
                        <div>
                            <span>Unidad</span>
                            <strong>PAD {orden.unidadCodigo}</strong>
                        </div>

                        <div>
                            <span>Placa</span>
                            <strong>{orden.placa || 'Sin placa'}</strong>
                        </div>

                        <div>
                            <span>Tipo</span>
                            <strong>{mostrarTipo(orden.tipo)}</strong>
                        </div>

                        <div>
                            <span>Responsable</span>
                            <strong>{orden.responsable}</strong>
                        </div>

                        <div>
                            <span>Estado</span>
                            <strong>{mostrarEstado(orden.estado)}</strong>
                        </div>

                        <div>
                            <span>Programación</span>
                            <strong>
                                {orden.programacionId
                                    ? `#${orden.programacionId}`
                                    : 'Sin programación'}
                            </strong>
                        </div>

                        <div>
                            <span>Apertura</span>
                            <strong>{mostrarFecha(orden.fechaApertura)}</strong>
                        </div>

                        <div>
                            <span>Inicio real</span>
                            <strong>{mostrarFecha(orden.inicioReal)}</strong>
                        </div>

                        <div>
                            <span>Fin estimado</span>
                            <strong>{mostrarFecha(orden.fechaEstimadaFin)}</strong>
                        </div>

                        <div>
                            <span>Fin real</span>
                            <strong>{mostrarFecha(orden.finReal)}</strong>
                        </div>

                        {orden.fechaCierre && (
                            <div>
                                <span>Fecha de cierre</span>
                                <strong>{mostrarFecha(orden.fechaCierre)}</strong>
                            </div>
                        )}
                    </div>
                </div>

                {/* ALERTA CANCELACION */}
                {orden.estado === 'CANCELADA' &&
                    orden.motivoEstado && (

                        <div className="orden-alerta-cancelada">

                            <strong>
                                Orden cancelada
                            </strong>

                            <span>
                                {orden.motivoEstado}
                            </span>

                        </div>

                    )}

                {/* TABS */}
                <div className="orden-tabs" role="tablist" aria-label="Detalle de orden">
                    <button
                        type="button"
                        className={tabActiva === 'trabajo' ? 'activo' : ''}
                        onClick={() => setTabActiva('trabajo')}
                    >
                        Trabajo
                        {actividades.length > 0 && (
                            <span className="orden-tab-contador">
                                {actividades.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        className={tabActiva === 'recursos' ? 'activo' : ''}
                        onClick={() => setTabActiva('recursos')}
                    >
                        Recursos
                        {costos.length > 0 && (
                            <span className="orden-tab-contador">
                                {costos.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        className={tabActiva === 'seguimiento' ? 'activo' : ''}
                        onClick={() => setTabActiva('seguimiento')}
                    >
                        Seguimiento
                        {seguimiento.length > 0 && (
                            <span className="orden-tab-contador">
                                {seguimiento.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* TAB: TRABAJO */}
                {tabActiva === 'trabajo' && (
                    <div className="orden-tab-contenido">

                        <div className="orden-detalle-card">
                            <div className="orden-seccion-titulo">
                                <div>
                                    <h2>Diagnóstico</h2>
                                    <p>Evaluación técnica registrada para la unidad.</p>
                                </div>
                            </div>

                            {tienePermiso('orden.ejecutar') &&
                                orden.estado !== 'CERRADA' &&
                                orden.estado !== 'CANCELADA' ? (
                                <>
                                    <textarea
                                        className="orden-diagnostico-textarea"
                                        rows={5}
                                        value={diagnostico}
                                        placeholder="Registra el diagnóstico técnico de la unidad..."
                                        onChange={(e) => setDiagnostico(e.target.value)}
                                    />

                                    {errorDiagnostico && (
                                        <p className="orden-detalle-error">
                                            {errorDiagnostico}
                                        </p>
                                    )}

                                    <div className="orden-diagnostico-acciones">
                                        <button
                                            type="button"
                                            className="btn-guardar-diagnostico"
                                            disabled={guardandoDiagnostico}
                                            onClick={guardarDiagnostico}
                                        >
                                            {guardandoDiagnostico
                                                ? 'Guardando...'
                                                : 'Guardar diagnóstico'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <p>
                                    {orden.diagnostico ||
                                        'Todavía no se ha registrado un diagnóstico.'}
                                </p>
                            )}
                        </div>

                        <div className="orden-detalle-card">
                            <div className="orden-seccion-titulo">
                                <div>
                                    <h2>Kilometraje de intervención</h2>
                                    <p>Registra el kilometraje de la unidad
                                        al momento de realizar la intervención.</p>
                                </div>
                            </div>

                            {tienePermiso('orden.ejecutar') &&
                                orden.estado !== 'CERRADA' &&
                                orden.estado !== 'CANCELADA' ? (

                                <>
                                    <div className="orden-campo">

                                        <label>
                                            Kilometraje
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={kilometrajeIntervencion}
                                            placeholder="Ej. 152430.50"
                                            onChange={(e) =>
                                                setKilometrajeIntervencion(
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                    {errorKilometraje && (

                                        <p className="orden-form-error">
                                            {errorKilometraje}
                                        </p>

                                    )}

                                    <div className="orden-diagnostico-acciones">

                                        <button
                                            type="button"
                                            className="btn-guardar-diagnostico"
                                            disabled={guardandoKilometraje}
                                            onClick={guardarKilometraje}
                                        >
                                            {guardandoKilometraje
                                                ? 'Guardando...'
                                                : 'Guardar kilometraje'}
                                        </button>

                                    </div>
                                </>

                            ) : (

                                <p>
                                    {orden.kilometrajeIntervencion != null
                                        ? `${orden.kilometrajeIntervencion} km`
                                        : 'No registrado'}
                                </p>

                            )}

                        </div>

                        <div className="orden-detalle-card">
                            <div className="orden-actividades-header orden-seccion-header">
                                <div>
                                    <h2>Actividades</h2>
                                    <p className="orden-seccion-descripcion">
                                        Tareas que deben ejecutarse dentro de la orden.
                                    </p>
                                </div>

                                {tienePermiso('orden.ejecutar') &&
                                    orden.estado !== 'CERRADA' &&
                                    orden.estado !== 'CANCELADA' && (
                                        <button
                                            type="button"
                                            className="btn-agregar-actividad-orden"
                                            onClick={() => {
                                                setErrorActividad('')
                                                setMostrarNuevaActividad(true)
                                            }}
                                        >
                                            + Agregar actividad
                                        </button>
                                    )}
                            </div>

                            {actividades.length === 0 ? (
                                <div className="orden-vacio">
                                    No hay actividades registradas para esta orden.
                                </div>
                            ) : (
                                <div className="orden-actividades">
                                    {actividades.map((actividad) => (
                                        <div
                                            key={actividad.id}
                                            className={`orden-actividad-item ${actividad.completada ? 'completada' : ''}`}
                                        >
                                            <div className="orden-actividad-info">
                                                <span className="orden-actividad-numero">
                                                    {actividad.ordenVisual}
                                                </span>

                                                <div>
                                                    <strong>{actividad.descripcion}</strong>

                                                    <span>
                                                        {actividad.obligatoria
                                                            ? 'Obligatoria'
                                                            : 'Opcional'}
                                                    </span>

                                                    {actividad.observaciones && (
                                                        <p>{actividad.observaciones}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="orden-actividad-accion">
                                                {actividad.completada ? (
                                                    <span className="actividad-completada">
                                                        ✓ Completada
                                                    </span>
                                                ) : tienePermiso('orden.ejecutar') &&
                                                    orden.estado !== 'CERRADA' &&
                                                    orden.estado !== 'CANCELADA' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => completarActividad(actividad.id)}
                                                        disabled={actividadEnProceso === actividad.id}
                                                    >
                                                        {actividadEnProceso === actividad.id
                                                            ? 'Guardando...'
                                                            : 'Completar'}
                                                    </button>
                                                ) : (
                                                    <span>Pendiente</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="orden-detalle-card">

                            <h2>
                                Resultado de pruebas
                            </h2>

                            <p className="orden-seccion-descripcion">
                                Registra los resultados obtenidos
                                después de la intervención.
                            </p>

                            {tienePermiso('orden.ejecutar') &&
                                orden.estado !== 'CERRADA' &&
                                orden.estado !== 'CANCELADA' ? (

                                <>
                                    <textarea
                                        className="orden-diagnostico-textarea"
                                        rows={4}
                                        value={resultadoPruebas}
                                        placeholder="Ej. Prueba de frenado realizada correctamente..."
                                        onChange={(e) =>
                                            setResultadoPruebas(
                                                e.target.value
                                            )
                                        }
                                    />

                                    {errorResultado && (
                                        <p className="orden-form-error">
                                            {errorResultado}
                                        </p>
                                    )}

                                    <div className="orden-diagnostico-acciones">

                                        <button
                                            type="button"
                                            className="btn-guardar-diagnostico"
                                            disabled={guardandoResultado}
                                            onClick={guardarResultadoPruebas}
                                        >
                                            {guardandoResultado
                                                ? 'Guardando...'
                                                : 'Guardar resultado'}
                                        </button>

                                    </div>
                                </>

                            ) : (

                                <p>
                                    {orden.resultadoPruebas ||
                                        'No se registraron resultados.'}
                                </p>

                            )}

                        </div>

                        {/* EVIDENCIAS */}

                        <div className="orden-detalle-card">

                            <div className="orden-evidencias-header">

                                <div>
                                    <h2>
                                        Evidencias
                                    </h2>

                                    <p className="orden-seccion-descripcion">
                                        Fotografías y documentos asociados
                                        a la intervención.
                                    </p>
                                </div>

                            </div>


                            {tienePermiso('orden.ejecutar') &&
                                orden.estado !== 'CERRADA' &&
                                orden.estado !== 'CANCELADA' && (

                                    <form
                                        className="orden-evidencia-form"
                                        onSubmit={guardarEvidencia}
                                    >

                                        <div className="orden-campo">

                                            <label>
                                                Archivo
                                            </label>

                                            <div className="archivo-evidencia-control">

                                                <input
                                                    id="archivo-evidencia"
                                                    className="archivo-evidencia-input"
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    onChange={(e) =>
                                                        setArchivoEvidencia(
                                                            e.target.files?.[0] || null
                                                        )
                                                    }
                                                />

                                                <label
                                                    htmlFor="archivo-evidencia"
                                                    className="btn-seleccionar-archivo"
                                                >
                                                    Seleccionar archivo
                                                </label>

                                                <span className="archivo-evidencia-nombre">
                                                    {archivoEvidencia
                                                        ? archivoEvidencia.name
                                                        : 'Ningún archivo seleccionado'}
                                                </span>

                                            </div>

                                            <small>
                                                JPG, PNG o PDF. Máximo 5 MB.
                                            </small>

                                        </div>


                                        <div className="orden-campo">

                                            <label>
                                                Descripción
                                            </label>

                                            <input
                                                type="text"
                                                value={descripcionEvidencia}
                                                placeholder="Ej. Estado final del sistema de frenos"
                                                onChange={(e) =>
                                                    setDescripcionEvidencia(
                                                        e.target.value
                                                    )
                                                }
                                            />

                                        </div>


                                        {errorEvidencia && (

                                            <p className="orden-form-error">
                                                {errorEvidencia}
                                            </p>

                                        )}


                                        <div className="orden-evidencia-acciones">

                                            <button
                                                type="submit"
                                                disabled={subiendoEvidencia}
                                            >
                                                {subiendoEvidencia
                                                    ? 'Subiendo...'
                                                    : '+ Subir evidencia'}
                                            </button>

                                        </div>

                                    </form>

                                )}


                            {evidencias.length === 0 ? (

                                <p className="orden-vacio">
                                    No hay evidencias registradas.
                                </p>

                            ) : (

                                <div className="orden-evidencias-lista">

                                    {evidencias.map(
                                        evidencia => (

                                            <div
                                                key={evidencia.id}
                                                className="orden-evidencia-item"
                                            >

                                                <div className="orden-evidencia-icono">

                                                    {evidencia.tipoContenido ===
                                                        'application/pdf'
                                                        ? 'PDF'
                                                        : 'IMG'}

                                                </div>


                                                <div className="orden-evidencia-info">

                                                    <strong>
                                                        {evidencia.nombreArchivo}
                                                    </strong>

                                                    {evidencia.descripcion && (
                                                        <span>
                                                            {evidencia.descripcion}
                                                        </span>
                                                    )}

                                                    <small>
                                                        {evidencia.usuarioNombre}
                                                        {' · '}
                                                        {mostrarFecha(
                                                            evidencia.creadoEn
                                                        )}
                                                        {' · '}
                                                        {(
                                                            evidencia.tamanioBytes /
                                                            1024
                                                        ).toFixed(1)}
                                                        {' KB'}
                                                    </small>

                                                </div>


                                                <button
                                                    type="button"
                                                    className="btn-ver-evidencia"
                                                    onClick={async () => {
                                                        try {

                                                            await abrirEvidenciaOrden(
                                                                orden.id,
                                                                evidencia.id,
                                                                evidencia.nombreArchivo
                                                            )

                                                        } catch (error) {

                                                            alert(
                                                                error instanceof Error
                                                                    ? error.message
                                                                    : 'No se pudo abrir el archivo'
                                                            )

                                                        }
                                                    }}
                                                >
                                                    Ver
                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                        <div className="orden-detalle-card">
                            <div className="orden-seccion-titulo">
                                <div>
                                    <h2>Incidencias asociadas</h2>
                                    <p>Incidencias que dieron origen o están relacionadas con esta OT.</p>
                                </div>
                            </div>

                            {incidencias.length === 0 ? (
                                <div className="orden-vacio">
                                    Esta orden no tiene incidencias vinculadas.
                                </div>
                            ) : (
                                <div className="orden-incidencias">
                                    {incidencias.map((incidencia) => (
                                        <div
                                            key={incidencia.id}
                                            className="orden-incidencia-item"
                                        >
                                            <div className="orden-incidencia-header">
                                                <div>
                                                    <strong>{incidencia.codigo}</strong>
                                                    <span>{incidencia.tipo}</span>
                                                </div>

                                                <span
                                                    className={`incidencias-badge ${incidencia.prioridad.toLowerCase()}`}
                                                >
                                                    {incidencia.prioridad}
                                                </span>
                                            </div>

                                            <p>{incidencia.descripcion}</p>

                                            <div className="orden-incidencia-footer">
                                                <span>
                                                    Estado:{' '}
                                                    {incidencia.estado.replaceAll('_', ' ')}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/incidencias/${incidencia.id}`)}
                                                >
                                                    Ver incidencia
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB: RECURSOS */}
                {tabActiva === 'recursos' && (
                    <div className="orden-tab-contenido">

                        <div className="orden-detalle-card">
                            <div className="orden-seccion-titulo">
                                <div>
                                    <h2>Repuestos e inventario</h2>
                                    <p>Consumos realizados desde almacén para esta orden.</p>
                                </div>
                            </div>

                            {repuestosConsumidos.length === 0 ? (
                                <div className="orden-vacio">
                                    Todavía no se han registrado repuestos de almacén en esta orden.
                                </div>
                            ) : (
                                <div className="orden-recursos-lista">
                                    {repuestosConsumidos.map((costo) => (
                                        <div
                                            key={costo.id}
                                            className="orden-recurso-item"
                                        >
                                            <div>
                                                <strong>{costo.descripcion}</strong>
                                                <span>
                                                    {Number(costo.cantidad)} × {formatearMoneda(Number(costo.precioUnitario))}
                                                </span>
                                            </div>

                                            <div className="orden-recurso-total">
                                                <span>Real</span>
                                                <strong>
                                                    {formatearMoneda(Number(costo.subtotal))}
                                                </strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {tienePermiso('inventario.editar') &&
                                orden.estado !== 'CERRADA' &&
                                orden.estado !== 'CANCELADA' && (
                                    <details className="orden-acordeon">
                                        <summary>
                                            Registrar salida de repuesto
                                        </summary>

                                        <form
                                            className="orden-repuesto-form"
                                            onSubmit={guardarSalidaRepuesto}
                                        >
                                            <div className="orden-campo">
                                                <label>Repuesto</label>

                                                <select
                                                    value={salidaRepuesto.repuestoId}
                                                    onChange={(e) =>
                                                        setSalidaRepuesto({
                                                            ...salidaRepuesto,
                                                            repuestoId: e.target.value
                                                        })
                                                    }
                                                >
                                                    <option value="">
                                                        Seleccione...
                                                    </option>

                                                    {repuestosDisponibles.map((repuesto) => (
                                                        <option
                                                            key={`${repuesto.repuestoId}-${repuesto.almacenId}`}
                                                            value={repuesto.repuestoId}
                                                        >
                                                            {repuesto.codigo} - {repuesto.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {repuestoSeleccionado && (
                                                <div className="repuesto-stock-info">
                                                    <span>
                                                        Almacén:{' '}
                                                        <strong>
                                                            {repuestoSeleccionado.almacenNombre}
                                                        </strong>
                                                    </span>

                                                    <span>
                                                        Stock disponible:{' '}
                                                        <strong>
                                                            {repuestoSeleccionado.stock}{' '}
                                                            {repuestoSeleccionado.unidadMedida}
                                                        </strong>
                                                    </span>
                                                </div>
                                            )}

                                            <div className="orden-repuesto-grid">
                                                <div className="orden-campo">
                                                    <label>Cantidad</label>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        value={salidaRepuesto.cantidad}
                                                        onChange={(e) =>
                                                            setSalidaRepuesto({
                                                                ...salidaRepuesto,
                                                                cantidad: e.target.value
                                                            })
                                                        }
                                                    />
                                                </div>

                                                <div className="orden-campo">
                                                    <label>Precio unitario (S/)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={salidaRepuesto.precioUnitario}
                                                        onChange={(e) =>
                                                            setSalidaRepuesto({
                                                                ...salidaRepuesto,
                                                                precioUnitario: e.target.value
                                                            })
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            <div className="orden-campo">
                                                <label>Motivo</label>
                                                <textarea
                                                    rows={3}
                                                    value={salidaRepuesto.motivo}
                                                    placeholder="Ej. Reemplazo de pastillas delanteras"
                                                    onChange={(e) =>
                                                        setSalidaRepuesto({
                                                            ...salidaRepuesto,
                                                            motivo: e.target.value
                                                        })
                                                    }
                                                />
                                            </div>

                                            {errorSalida && (
                                                <p className="orden-form-error">
                                                    {errorSalida}
                                                </p>
                                            )}

                                            <div className="orden-repuesto-acciones">
                                                <button
                                                    type="submit"
                                                    disabled={guardandoSalida}
                                                >
                                                    {guardandoSalida
                                                        ? 'Registrando...'
                                                        : 'Registrar salida'}
                                                </button>
                                            </div>
                                        </form>
                                    </details>
                                )}
                        </div>

                        <div className="orden-detalle-card">
                            <div className="orden-seccion-titulo">
                                <div>
                                    <h2>Costos de la orden</h2>
                                    <p>Resumen de costos estimados y reales en PEN.</p>
                                </div>
                            </div>

                            <div className="orden-costos-resumen">
                                <div>
                                    <span>Estimado</span>
                                    <strong>{formatearMoneda(costosEstimados)}</strong>
                                </div>

                                <div>
                                    <span>Real</span>
                                    <strong>{formatearMoneda(costosReales)}</strong>
                                </div>

                                <div>
                                    <span>Desviación</span>
                                    <strong className={desviacionCostos > 0 ? 'costo-superado' : ''}>
                                        {formatearMoneda(desviacionCostos)}
                                    </strong>
                                </div>
                            </div>

                            {costos.length === 0 ? (
                                <div className="orden-vacio">
                                    No hay costos registrados en esta orden.
                                </div>
                            ) : (
                                <div className="orden-costos-lista">
                                    {costos.map((costo) => (
                                        <div
                                            key={costo.id}
                                            className="orden-costo-item"
                                        >
                                            <div>
                                                <strong>{costo.descripcion}</strong>
                                                <span>
                                                    {mostrarCategoriaCosto(costo.categoria)} · {costo.naturaleza === 'REAL' ? 'Real' : 'Estimado'}
                                                    {costo.origenInventario ? ' · Almacén' : ''}
                                                </span>
                                            </div>

                                            <div className="orden-costo-valores">
                                                <span>
                                                    {Number(costo.cantidad)} × {formatearMoneda(Number(costo.precioUnitario))}
                                                </span>
                                                <strong>
                                                    {formatearMoneda(Number(costo.subtotal))}
                                                </strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="orden-detalle-card">

                                <div className="orden-costos-header">

                                    <div>
                                        <h2>
                                            Costos de la orden
                                        </h2>

                                        <p>
                                            Costos estimados y reales
                                            asociados al mantenimiento.
                                        </p>
                                    </div>

                                    {tienePermiso('orden.ejecutar') &&
                                        orden.estado !== 'CERRADA' &&
                                        orden.estado !== 'CANCELADA' && (

                                            <button
                                                type="button"
                                                className="btn-agregar-costo"
                                                onClick={() => {
                                                    setErrorCosto('')
                                                    setMostrarNuevoCosto(true)
                                                }}
                                            >
                                                + Agregar costo
                                            </button>

                                        )}

                                </div>


                                <div className="orden-costos-resumen">

                                    <div>
                                        <span>
                                            Estimado
                                        </span>

                                        <strong>
                                            S/ {totalEstimado.toFixed(2)}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Real
                                        </span>

                                        <strong>
                                            S/ {totalReal.toFixed(2)}
                                        </strong>
                                    </div>


                                    <div>
                                        <span>
                                            Diferencia
                                        </span>

                                        <strong
                                            className={
                                                diferenciaCosto > 0
                                                    ? 'costo-superado'
                                                    : 'costo-normal'
                                            }
                                        >
                                            {diferenciaCosto > 0
                                                ? '+ '
                                                : ''}

                                            S/ {
                                                diferenciaCosto.toFixed(2)
                                            }
                                        </strong>
                                    </div>

                                </div>


                                {costos.length === 0 ? (

                                    <p className="orden-vacio">
                                        Todavía no hay costos registrados.
                                    </p>

                                ) : (

                                    <div className="orden-costos-tabla">

                                        <div className="orden-costos-fila encabezado">

                                            <span>
                                                Tipo
                                            </span>

                                            <span>
                                                Descripción
                                            </span>

                                            <span>
                                                Naturaleza
                                            </span>

                                            <span>
                                                Cant.
                                            </span>

                                            <span>
                                                P. Unit.
                                            </span>

                                            <span>
                                                Subtotal
                                            </span>

                                        </div>


                                        {costos.map(
                                            costo => (

                                                <div
                                                    key={costo.id}
                                                    className="orden-costos-fila"
                                                >

                                                    <span>

                                                        {costo.categoria
                                                            .replaceAll(
                                                                '_',
                                                                ' '
                                                            )}

                                                        {costo.origenInventario && (

                                                            <small className="costo-almacen">
                                                                Almacén
                                                            </small>

                                                        )}

                                                    </span>


                                                    <strong>
                                                        {costo.descripcion}
                                                    </strong>


                                                    <span
                                                        className={
                                                            `costo-naturaleza ${costo.naturaleza.toLowerCase()}`
                                                        }
                                                    >
                                                        {costo.naturaleza}
                                                    </span>


                                                    <span>
                                                        {Number(
                                                            costo.cantidad
                                                        ).toFixed(2)}
                                                    </span>


                                                    <span>
                                                        S/ {Number(
                                                            costo.precioUnitario
                                                        ).toFixed(2)}
                                                    </span>


                                                    <strong>
                                                        S/ {Number(
                                                            costo.subtotal
                                                        ).toFixed(2)}
                                                    </strong>

                                                </div>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: SEGUIMIENTO */}
                {tabActiva === 'seguimiento' && (
                    <div className="orden-tab-contenido">
                        <div className="orden-detalle-card">
                            <div className="orden-seccion-titulo">
                                <div>
                                    <h2>Seguimiento y avances</h2>
                                    <p>Cambios de estado y observaciones registradas durante la ejecución.</p>
                                </div>
                            </div>

                            {tienePermiso('orden.ejecutar') &&
                                orden.estado === 'EN_EJECUCION' && (
                                    <form
                                        className="orden-avance-form"
                                        onSubmit={guardarAvance}
                                    >
                                        <textarea
                                            rows={3}
                                            value={nuevoAvance}
                                            placeholder="Ej. Se desmontaron las pastillas delanteras..."
                                            onChange={(e) => setNuevoAvance(e.target.value)}
                                        />

                                        {errorAvance && (
                                            <p className="orden-form-error">
                                                {errorAvance}
                                            </p>
                                        )}

                                        <div className="orden-avance-acciones">
                                            <button
                                                type="submit"
                                                disabled={guardandoAvance}
                                            >
                                                {guardandoAvance
                                                    ? 'Guardando...'
                                                    : 'Registrar avance'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                            {seguimiento.length === 0 ? (
                                <div className="orden-vacio">
                                    No hay movimientos registrados.
                                </div>
                            ) : (
                                <div className="orden-seguimiento-lista orden-timeline">
                                    {seguimiento.map((item) => (
                                        <div
                                            key={item.id}
                                            className="orden-seguimiento-item"
                                        >
                                            <div className="orden-seguimiento-top">
                                                <strong>
                                                    {item.usuarioNombre || 'Sistema'}
                                                </strong>

                                                <span>
                                                    {mostrarFechaSeguimiento(item.fecha)}
                                                </span>
                                            </div>

                                            <div className="orden-seguimiento-estado">
                                                {item.estadoAnterior
                                                    ? `${mostrarEstado(item.estadoAnterior)} → ${mostrarEstado(item.estadoNuevo)}`
                                                    : mostrarEstado(item.estadoNuevo)}
                                            </div>

                                            {item.comentario && (
                                                <p>{item.comentario}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODAL: NUEVA ACTIVIDAD */}
                {mostrarNuevaActividad &&
                    tienePermiso('orden.ejecutar') && (
                        <div className="orden-modal-fondo">
                            <div className="orden-modal">
                                <div className="orden-modal-header">
                                    <div>
                                        <h2>Agregar actividad</h2>
                                        <p>Agrega una tarea a la orden de trabajo.</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="orden-modal-cerrar"
                                        onClick={() => setMostrarNuevaActividad(false)}
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    className="orden-form"
                                    onSubmit={guardarNuevaActividad}
                                >
                                    <div className="orden-campo">
                                        <label>Descripción *</label>
                                        <textarea
                                            rows={4}
                                            value={nuevaActividad.descripcion}
                                            placeholder="Ej. Revisar sistema de frenos..."
                                            onChange={(e) =>
                                                setNuevaActividad({
                                                    ...nuevaActividad,
                                                    descripcion: e.target.value
                                                })
                                            }
                                        />
                                    </div>

                                    <label className="orden-actividad-check">
                                        <input
                                            type="checkbox"
                                            checked={nuevaActividad.obligatoria}
                                            onChange={(e) =>
                                                setNuevaActividad({
                                                    ...nuevaActividad,
                                                    obligatoria: e.target.checked
                                                })
                                            }
                                        />

                                        Actividad obligatoria
                                    </label>

                                    {errorActividad && (
                                        <p className="orden-form-error">
                                            {errorActividad}
                                        </p>
                                    )}

                                    <div className="orden-form-acciones">
                                        <button
                                            type="button"
                                            onClick={() => setMostrarNuevaActividad(false)}
                                            disabled={guardandoActividad}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={guardandoActividad}
                                        >
                                            {guardandoActividad
                                                ? 'Guardando...'
                                                : 'Agregar actividad'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                {mostrarNuevoCosto && (

                    <div className="orden-modal-fondo">

                        <div className="orden-modal">

                            <div className="orden-modal-header">

                                <div>
                                    <h2>
                                        Registrar costo
                                    </h2>

                                    <p>
                                        Registra mano de obra,
                                        servicios u otros costos.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="orden-modal-cerrar"
                                    onClick={() =>
                                        setMostrarNuevoCosto(false)
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                className="orden-form"
                                onSubmit={guardarCosto}
                            >

                                <div className="orden-campo">

                                    <label>
                                        Categoría
                                    </label>

                                    <select
                                        value={
                                            nuevoCosto.categoria
                                        }
                                        onChange={(e) =>
                                            setNuevoCosto({
                                                ...nuevoCosto,
                                                categoria:
                                                    e.target.value as
                                                    'MANO_OBRA' |
                                                    'SERVICIO' |
                                                    'OTRO'
                                            })
                                        }
                                    >

                                        <option value="MANO_OBRA">
                                            Mano de obra
                                        </option>

                                        <option value="SERVICIO">
                                            Servicio
                                        </option>

                                        <option value="OTRO">
                                            Otro
                                        </option>

                                    </select>

                                </div>


                                <div className="orden-campo">

                                    <label>
                                        Naturaleza
                                    </label>

                                    <select
                                        value={
                                            nuevoCosto.naturaleza
                                        }
                                        onChange={(e) =>
                                            setNuevoCosto({
                                                ...nuevoCosto,
                                                naturaleza:
                                                    e.target.value as
                                                    'ESTIMADO' |
                                                    'REAL'
                                            })
                                        }
                                    >

                                        <option value="ESTIMADO">
                                            Estimado
                                        </option>

                                        <option value="REAL">
                                            Real
                                        </option>

                                    </select>

                                </div>


                                <div className="orden-campo">

                                    <label>
                                        Descripción
                                    </label>

                                    <input
                                        value={
                                            nuevoCosto.descripcion
                                        }
                                        placeholder="Ej. Mano de obra mecánica"
                                        onChange={(e) =>
                                            setNuevoCosto({
                                                ...nuevoCosto,
                                                descripcion:
                                                    e.target.value
                                            })
                                        }
                                    />

                                </div>


                                <div className="orden-repuesto-grid">

                                    <div className="orden-campo">

                                        <label>
                                            Cantidad
                                        </label>

                                        <input
                                            type="number"
                                            step="0.001"
                                            value={
                                                nuevoCosto.cantidad
                                            }
                                            onChange={(e) =>
                                                setNuevoCosto({
                                                    ...nuevoCosto,
                                                    cantidad:
                                                        e.target.value
                                                })
                                            }
                                        />

                                    </div>


                                    <div className="orden-campo">

                                        <label>
                                            Precio unitario (S/)
                                        </label>

                                        <input
                                            type="number"
                                            step="0.01"
                                            value={
                                                nuevoCosto.precioUnitario
                                            }
                                            onChange={(e) =>
                                                setNuevoCosto({
                                                    ...nuevoCosto,
                                                    precioUnitario:
                                                        e.target.value
                                                })
                                            }
                                        />

                                    </div>

                                </div>


                                {errorCosto && (

                                    <p className="orden-form-error">
                                        {errorCosto}
                                    </p>

                                )}


                                <div className="orden-form-acciones">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMostrarNuevoCosto(false)
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            guardandoCosto
                                        }
                                    >
                                        {guardandoCosto
                                            ? 'Guardando...'
                                            : 'Registrar costo'}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}

                {mostrarCerrarOrden && (

                    <div className="orden-modal-fondo">

                        <div className="orden-modal">

                            <div className="orden-modal-header">

                                <div>

                                    <h2>
                                        Validar y cerrar orden
                                    </h2>

                                    <p>
                                        Confirma que la intervención
                                        fue revisada correctamente.
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    className="orden-modal-cerrar"
                                    onClick={() =>
                                        setMostrarCerrarOrden(false)
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <div className="orden-cierre-validaciones">

                                <div>
                                    <span>Inicio real</span>
                                    <strong>
                                        {orden.inicioReal
                                            ? '✓ Registrado'
                                            : 'Pendiente'}
                                    </strong>
                                </div>

                                <div>
                                    <span>Fin real</span>
                                    <strong>
                                        {orden.finReal
                                            ? '✓ Registrado'
                                            : 'Pendiente'}
                                    </strong>
                                </div>

                                <div>
                                    <span>Kilometraje</span>
                                    <strong>
                                        {orden.kilometrajeIntervencion != null
                                            ? '✓ Registrado'
                                            : 'Pendiente'}
                                    </strong>
                                </div>

                                <div>
                                    <span>Resultado de pruebas</span>
                                    <strong>
                                        {orden.resultadoPruebas
                                            ? '✓ Registrado'
                                            : 'Pendiente'}
                                    </strong>
                                </div>

                                <div>
                                    <span>Actividades obligatorias</span>
                                    <strong>
                                        {actividades.some(
                                            a =>
                                                a.obligatoria &&
                                                !a.completada
                                        )
                                            ? 'Pendientes'
                                            : '✓ Completas'}
                                    </strong>
                                </div>

                            </div>


                            <form
                                className="orden-form"
                                onSubmit={confirmarCierreOrden}
                            >

                                <div className="orden-campo">

                                    <label>
                                        Observaciones de cierre
                                    </label>

                                    <textarea
                                        rows={4}
                                        value={observacionesCierre}
                                        placeholder="Ej. Trabajo validado. Unidad apta para operación."
                                        onChange={(e) =>
                                            setObservacionesCierre(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>


                                {errorCierre && (

                                    <p className="orden-form-error">
                                        {errorCierre}
                                    </p>

                                )}


                                <div className="orden-form-acciones">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMostrarCerrarOrden(false)
                                        }
                                        disabled={cerrandoOrden}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn-confirmar-cierre"
                                        disabled={cerrandoOrden}
                                    >
                                        {cerrandoOrden
                                            ? 'Cerrando...'
                                            : 'Validar y cerrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {mostrarCancelarOrden && (

                    <div className="orden-modal-fondo">

                        <div className="orden-modal">

                            <div className="orden-modal-header">

                                <div>
                                    <h2>
                                        Cancelar orden
                                    </h2>

                                    <p>
                                        La cancelación quedará registrada
                                        en el historial de la orden.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="orden-modal-cerrar"
                                    onClick={() =>
                                        setMostrarCancelarOrden(false)
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <form
                                className="orden-form"
                                onSubmit={confirmarCancelacion}
                            >

                                <div className="orden-campo">

                                    <label>
                                        Motivo de cancelación
                                    </label>

                                    <textarea
                                        rows={4}
                                        value={motivoCancelacion}
                                        placeholder="Ej. La intervención ya no es necesaria."
                                        onChange={(e) =>
                                            setMotivoCancelacion(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                {errorCancelacion && (

                                    <p className="orden-form-error">
                                        {errorCancelacion}
                                    </p>

                                )}

                                <div className="orden-form-acciones">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setMostrarCancelarOrden(false)
                                        }
                                        disabled={cancelandoOrden}
                                    >
                                        Volver
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn-confirmar-cancelacion"
                                        disabled={cancelandoOrden}
                                    >
                                        {cancelandoOrden
                                            ? 'Cancelando...'
                                            : 'Confirmar cancelación'}
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

export default OrdenTrabajoDetallePage
