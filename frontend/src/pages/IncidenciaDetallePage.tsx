import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import type { Incidencia } from '../types/Incidencias'
import { obtenerIncidencia } from '../services/incidenciaService'

import {
  crearOrdenTrabajo,
  vincularIncidenciaOrden,
  listarResponsablesDisponibles,
} from '../services/ordenTrabajoService'

import { useAuth } from '../context/AuthContext'

import '../styles/incidenciaDetalle.css'
import type { OrdenResponsable } from '../types/OrdenTrabajo'

function IncidenciaDetallePage() {

  const { id } = useParams()

  const navigate = useNavigate()

  const {
    tienePermiso
  } = useAuth()

  const [incidencia, setIncidencia] =
    useState<Incidencia | null>(null)

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')

  const [
    mostrarGenerarOrden,
    setMostrarGenerarOrden
  ] = useState(false)

  const [
    generandoOrden,
    setGenerandoOrden
  ] = useState(false)

  const [
    errorOrden,
    setErrorOrden
  ] = useState('')

  const [
    ordenForm,
    setOrdenForm
  ] = useState({
    responsableId: '3',
    fechaEstimadaFin: ''
  })

  const [responsables, setResponsables] =
    useState<OrdenResponsable[]>([])

  const [formOrden, setFormOrden] = useState({
    responsableId: '',
    fechaEstimadaFin: ''
  })

  useEffect(() => {

    const cargarIncidencia = async () => {

      if (!id) {
        setError('Incidencia no válida')
        setCargando(false)
        return
      }

      try {

        setCargando(true)
        setError('')

        const [
          dataIncidencia,
          dataResponsables
        ] = await Promise.all([
          obtenerIncidencia(Number(id)),
          listarResponsablesDisponibles()
        ])

        setIncidencia(dataIncidencia)
        setResponsables(dataResponsables)

      } catch (error) {

        console.error(error)

        setError(
          'No se pudo cargar la incidencia'
        )

      } finally {

        setCargando(false)

      }

    }

    cargarIncidencia()

  }, [id])


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

  const generarOrdenTrabajo = async (
    e: React.FormEvent
  ) => {

    e.preventDefault()

    if (!incidencia) {
      return
    }

    if (!ordenForm.responsableId) {

      setErrorOrden(
        'Debe indicar un responsable'
      )

      return
    }

    try {

      setGenerandoOrden(true)
      setErrorOrden('')


      const orden =
        await crearOrdenTrabajo({

          unidadId:
            incidencia.unidadId,

          programacionId:
            null,

          tipo:
            'CORRECTIVO',

          responsableId:
            Number(
              ordenForm.responsableId
            ),

          proveedorId:
            null,

          fechaEstimadaFin:
            ordenForm.fechaEstimadaFin ||
            null
        })


      await vincularIncidenciaOrden(
        orden.id,
        incidencia.id
      )


      setMostrarGenerarOrden(false)


      navigate(
        `/ordenes-trabajo/${orden.id}`
      )

    } catch (error) {

      console.error(error)

      setErrorOrden(
        error instanceof Error
          ? error.message
          : 'No se pudo generar la orden de trabajo'
      )

    } finally {

      setGenerandoOrden(false)

    }
  }

  if (cargando) {

    return (

      <div className="page-container">

        <p>
          Cargando incidencia...
        </p>

      </div>

    )
  }


  if (error || !incidencia) {

    return (

      <div className="page-container">

        <div className="incidencia-detalle-error">

          <p>
            {error || 'Incidencia no encontrada'}
          </p>

          <button
            onClick={() =>
              navigate('/incidencias')
            }
          >
            Volver a incidencias
          </button>

        </div>

      </div>

    )
  }


  return (

    <div className="page-container">

      <div className="incidencia-detalle-page">


        {/* VOLVER */}

        <button
          type="button"
          className="btn-volver-incidencias"
          onClick={() =>
            navigate('/incidencias')
          }
        >
          ← Volver a incidencias
        </button>


        {/* CABECERA */}

        <div className="incidencia-detalle-header">

          <div>

            <p className="incidencia-detalle-codigo">
              {incidencia.codigo}
            </p>

            <h1>
              Detalle de incidencia
            </h1>

            <p>
              Información y seguimiento
              de la incidencia registrada.
            </p>

          </div>


          <div className="incidencia-detalle-header-acciones">

            <span
              className={
                `incidencias-badge ${incidencia.estado
                  .toLowerCase()
                }`
              }
            >
              {mostrarEstado(
                incidencia.estado
              )}
            </span>


            {tienePermiso('orden.crear') &&
              incidencia.estado !== 'RESUELTA' &&
              incidencia.estado !== 'CERRADA' &&
              incidencia.estado !== 'ANULADA' && (

                <button
                  type="button"
                  className="btn-generar-orden"
                  onClick={() => {

                    setErrorOrden('')

                    setMostrarGenerarOrden(true)
                  }}
                >
                  Generar orden de trabajo
                </button>

              )}

          </div>

        </div>


        {/* INFORMACIÓN PRINCIPAL */}

        <div className="incidencia-detalle-card">

          <div className="incidencia-detalle-card-header">

            <h2>
              Información general
            </h2>

          </div>


          <div className="incidencia-detalle-grid">


            <div className="incidencia-detalle-item">

              <span>
                Unidad
              </span>

              <strong>
                PAD {incidencia.unidadCodigo}

                {incidencia.placa &&
                  ` - ${incidencia.placa}`
                }
              </strong>

            </div>


            <div className="incidencia-detalle-item">

              <span>
                Tipo de incidencia
              </span>

              <strong>
                {incidencia.tipo}
              </strong>

            </div>


            <div className="incidencia-detalle-item">

              <span>
                Prioridad
              </span>

              <span
                className={
                  `incidencias-badge ${incidencia.prioridad
                    .toLowerCase()
                  }`
                }
              >
                {mostrarPrioridad(
                  incidencia.prioridad
                )}
              </span>

            </div>


            <div className="incidencia-detalle-item">

              <span>
                Estado
              </span>

              <strong>
                {mostrarEstado(
                  incidencia.estado
                )}
              </strong>

            </div>


            <div className="incidencia-detalle-item">

              <span>
                Reportado por
              </span>

              <strong>
                {incidencia.reportadoPor}
              </strong>

            </div>


            <div className="incidencia-detalle-item">

              <span>
                Fecha de reporte
              </span>

              <strong>
                {mostrarFecha(
                  incidencia.fechaReporte
                )}
              </strong>

            </div>

          </div>

        </div>


        {/* DESCRIPCIÓN */}

        <div className="incidencia-detalle-card">

          <div className="incidencia-detalle-card-header">

            <h2>
              Descripción
            </h2>

          </div>

          <p className="incidencia-detalle-descripcion">
            {incidencia.descripcion}
          </p>

        </div>


        {/* RESPONSABLE */}

        <div className="incidencia-detalle-card">

          <div className="incidencia-detalle-card-header">

            <h2>
              Responsable
            </h2>

            {tienePermiso(
              'incidencia.gestionar'
            ) && (

                <button
                  type="button"
                  className="btn-secundario-incidencia"
                >
                  Asignar responsable
                </button>

              )}

          </div>

          <p className="incidencia-detalle-vacio">
            Todavía no se ha cargado
            el responsable asignado.
          </p>

        </div>


        {/* SEGUIMIENTO */}

        <div className="incidencia-detalle-card">

          <div className="incidencia-detalle-card-header">

            <h2>
              Seguimiento
            </h2>

            {tienePermiso(
              'incidencia.gestionar'
            ) && (

                <button
                  type="button"
                  className="btn-secundario-incidencia"
                >
                  Cambiar estado
                </button>

              )}

          </div>

          <p className="incidencia-detalle-vacio">
            Aquí aparecerán los cambios
            de estado y comentarios.
          </p>

        </div>


        {/* EVIDENCIAS */}

        <div className="incidencia-detalle-card">

          <div className="incidencia-detalle-card-header">

            <h2>
              Evidencias
            </h2>

            {tienePermiso(
              'incidencia.gestionar'
            ) && (

                <button
                  type="button"
                  className="btn-secundario-incidencia"
                >
                  + Adjuntar evidencia
                </button>

              )}

          </div>

          <p className="incidencia-detalle-vacio">
            No hay evidencias registradas.
          </p>

        </div>


        {/* ACCIONES */}

        {tienePermiso(
          'incidencia.gestionar'
        ) && (

            <div className="incidencia-detalle-acciones">

              <button
                type="button"
                className="btn-resolver-incidencia"
              >
                Resolver incidencia
              </button>

              <button
                type="button"
                className="btn-cerrar-incidencia"
              >
                Cerrar incidencia
              </button>

              <button
                type="button"
                className="btn-anular-incidencia"
              >
                Anular
              </button>

            </div>

          )}

        {mostrarGenerarOrden &&
          tienePermiso('orden.crear') && (

            <div className="incidencia-modal-fondo">

              <div className="incidencia-modal">

                <div className="incidencia-modal-header">

                  <div>

                    <h2>
                      Generar orden de trabajo
                    </h2>

                    <p>
                      Se creará una orden correctiva
                      vinculada a {incidencia.codigo}.
                    </p>

                  </div>

                  <button
                    type="button"
                    className="incidencia-modal-cerrar"
                    onClick={() =>
                      setMostrarGenerarOrden(false)
                    }
                  >
                    ×
                  </button>

                </div>


                <form
                  className="incidencia-form"
                  onSubmit={generarOrdenTrabajo}
                >

                  <div className="incidencia-form-grid">


                    <div className="incidencia-campo">

                      <label>
                        Unidad
                      </label>

                      <input
                        type="text"
                        value={
                          `PAD ${incidencia.unidadCodigo}${incidencia.placa
                            ? ` - ${incidencia.placa}`
                            : ''
                          }`
                        }
                        disabled
                      />

                    </div>


                    <div className="incidencia-campo">

                      <label>
                        Tipo
                      </label>

                      <input
                        type="text"
                        value="Correctivo"
                        disabled
                      />

                    </div>


                    <div className="incidencia-campo">

                      <label>
                        Responsable *
                      </label>

                      <select
                        value={formOrden.responsableId}
                        onChange={(e) =>
                          setFormOrden({
                            ...formOrden,
                            responsableId:
                              e.target.value
                          })
                        }
                        required
                      >

                        <option value="">
                          Seleccionar responsable
                        </option>

                        {responsables.map(
                          (responsable) => (

                            <option
                              key={responsable.id}
                              value={responsable.id}
                            >
                              {responsable.nombres}{' '}
                              {responsable.apellidos}
                              {' - '}
                              {responsable.rol}
                            </option>

                          )
                        )}

                      </select>

                    </div>


                    <div className="incidencia-campo">

                      <label>
                        Fecha estimada de fin
                      </label>

                      <input
                        type="datetime-local"
                        value={
                          formOrden.fechaEstimadaFin
                        }
                        onChange={(e) =>
                          setFormOrden({
                            ...formOrden,
                            fechaEstimadaFin:
                              e.target.value
                          })
                        }
                      />

                    </div>

                  </div>


                  {errorOrden && (

                    <p className="incidencia-form-error">
                      {errorOrden}
                    </p>

                  )}


                  <div className="incidencia-form-acciones">

                    <button
                      type="button"
                      className="btn-cancelar-incidencia"
                      disabled={generandoOrden}
                      onClick={() =>
                        setMostrarGenerarOrden(false)
                      }
                    >
                      Cancelar
                    </button>


                    <button
                      type="submit"
                      className="btn-guardar-incidencia"
                      disabled={generandoOrden}
                    >
                      {generandoOrden
                        ? 'Generando...'
                        : 'Generar orden'}
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

export default IncidenciaDetallePage