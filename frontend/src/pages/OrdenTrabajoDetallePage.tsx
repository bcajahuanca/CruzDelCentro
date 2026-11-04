import {
    useEffect,
    useState
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
} from '../services/ordenTrabajoService'

import {
    useAuth
} from '../context/AuthContext'

import '../styles/ordenTrabajoDetalle.css'


function OrdenTrabajoDetallePage() {

    const { id } = useParams()

    const navigate = useNavigate()

    const {
        tienePermiso
    } = useAuth()


    const [
        orden,
        setOrden
    ] = useState<OrdenTrabajo | null>(
        null
    )

    const [
        cargando,
        setCargando
    ] = useState(true)

    const [
        error,
        setError
    ] = useState('')

    const [
        incidencias,
        setIncidencias
    ] = useState<OrdenIncidencia[]>([])

    const [
        actividades,
        setActividades
    ] = useState<OrdenActividad[]>([])

    const [
        diagnostico,
        setDiagnostico
    ] = useState('')

    const [
        guardandoDiagnostico,
        setGuardandoDiagnostico
    ] = useState(false)

    const [
        errorDiagnostico,
        setErrorDiagnostico
    ] = useState('')

    const [
        actividadEnProceso,
        setActividadEnProceso
    ] = useState<number | null>(null)

    const [
        mostrarNuevaActividad,
        setMostrarNuevaActividad
    ] = useState(false)

    const [
        nuevaActividad,
        setNuevaActividad
    ] = useState({
        descripcion: '',
        obligatoria: true
    })

    const [
        guardandoActividad,
        setGuardandoActividad
    ] = useState(false)

    const [
        errorActividad,
        setErrorActividad
    ] = useState('')

    const [
        iniciandoTrabajo,
        setIniciandoTrabajo
    ] = useState(false)

    const [
        seguimiento,
        setSeguimiento
    ] = useState<OrdenSeguimiento[]>([])

    const [
        nuevoAvance,
        setNuevoAvance
    ] = useState('')

    const [
        guardandoAvance,
        setGuardandoAvance
    ] = useState(false)

    const [
        errorAvance,
        setErrorAvance
    ] = useState('')

    const [
        finalizandoTrabajo,
        setFinalizandoTrabajo
    ] = useState(false)


    useEffect(() => {

        const cargarOrden = async () => {

            if (!id) {

                setError(
                    'Orden de trabajo no válida'
                )

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
                    seguimientoData
                ] = await Promise.all([
                    obtenerOrdenTrabajo(Number(id)),
                    listarIncidenciasOrden(Number(id)),
                    listarActividadesOrden(Number(id)),
                    listarSeguimientoOrden(Number(id))
                ])

                setOrden(ordenData)
                setIncidencias(incidenciasData)
                setActividades(actividadesData)
                setSeguimiento(seguimientoData)

                setDiagnostico(
                    ordenData.diagnostico || ''
                )

                setOrden(ordenData)

                setDiagnostico(ordenData.diagnostico || '')

                setIncidencias(
                    incidenciasData
                )

                setActividades(
                    actividadesData
                )

            } catch (error) {

                console.error(error)

                setError(
                    'No se pudo cargar la orden de trabajo'
                )

            } finally {

                setCargando(false)

            }
        }

        cargarOrden()

    }, [id])


    const mostrarTipo = (
        tipo: string
    ) => {

        return tipo === 'PREVENTIVO'
            ? 'Preventivo'
            : 'Correctivo'
    }


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
                return 'Pendiente de validación'

            case 'CERRADA':
                return 'Cerrada'

            case 'CANCELADA':
                return 'Cancelada'

            default:
                return estado
        }
    }


    const mostrarFecha = (
        fecha: string | null
    ) => {

        if (!fecha) {
            return 'No registrada'
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

    const guardarDiagnostico = async () => {

        if (!orden) {
            return
        }

        if (!diagnostico.trim()) {

            setErrorDiagnostico(
                'Debe ingresar un diagnóstico'
            )

            return
        }

        try {

            setGuardandoDiagnostico(true)
            setErrorDiagnostico('')

            const actualizado =
                await actualizarDiagnosticoOrden(
                    orden.id,
                    diagnostico
                )

            setOrden(actualizado)

            setDiagnostico(
                actualizado.diagnostico || ''
            )

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


    const completarActividad = async (
        actividadId: number
    ) => {

        if (!orden) {
            return
        }

        try {

            setActividadEnProceso(
                actividadId
            )

            await completarActividadOrden(
                orden.id,
                actividadId
            )

            const actualizadas =
                await listarActividadesOrden(
                    orden.id
                )

            setActividades(
                actualizadas
            )

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

    const guardarNuevaActividad = async (
        e: React.FormEvent
    ) => {

        e.preventDefault()

        if (!orden) {
            return
        }

        if (
            !nuevaActividad.descripcion.trim()
        ) {

            setErrorActividad(
                'Debe ingresar una descripción'
            )

            return
        }

        try {

            setGuardandoActividad(true)
            setErrorActividad('')

            await crearActividadOrden(
                orden.id,
                {
                    descripcion:
                        nuevaActividad.descripcion.trim(),

                    obligatoria:
                        nuevaActividad.obligatoria
                }
            )

            const actualizadas =
                await listarActividadesOrden(
                    orden.id
                )

            setActividades(
                actualizadas
            )

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

        if (!orden) {
            return
        }

        try {

            setIniciandoTrabajo(true)

            const actualizada =
                await iniciarOrdenTrabajo(
                    orden.id
                )

            setOrden(actualizada)

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

    const guardarAvance = async (
        e: React.FormEvent
    ) => {

        e.preventDefault()

        if (!orden) {
            return
        }

        if (!nuevoAvance.trim()) {

            setErrorAvance(
                'Debe ingresar un comentario'
            )

            return
        }

        try {

            setGuardandoAvance(true)
            setErrorAvance('')

            await registrarAvanceOrden(
                orden.id,
                nuevoAvance.trim()
            )

            const actualizado =
                await listarSeguimientoOrden(
                    orden.id
                )

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

            const actualizada =
                await finalizarOrdenTrabajo(
                    orden.id
                )

            setOrden(
                actualizada
            )

            const seguimientoActualizado =
                await listarSeguimientoOrden(
                    orden.id
                )

            setSeguimiento(
                seguimientoActualizado
            )

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

    if (cargando) {

        return (
            <div className="page-container">
                Cargando orden de trabajo...
            </div>
        )
    }


    if (
        error ||
        !orden
    ) {

        return (

            <div className="page-container">

                <p>
                    {error ||
                        'Orden de trabajo no encontrada'}
                </p>

                <button
                    onClick={() =>
                        navigate(
                            '/ordenes-trabajo'
                        )
                    }
                >
                    Volver
                </button>

            </div>

        )
    }


    return (

        <div className="page-container">

            <div className="orden-detalle-page">


                {/* VOLVER */}

                <button
                    type="button"
                    className="btn-volver-orden"
                    onClick={() =>
                        navigate(
                            '/ordenes-trabajo'
                        )
                    }
                >
                    ← Volver a órdenes
                </button>


                {/* HEADER */}

                <div className="orden-detalle-header">

                    <div>

                        <span className="orden-detalle-codigo">
                            {orden.codigo}
                        </span>

                        <h1>
                            Orden de Trabajo
                        </h1>

                        <p>
                            PAD {orden.unidadCodigo}
                            {orden.placa
                                ? ` · ${orden.placa}`
                                : ''}
                        </p>

                    </div>


                    <span
                        className={
                            `orden-estado ${orden.estado.toLowerCase()
                            }`
                        }
                    >
                        {mostrarEstado(
                            orden.estado
                        )}
                    </span>

                </div>


                {/* INFORMACIÓN GENERAL */}

                <div className="orden-detalle-card">

                    <h2>
                        Información general
                    </h2>

                    <div className="orden-detalle-grid">


                        <div>

                            <span>
                                Unidad
                            </span>

                            <strong>
                                PAD {orden.unidadCodigo}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Placa
                            </span>

                            <strong>
                                {orden.placa || 'Sin placa'}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Tipo
                            </span>

                            <strong>
                                {mostrarTipo(
                                    orden.tipo
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Responsable
                            </span>

                            <strong>
                                {orden.responsable}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Estado
                            </span>

                            <strong>
                                {mostrarEstado(
                                    orden.estado
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Programación relacionada
                            </span>

                            <strong>
                                {orden.programacionId
                                    ? `#${orden.programacionId}`
                                    : 'Sin programación'}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* FECHAS */}

                <div className="orden-detalle-card">

                    <h2>
                        Fechas
                    </h2>

                    <div className="orden-detalle-grid">


                        <div>

                            <span>
                                Apertura
                            </span>

                            <strong>
                                {mostrarFecha(
                                    orden.fechaApertura
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Inicio real
                            </span>

                            <strong>
                                {mostrarFecha(
                                    orden.inicioReal
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Fin estimado
                            </span>

                            <strong>
                                {mostrarFecha(
                                    orden.fechaEstimadaFin
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Fin real
                            </span>

                            <strong>
                                {mostrarFecha(
                                    orden.finReal
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Fecha de cierre
                            </span>

                            <strong>
                                {mostrarFecha(
                                    orden.fechaCierre
                                )}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* DIAGNÓSTICO */}

                <div className="orden-detalle-card">

                    <h2>
                        Diagnóstico
                    </h2>

                    {tienePermiso('orden.ejecutar') &&
                        orden.estado !== 'CERRADA' &&
                        orden.estado !== 'CANCELADA' ? (

                        <>
                            <textarea
                                className="orden-diagnostico-textarea"
                                rows={5}
                                value={diagnostico}
                                placeholder="Registra el diagnóstico técnico de la unidad..."
                                onChange={(e) =>
                                    setDiagnostico(
                                        e.target.value
                                    )
                                }
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

                {/* ACTIVIDADES */}

                <div className="orden-actividades-header">

                    <h2>
                        Actividades
                    </h2>

                    {tienePermiso('orden.ejecutar') &&
                        orden.estado !== 'CERRADA' &&
                        orden.estado !== 'CANCELADA' && (

                            <button
                                type="button"
                                className="btn-agregar-actividad-orden"
                                onClick={() => {

                                    setErrorActividad('')

                                    setMostrarNuevaActividad(
                                        true
                                    )
                                }}
                            >
                                + Agregar actividad
                            </button>

                        )}

                </div>

                {actividades.length === 0 ? (

                    <p>
                        No hay actividades registradas para esta orden.
                    </p>

                ) : (

                    <div className="orden-actividades">

                        {actividades.map((actividad) => (

                            <div
                                key={actividad.id}
                                className={
                                    `orden-actividad-item ${actividad.completada
                                        ? 'completada'
                                        : ''
                                    }`
                                }
                            >

                                <div className="orden-actividad-info">

                                    <span className="orden-actividad-numero">
                                        {actividad.ordenVisual}
                                    </span>

                                    <div>

                                        <strong>
                                            {actividad.descripcion}
                                        </strong>

                                        <span>
                                            {actividad.obligatoria
                                                ? 'Obligatoria'
                                                : 'Opcional'}
                                        </span>

                                        {actividad.observaciones && (

                                            <p>
                                                {actividad.observaciones}
                                            </p>

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
                                            onClick={() =>
                                                completarActividad(
                                                    actividad.id
                                                )
                                            }
                                            disabled={
                                                actividadEnProceso ===
                                                actividad.id
                                            }
                                        >
                                            {actividadEnProceso ===
                                                actividad.id
                                                ? 'Guardando...'
                                                : 'Completar'}
                                        </button>

                                    ) : (

                                        <span>
                                            Pendiente
                                        </span>

                                    )}

                                </div>

                            </div>

                        ))}

                    </div>

                )}

                {mostrarNuevaActividad &&
                    tienePermiso('orden.ejecutar') && (

                        <div className="orden-modal-fondo">

                            <div className="orden-modal">

                                <div className="orden-modal-header">

                                    <div>

                                        <h2>
                                            Agregar actividad
                                        </h2>

                                        <p>
                                            Agrega una tarea a la orden
                                            de trabajo.
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        className="orden-modal-cerrar"
                                        onClick={() =>
                                            setMostrarNuevaActividad(false)
                                        }
                                    >
                                        ×
                                    </button>

                                </div>

                                <form
                                    className="orden-form"
                                    onSubmit={guardarNuevaActividad}
                                >

                                    <div className="orden-campo">

                                        <label>
                                            Descripción *
                                        </label>

                                        <textarea
                                            rows={4}
                                            value={
                                                nuevaActividad.descripcion
                                            }
                                            placeholder="Ej. Revisar sistema de frenos..."
                                            onChange={(e) =>
                                                setNuevaActividad({
                                                    ...nuevaActividad,
                                                    descripcion:
                                                        e.target.value
                                                })
                                            }
                                        />

                                    </div>

                                    <label className="orden-actividad-check">

                                        <input
                                            type="checkbox"
                                            checked={
                                                nuevaActividad.obligatoria
                                            }
                                            onChange={(e) =>
                                                setNuevaActividad({
                                                    ...nuevaActividad,
                                                    obligatoria:
                                                        e.target.checked
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
                                            onClick={() =>
                                                setMostrarNuevaActividad(false)
                                            }
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

                <div className="orden-detalle-card">

                    <div className="orden-seguimiento-header">

                        <h2>
                            Seguimiento y avances
                        </h2>

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
                                    onChange={(e) =>
                                        setNuevoAvance(
                                            e.target.value
                                        )
                                    }
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

                        <p>
                            No hay movimientos registrados.
                        </p>

                    ) : (

                        <div className="orden-seguimiento-lista">

                            {seguimiento.map(
                                item => (

                                    <div
                                        key={item.id}
                                        className="orden-seguimiento-item"
                                    >

                                        <div className="orden-seguimiento-top">

                                            <strong>
                                                {item.usuarioNombre ||
                                                    'Sistema'}
                                            </strong>

                                            <span>
                                                {new Date(
                                                    item.fecha
                                                ).toLocaleString()}
                                            </span>

                                        </div>

                                        <div className="orden-seguimiento-estado">

                                            {item.estadoAnterior
                                                ? `${item.estadoAnterior} → ${item.estadoNuevo}`
                                                : item.estadoNuevo}

                                        </div>

                                        {item.comentario && (

                                            <p>
                                                {item.comentario}
                                            </p>

                                        )}

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

                {/* INCIDENCIAS ASOCIADAS */}

                <div className="orden-detalle-card">

                    <h2>
                        Incidencias asociadas
                    </h2>

                    {incidencias.length === 0 ? (

                        <p>
                            Esta orden no tiene incidencias
                            vinculadas.
                        </p>

                    ) : (

                        <div className="orden-incidencias">

                            {incidencias.map(
                                incidencia => (

                                    <div
                                        key={incidencia.id}
                                        className="orden-incidencia-item"
                                    >

                                        <div className="orden-incidencia-header">

                                            <div>

                                                <strong>
                                                    {incidencia.codigo}
                                                </strong>

                                                <span>
                                                    {incidencia.tipo}
                                                </span>

                                            </div>


                                            <span
                                                className={
                                                    `incidencias-badge ${incidencia.prioridad
                                                        .toLowerCase()
                                                    }`
                                                }
                                            >
                                                {incidencia.prioridad}
                                            </span>

                                        </div>


                                        <p>
                                            {incidencia.descripcion}
                                        </p>


                                        <div className="orden-incidencia-footer">

                                            <span>
                                                Estado:{' '}
                                                {incidencia.estado
                                                    .replaceAll('_', ' ')}
                                            </span>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/incidencias/${incidencia.id}`
                                                    )
                                                }
                                            >
                                                Ver incidencia
                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* ACCIONES */}

                <div className="orden-detalle-acciones">

                    {tienePermiso('orden.ejecutar') &&
                        (orden.estado === 'ABIERTA' ||
                            orden.estado === 'ASIGNADA') && (

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

                    {tienePermiso('orden.cerrar') &&
                        orden.estado === 'PENDIENTE_VALIDACION' && (

                            <button
                                type="button"
                                className="btn-cerrar-orden"
                            >
                                Cerrar orden
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

                </div>
            </div>
        </div>
    )
}

export default OrdenTrabajoDetallePage