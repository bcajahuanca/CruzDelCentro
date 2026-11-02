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

import {
  obtenerMantenimiento
} from '../services/mantemientoService'

import '../styles/mantenimientoDetalle.css'


function MantenimientoDetallePage() {

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

        <div className="detalle-acciones">

          <button
            type="button"
            className="btn-reprogramar"
          >
            Reprogramar
          </button>

          <button
            type="button"
            className="btn-cancelar-programacion"
          >
            Cancelar mantenimiento
          </button>

        </div>


      </div>

    </div>
  )
}

export default MantenimientoDetallePage