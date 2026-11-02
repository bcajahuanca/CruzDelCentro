import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import type {
  Mantenimiento
} from '../types/Mantenimiento'

import '../styles/calendarioMantenimiento.css'


interface Props {
  mantenimientos: Mantenimiento[]
}


function CalendarioMantenimiento({
  mantenimientos
}: Props) {

  const navigate = useNavigate()

  const hoy = new Date()

  const [
    fechaActual,
    setFechaActual
  ] = useState(
    new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    )
  )


  const anio =
    fechaActual.getFullYear()

  const mes =
    fechaActual.getMonth()


  const nombreMes =
    fechaActual.toLocaleDateString(
      'es-PE',
      {
        month: 'long',
        year: 'numeric'
      }
    )


  const diasCalendario =
    useMemo(() => {

      const primerDia =
        new Date(
          anio,
          mes,
          1
        )

      const ultimoDia =
        new Date(
          anio,
          mes + 1,
          0
        )


      /*
       * getDay():
       * 0 domingo
       * 1 lunes
       * ...
       *
       * Queremos lunes como primer día.
       */

      const desplazamiento =
        primerDia.getDay() === 0
          ? 6
          : primerDia.getDay() - 1


      const totalDias =
        ultimoDia.getDate()


      const dias: Array<
        number | null
      > = []


      for (
        let i = 0;
        i < desplazamiento;
        i++
      ) {
        dias.push(null)
      }


      for (
        let dia = 1;
        dia <= totalDias;
        dia++
      ) {
        dias.push(dia)
      }


      while (
        dias.length % 7 !== 0
      ) {
        dias.push(null)
      }


      return dias

    }, [anio, mes])

    const obtenerFechaCalendario = (
    mantenimiento: Mantenimiento
    ) => {

    if (mantenimiento.inicioProgramado) {
        return mantenimiento.inicioProgramado
        .split('T')[0]
    }

    return mantenimiento.fechaVencimiento
    }

  const mantenimientosPorDia =
    (
      dia: number
    ) => {

      const fecha =
        `${anio}-${String(
          mes + 1
        ).padStart(2, '0')}-${String(
          dia
        ).padStart(2, '0')}`


      return mantenimientos.filter(
        mantenimiento =>
          obtenerFechaCalendario(
            mantenimiento
          ) === fecha
      )
    }


  const mesAnterior = () => {

    setFechaActual(
      new Date(
        anio,
        mes - 1,
        1
      )
    )
  }


  const mesSiguiente = () => {

    setFechaActual(
      new Date(
        anio,
        mes + 1,
        1
      )
    )
  }


  const volverHoy = () => {

    const ahora =
      new Date()

    setFechaActual(
      new Date(
        ahora.getFullYear(),
        ahora.getMonth(),
        1
      )
    )
  }


  const esHoy = (
    dia: number
  ) => {

    return (
      dia === hoy.getDate() &&
      mes === hoy.getMonth() &&
      anio === hoy.getFullYear()
    )
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

  const mostrarHora = (
    fechaHora: string | null
    ) => {

    if (!fechaHora) {
        return null
    }

    const hora =
        fechaHora.split('T')[1]

    if (!hora) {
        return null
    }

    return hora.slice(0, 5)
    }

   const mostrarHorario = (
    inicio: string | null,
    fin: string | null
    ) => {

    const horaInicio =
        mostrarHora(inicio)

    const horaFin =
        mostrarHora(fin)

    if (
        horaInicio &&
        horaFin
    ) {
        return `${horaInicio} - ${horaFin}`
    }

    if (horaInicio) {
        return horaInicio
    }

    return null
    }

  return (

    <div className="calendario-mantenimiento">


      {/* CABECERA */}

      <div className="calendario-header">

        <div>

          <h2>
            {nombreMes
              .charAt(0)
              .toUpperCase() +
              nombreMes.slice(1)}
          </h2>

          <p>
            Intervenciones programadas
            por fecha de vencimiento.
          </p>

        </div>


        <div className="calendario-controles">

          <button
            type="button"
            onClick={volverHoy}
          >
            Hoy
          </button>

          <button
            type="button"
            aria-label="Mes anterior"
            onClick={mesAnterior}
          >
            ←
          </button>

          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={mesSiguiente}
          >
            →
          </button>

        </div>

      </div>


      {/* DÍAS DE SEMANA */}

      <div className="calendario-semana">

        <div>Lun</div>
        <div>Mar</div>
        <div>Mié</div>
        <div>Jue</div>
        <div>Vie</div>
        <div>Sáb</div>
        <div>Dom</div>

      </div>


      {/* DÍAS */}

      <div className="calendario-grid">

        {diasCalendario.map(
          (dia, index) => {

            if (dia === null) {

              return (
                <div
                  key={`vacio-${index}`}
                  className="
                    calendario-dia
                    calendario-dia-vacio
                  "
                />
              )
            }


            const mantenimientosDia =
              mantenimientosPorDia(dia)


            return (

              <div
                key={dia}
                className={
                  `calendario-dia ${
                    esHoy(dia)
                      ? 'calendario-dia-hoy'
                      : ''
                  }`
                }
              >

                <div className="calendario-numero-dia">

                  <span>
                    {dia}
                  </span>

                  {mantenimientosDia.length >
                    0 && (

                    <small>
                      {
                        mantenimientosDia.length
                      }{' '}
                      mant.
                    </small>

                  )}

                </div>


                <div className="calendario-eventos">

                  {mantenimientosDia.map(
                    mantenimiento => (

                      <button
                        type="button"
                        key={mantenimiento.id}
                        className={
                            `calendario-evento ${
                            mantenimiento.situacion
                                .toLowerCase()
                            }`
                        }
                        onClick={() =>
                            navigate(
                            `/mantenimiento/${mantenimiento.id}`
                            )
                        }
                        >

                        {mostrarHorario(
                            mantenimiento.inicioProgramado,
                            mantenimiento.finProgramado
                        ) && (

                            <span className="calendario-evento-hora">
                            {mostrarHorario(
                                mantenimiento.inicioProgramado,
                                mantenimiento.finProgramado
                            )}
                            </span>

                        )}


                        <strong>
                            PAD {mantenimiento.unidadCodigo}
                        </strong>


                        <span>
                            {mantenimiento.tipo ===
                            'PREVENTIVO'
                            ? 'Preventivo'
                            : 'Correctivo'}
                        </span>


                        <small>
                            {mostrarSituacion(
                            mantenimiento.situacion
                            )}
                        </small>

                        </button>

                    )
                  )}

                </div>

              </div>
            )

          }
        )}

      </div>

    </div>
  )
}

export default CalendarioMantenimiento