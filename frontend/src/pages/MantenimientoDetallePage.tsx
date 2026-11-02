import {
  useEffect,
  useState
} from 'react'

import {
  useNavigate,
  useParams
} from 'react-router-dom'

import type {
  Mantenimiento
} from '../types/Mantenimiento'

import { useAuth } from '../context/AuthContext'

import {
  obtenerMantenimiento,
  reprogramarMantenimiento,
  cancelarMantenimiento,
  iniciarMantenimiento,
  completarMantenimiento
} from '../services/mantemientoService'

import '../styles/mantenimientoDetalle.css'


function MantenimientoDetallePage() {

  const {
    tienePermiso
  } = useAuth()

  const { id } = useParams()

  const navigate = useNavigate()

  const [
    mantenimiento,
    setMantenimiento
  ] = useState<Mantenimiento | null>(
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
    mostrarReprogramar,
    setMostrarReprogramar
  ] = useState(false)

  const [
    mostrarCancelar,
    setMostrarCancelar
  ] = useState(false)

  const [
    guardando,
    setGuardando
  ] = useState(false)

  const [
    errorAccion,
    setErrorAccion
  ] = useState('')

  const [
    reprogramacion,
    setReprogramacion
  ] = useState({
    fechaVencimiento: '',
    kilometrajeObjetivo: '',
    motivo: ''
  })

  const [
    motivoCancelacion,
    setMotivoCancelacion
  ] = useState('')


  useEffect(() => {

    const cargar = async () => {

      if (!id) {
        return
      }

      try {

        setCargando(true)

        const data =
          await obtenerMantenimiento(
            Number(id)
          )

        setMantenimiento(data)

      } catch (error) {

        console.error(error)

        setError(
          'No se pudo cargar el mantenimiento'
        )

      } finally {

        setCargando(false)

      }
    }

    cargar()

  }, [id])


  const mostrarFecha = (
    fecha: string | null
  ) => {

    if (!fecha) {
      return 'No definida'
    }

    const partes =
      fecha.split('-')

    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }


  const mostrarKm = (
    km: number | null
  ) => {

    if (km === null) {
      return 'No definido'
    }

    return `${km.toLocaleString(
      'es-PE'
    )} km`
  }

  const guardarReprogramacion = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    if (!mantenimiento) {
      return
    }

    if (
      !reprogramacion.fechaVencimiento &&
      !reprogramacion.kilometrajeObjetivo
    ) {
      setErrorAccion(
        'Debe indicar una fecha o kilometraje objetivo'
      )
      return
    }

    if (!reprogramacion.motivo.trim()) {
      setErrorAccion(
        'Debe indicar el motivo de la reprogramación'
      )
      return
    }

    try {

      setGuardando(true)
      setErrorAccion('')

      const actualizado =
        await reprogramarMantenimiento(
          mantenimiento.id,
          {
            fechaVencimiento:
              reprogramacion.fechaVencimiento ||
              null,

            kilometrajeObjetivo:
              reprogramacion.kilometrajeObjetivo
                ? Number(
                    reprogramacion.kilometrajeObjetivo
                  )
                : null,

            motivo:
              reprogramacion.motivo.trim()
          }
        )

      setMantenimiento(actualizado)

      setMostrarReprogramar(false)

    } catch (error) {

      setErrorAccion(
        error instanceof Error
          ? error.message
          : 'No se pudo reprogramar'
      )

    } finally {

      setGuardando(false)

    }
  }

  const confirmarCancelacion = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    if (!mantenimiento) {
      return
    }

    if (!motivoCancelacion.trim()) {

      setErrorAccion(
        'Debe indicar el motivo de cancelación'
      )

      return
    }

    try {

      setGuardando(true)
      setErrorAccion('')

      const actualizado =
        await cancelarMantenimiento(
          mantenimiento.id,
          motivoCancelacion.trim()
        )

      setMantenimiento(actualizado)

      setMostrarCancelar(false)

    } catch (error) {

      setErrorAccion(
        error instanceof Error
          ? error.message
          : 'No se pudo cancelar'
      )

    } finally {

      setGuardando(false)

    }
  }

  const iniciar = async () => {

    if (!mantenimiento) {
      return
    }

    try {

      setGuardando(true)
      setErrorAccion('')

      const actualizado =
        await iniciarMantenimiento(
          mantenimiento.id
        )

      setMantenimiento(actualizado)

    } catch (error) {

      setErrorAccion(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar'
      )

    } finally {

      setGuardando(false)

    }
  }

  const completar = async () => {

    if (!mantenimiento) {
      return
    }

    try {

      setGuardando(true)
      setErrorAccion('')

      const actualizado =
        await completarMantenimiento(
          mantenimiento.id
        )

      setMantenimiento(actualizado)

    } catch (error) {

      setErrorAccion(
        error instanceof Error
          ? error.message
          : 'No se pudo completar'
      )

    } finally {

      setGuardando(false)

    }
  }

  if (cargando) {

    return (
      <div className="page-container">
        Cargando mantenimiento...
      </div>
    )
  }


  if (
    error ||
    !mantenimiento
  ) {

    return (
      <div className="page-container">

        <p className="mantenimiento-error">
          {error ||
            'Mantenimiento no encontrado'}
        </p>

        <button
          onClick={() =>
            navigate('/mantenimiento')
          }
        >
          Volver
        </button>

      </div>
    )
  }


  return (

    <div className="page-container">

      <div className="mantenimiento-detalle">


        {/* VOLVER */}

        <button
          type="button"
          className="btn-volver-mantenimiento"
          onClick={() =>
            navigate('/mantenimiento')
          }
        >
          ← Volver a mantenimiento
        </button>


        {/* HEADER */}

        <div className="mantenimiento-detalle-header">

          <div>

            <span className="detalle-subtitulo">
              Mantenimiento #{mantenimiento.id}
            </span>

            <h1>
              {mantenimiento.descripcion}
            </h1>

            <p>
              PAD {mantenimiento.unidadCodigo}
              {mantenimiento.placa
                ? ` · ${mantenimiento.placa}`
                : ''}
            </p>

          </div>


          <span
            className={
              `mantenimiento-situacion ${
                mantenimiento.situacion
                  .toLowerCase()
              }`
            }
          >
            {mantenimiento.situacion
              .replaceAll('_', ' ')}
          </span>

        </div>


        {/* INFORMACIÓN */}

        <div className="detalle-card">

          <h2>
            Información general
          </h2>


          <div className="detalle-grid">


            <div className="detalle-item">

              <span>
                Tipo
              </span>

              <strong>
                {mantenimiento.tipo ===
                'PREVENTIVO'
                  ? 'Preventivo'
                  : 'Correctivo'}
              </strong>

            </div>


            <div className="detalle-item">

              <span>
                Estado
              </span>

              <strong>
                {mantenimiento.estado}
              </strong>

            </div>


            <div className="detalle-item">

              <span>
                Responsable
              </span>

              <strong>
                {mantenimiento.responsable}
              </strong>

            </div>


            <div className="detalle-item">

              <span>
                Unidad
              </span>

              <strong>
                PAD {mantenimiento.unidadCodigo}
              </strong>

            </div>


            <div className="detalle-item">

              <span>
                Placa
              </span>

              <strong>
                {mantenimiento.placa ||
                  'Sin placa'}
              </strong>

            </div>

            <div className="detalle-item">

              <span>
                Inicio programado
              </span>

              <strong>
                {mantenimiento.inicioProgramado
                  ? new Date(
                      mantenimiento.inicioProgramado
                    ).toLocaleString(
                      'es-PE',
                      {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )
                  : 'No definido'}
              </strong>

            </div>

            <div className="detalle-item">

              <span>
                Fin programado
              </span>

              <strong>
                {mantenimiento.finProgramado
                  ? new Date(
                      mantenimiento.finProgramado
                    ).toLocaleString(
                      'es-PE',
                      {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )
                  : 'No definido'}
              </strong>

            </div>

          </div>

        </div>


        {/* VENCIMIENTO */}

        <div className="detalle-card">

          <h2>
            Condiciones de mantenimiento
          </h2>


          <div className="detalle-grid">

            <div className="detalle-item">

              <span>
                Fecha de vencimiento
              </span>

              <strong>
                {mostrarFecha(
                  mantenimiento
                    .fechaVencimiento
                )}
              </strong>

            </div>


            <div className="detalle-item">

              <span>
                Kilometraje objetivo
              </span>

              <strong>
                {mostrarKm(
                  mantenimiento
                    .kilometrajeObjetivo
                )}
              </strong>

            </div>


            <div className="detalle-item">

              <span>
                Kilometraje actual
              </span>

              <strong>
                {mostrarKm(
                  mantenimiento
                    .kilometrajeActual
                )}
              </strong>

            </div>

          </div>

        </div>


        {/* DESCRIPCIÓN */}

        <div className="detalle-card">

          <h2>
            Descripción
          </h2>

          <p className="detalle-descripcion">
            {mantenimiento.descripcion}
          </p>

        </div>


        {/* ACCIONES */}

        {tienePermiso('mantenimiento.planificar') && (

          <div className="detalle-acciones">

            {mantenimiento.estado === 'PROGRAMADA' && (

              <button
                type="button"
                className="btn-iniciar-mantenimiento"
                onClick={iniciar}
                disabled={guardando}
              >
                Iniciar mantenimiento
              </button>

            )}

            {mantenimiento.estado === 'EN_EJECUCION' && (

              <button
                type="button"
                className="btn-completar-mantenimiento"
                onClick={completar}
                disabled={guardando}
              >
                Completar mantenimiento
              </button>

            )}

            {mantenimiento.estado === 'PROGRAMADA' && (

              <>
                <button
                  type="button"
                  className="btn-reprogramar"
                  onClick={() => {

                    setErrorAccion('')

                    setReprogramacion({
                      fechaVencimiento:
                        mantenimiento.fechaVencimiento || '',

                      kilometrajeObjetivo:
                        mantenimiento.kilometrajeObjetivo
                          ?.toString() || '',

                      motivo: ''
                    })

                    setMostrarReprogramar(true)
                  }}
                >
                  Reprogramar
                </button>


                <button
                  type="button"
                  className="btn-cancelar-programacion"
                  onClick={() => {

                    setErrorAccion('')
                    setMotivoCancelacion('')

                    setMostrarCancelar(true)
                  }}
                >
                  Cancelar mantenimiento
                </button>
              </>

            )}

          </div>

        )}

        {mostrarReprogramar && 
          tienePermiso('mantenimiento.planificar') && (

          <div className="mantenimiento-modal-fondo">

            <div className="mantenimiento-modal">

              <div className="mantenimiento-modal-header">

                <div>
                  <h2>Reprogramar mantenimiento</h2>

                  <p>
                    Modifica las condiciones de
                    vencimiento de la intervención.
                  </p>
                </div>

                <button
                  type="button"
                  className="mantenimiento-modal-cerrar"
                  onClick={() =>
                    setMostrarReprogramar(false)
                  }
                >
                  ×
                </button>

              </div>


              <form
                className="mantenimiento-form"
                onSubmit={guardarReprogramacion}
              >

                <div className="mantenimiento-form-grid">

                  <div className="mantenimiento-campo">

                    <label>
                      Nueva fecha de vencimiento
                    </label>

                    <input
                      type="date"
                      value={
                        reprogramacion.fechaVencimiento
                      }
                      onChange={(e) =>
                        setReprogramacion({
                          ...reprogramacion,
                          fechaVencimiento:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  <div className="mantenimiento-campo">

                    <label>
                      Nuevo kilometraje objetivo
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={
                        reprogramacion.kilometrajeObjetivo
                      }
                      onChange={(e) =>
                        setReprogramacion({
                          ...reprogramacion,
                          kilometrajeObjetivo:
                            e.target.value
                        })
                      }
                    />

                  </div>


                  <div
                    className="
                      mantenimiento-campo
                      mantenimiento-campo-completo
                    "
                  >

                    <label>
                      Motivo de la reprogramación *
                    </label>

                    <textarea
                      rows={4}
                      value={reprogramacion.motivo}
                      onChange={(e) =>
                        setReprogramacion({
                          ...reprogramacion,
                          motivo:
                            e.target.value
                        })
                      }
                      placeholder="Explique por qué se modifica la programación..."
                    />

                  </div>

                </div>


                {errorAccion && (
                  <p className="mantenimiento-form-error">
                    {errorAccion}
                  </p>
                )}


                <div className="mantenimiento-form-acciones">

                  <button
                    type="button"
                    className="btn-cancelar-mantenimiento"
                    onClick={() =>
                      setMostrarReprogramar(false)
                    }
                  >
                    Volver
                  </button>

                  <button
                    type="submit"
                    className="btn-guardar-mantenimiento"
                    disabled={guardando}
                  >
                    {guardando
                      ? 'Guardando...'
                      : 'Guardar reprogramación'}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {mostrarCancelar && 
          tienePermiso('mantenimiento.planificar') && (

          <div className="mantenimiento-modal-fondo">

            <div className="mantenimiento-modal mantenimiento-modal-pequeno">

              <div className="mantenimiento-modal-header">

                <div>
                  <h2>
                    Cancelar mantenimiento
                  </h2>

                  <p>
                    Esta acción conservará el registro
                    para fines de trazabilidad.
                  </p>
                </div>

                <button
                  type="button"
                  className="mantenimiento-modal-cerrar"
                  onClick={() =>
                    setMostrarCancelar(false)
                  }
                >
                  ×
                </button>

              </div>


              <form
                className="mantenimiento-form"
                onSubmit={confirmarCancelacion}
              >

                <div className="mantenimiento-campo">

                  <label>
                    Motivo de cancelación *
                  </label>

                  <textarea
                    rows={4}
                    value={motivoCancelacion}
                    onChange={(e) =>
                      setMotivoCancelacion(
                        e.target.value
                      )
                    }
                    placeholder="Explique por qué se cancela este mantenimiento..."
                  />

                </div>


                {errorAccion && (
                  <p className="mantenimiento-form-error">
                    {errorAccion}
                  </p>
                )}


                <div className="mantenimiento-form-acciones">

                  <button
                    type="button"
                    className="btn-cancelar-mantenimiento"
                    onClick={() =>
                      setMostrarCancelar(false)
                    }
                  >
                    Volver
                  </button>


                  <button
                    type="submit"
                    className="btn-confirmar-cancelacion"
                    disabled={guardando}
                  >
                    {guardando
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

export default MantenimientoDetallePage