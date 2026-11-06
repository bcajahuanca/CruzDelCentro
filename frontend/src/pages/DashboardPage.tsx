import {
  useEffect,
  useState
} from 'react'

import {
  BusFront,
  CircleCheck,
  Wrench,
  TriangleAlert,
  Siren,
  ClipboardList,
  BadgeCheck,
  CalendarClock
} from 'lucide-react'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'

import type {
  DashboardProximoMantenimiento,
  DashboardResumen,
  DashboardSituacion,
  DashboardTendenciaMantenimiento,
  DashboardUnidadAtencion
} from '../types/Dashboard'

import {
  obtenerProximosMantenimientos,
  obtenerResumenDashboard,
  obtenerSituacionDashboard,
  obtenerTendenciaMantenimientos,
  obtenerUnidadesAtencion
} from '../services/dashboardService'

import '../styles/dashboard.css'


function DashboardPage() {

  const [resumen, setResumen] =
    useState<DashboardResumen | null>(
      null
    )

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')

  const [situacion, setSituacion] =
    useState<DashboardSituacion | null>(
      null
    )

  const [
    unidadesAtencion,
    setUnidadesAtencion
  ] = useState<DashboardUnidadAtencion[]>([])

  const [
    proximosMantenimientos,
    setProximosMantenimientos
  ] = useState<DashboardProximoMantenimiento[]>([])

  const [
    tendenciaMantenimientos,
    setTendenciaMantenimientos
  ] = useState<DashboardTendenciaMantenimiento[]>([])

  useEffect(() => {

    const controller =
      new AbortController()

    const cargar = async () => {

      try {

        setCargando(true)
        setError('')

        const [
          dataResumen,
          dataSituacion,
          dataUnidadesAtencion,
          dataProximosMantenimientos,
          dataTendencia,
        ] = await Promise.all([
          obtenerResumenDashboard(
            controller.signal
          ),
          obtenerSituacionDashboard(
            controller.signal
          ),
          obtenerUnidadesAtencion(
            controller.signal
          ),
          obtenerProximosMantenimientos(
            controller.signal
          ),
          obtenerTendenciaMantenimientos(
            controller.signal
          )
        ])

        if (
          controller.signal.aborted
        ) {
          return
        }

        setResumen(dataResumen),
          setSituacion(dataSituacion),
          setUnidadesAtencion(dataUnidadesAtencion),
          setProximosMantenimientos(dataProximosMantenimientos),
          setTendenciaMantenimientos(dataTendencia)

      } catch (error) {

        if (
          controller.signal.aborted
        ) {
          return
        }

        console.error(error)

        setError(
          'No se pudo cargar el dashboard'
        )

      } finally {

        if (
          !controller.signal.aborted
        ) {
          setCargando(false)
        }

      }

    }

    cargar()

    return () =>
      controller.abort()

  }, [])

  const datosTendencia =
    tendenciaMantenimientos.map(
      item => {

        const [anio, mes] =
          item.mes.split('-')

        const fecha =
          new Date(
            Number(anio),
            Number(mes) - 1,
            1
          )

        return {
          ...item,

          nombreMes:
            new Intl.DateTimeFormat(
              'es-PE',
              {
                month: 'short'
              }
            ).format(fecha)
        }
      }
    )

  if (cargando) {

    return (
      <div className="page-container">
        Cargando dashboard...
      </div>
    )
  }


  if (error || !resumen) {

    return (
      <div className="page-container">

        <div className="dashboard-error">
          {error ||
            'No se pudo cargar la información'}
        </div>

      </div>
    )
  }

  if (cargando) {
    return (
      <div className="page-container">
        Cargando dashboard...
      </div>
    )
  }

  if (error || !resumen || !situacion) {
    return (
      <div className="page-container">
        <div className="dashboard-error">
          {error || 'No se pudo cargar la información'}
        </div>
      </div>
    )
  }

  const datosGrafico =
    resumen.distribucionEstados.map(
      item => ({
        ...item,

        nombre:
          item.estado === 'OPERATIVA'
            ? 'Operativas'

            : item.estado ===
              'EN_MANTENIMIENTO'
              ? 'En mantenimiento'
              : 'Fuera de servicio'
      })
    )

  return (

    <div className="page-container">

      <div className="dashboard-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Resumen operativo de la
            flota de Cruz del Centro.
          </p>

        </div>

      </div>


      <div className="dashboard-kpis">

        <div className="dashboard-kpi">

          <div className="dashboard-kpi-icon">
            <BusFront size={22} />
          </div>

          <div>
            <span>
              Total de unidades
            </span>

            <strong>
              {resumen.totalUnidades}
            </strong>
          </div>

        </div>


        <div className="dashboard-kpi">

          <div className="dashboard-kpi-icon">
            <CircleCheck size={22} />
          </div>

          <div>
            <span>
              Operativas
            </span>

            <strong>
              {resumen.operativas}
            </strong>
          </div>

        </div>


        <div className="dashboard-kpi">

          <div className="dashboard-kpi-icon">
            <Wrench size={22} />
          </div>

          <div>
            <span>
              En mantenimiento
            </span>

            <strong>
              {resumen.enMantenimiento}
            </strong>
          </div>

        </div>


        <div className="dashboard-kpi">

          <div className="dashboard-kpi-icon">
            <TriangleAlert size={22} />
          </div>

          <div>
            <span>
              Fuera de servicio
            </span>

            <strong>
              {resumen.fueraServicio}
            </strong>
          </div>

        </div>

      </div>

      <div className="dashboard-seccion-header">
        <div>
          <h2>Situación operativa</h2>
          <p>
            Pendientes que requieren seguimiento
            del área de mantenimiento.
          </p>
        </div>
      </div>

      <div className="dashboard-kpis dashboard-kpis-secundarios">

        <div className="dashboard-kpi">
          <div className="dashboard-kpi-icon">
            <Siren size={22} />
          </div>

          <div>
            <span>
              Incidencias abiertas
            </span>

            <strong>
              {situacion.incidenciasAbiertas}
            </strong>
          </div>
        </div>


        <div className="dashboard-kpi">
          <div className="dashboard-kpi-icon">
            <ClipboardList size={22} />
          </div>

          <div>
            <span>
              OT activas
            </span>

            <strong>
              {situacion.ordenesActivas}
            </strong>
          </div>
        </div>


        <div className="dashboard-kpi">
          <div className="dashboard-kpi-icon">
            <CalendarClock size={22} />
          </div>

          <div>
            <span>
              Mantenimientos pendientes
            </span>

            <strong>
              {situacion.mantenimientosPendientes}
            </strong>
          </div>
        </div>


        <div className="dashboard-kpi">
          <div className="dashboard-kpi-icon">
            <BadgeCheck size={22} />
          </div>

          <div>
            <span>
              Pendientes de validación
            </span>

            <strong>
              {situacion.pendientesValidacion}
            </strong>
          </div>
        </div>

      </div>


      <div className="dashboard-grid">

        <div className="dashboard-card">

          <div className="dashboard-card-header">
            <h2>Estado de la flota</h2>
            <p>
              Distribución actual de unidades.
            </p>
          </div>

          <div className="dashboard-grafico">

            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <PieChart>

                <Pie
                  data={datosGrafico}
                  dataKey="cantidad"
                  nameKey="nombre"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {datosGrafico.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        className={`sector-${index}`}
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

            <div className="dashboard-disponibilidad">
              <span>Disponibilidad</span>

              <strong>
                {resumen.porcentajeDisponibilidad}%
              </strong>
            </div>

          </div>

          <div className="dashboard-leyenda">

            {datosGrafico.map(
              (item) => (

                <div
                  key={item.estado}
                  className="dashboard-leyenda-item"
                >
                  <span
                    className={`dashboard-dot ${item.estado.toLowerCase()
                      }`}
                  />

                  <span>
                    {item.nombre}
                  </span>

                  <strong>
                    {item.cantidad}
                  </strong>

                </div>

              )
            )}

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Disponibilidad de flota
              </h2>

              <p>
                Porcentaje de unidades
                actualmente operativas.
              </p>
            </div>

          </div>


          <div className="dashboard-disponibilidad-grande">

            <strong>
              {
                resumen
                  .porcentajeDisponibilidad
              }%
            </strong>

            <span>
              {
                resumen.operativas
              } de {
                resumen.totalUnidades
              } unidades disponibles
            </span>

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-card-header">
            <div>
              <h2>
                Unidades que requieren atención
              </h2>

              <p>
                Flota con incidencias u órdenes
                activas.
              </p>
            </div>
          </div>


          <div className="dashboard-atencion-lista">

            {unidadesAtencion.map(
              unidad => (

                <div
                  key={unidad.unidadId}
                  className="dashboard-atencion-item"
                >

                  <div className="dashboard-atencion-unidad">

                    <strong>
                      PAD {unidad.codigo}
                    </strong>

                    <span>
                      {unidad.placa || '-'}
                    </span>

                  </div>


                  <div className="dashboard-atencion-info">

                    <span
                      className={`dashboard-estado ${unidad.estadoOperativo.toLowerCase()}`}
                    >
                      {unidad.estadoOperativo
                        .replaceAll('_', ' ')
                      }
                    </span>

                    <p>
                      {unidad.situacion}
                    </p>

                    {unidad.codigoOrden && (
                      <small>
                        {unidad.codigoOrden}
                      </small>
                    )}

                    {!unidad.codigoOrden &&
                      unidad.codigoIncidencia && (
                        <small>
                          {unidad.codigoIncidencia}
                        </small>
                      )}

                  </div>

                </div>

              )
            )}


            {unidadesAtencion.length === 0 && (
              <div className="dashboard-sin-datos">
                No hay unidades que requieran atención.
              </div>
            )}

          </div>

        </div>

        <div className="dashboard-card">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Próximos mantenimientos
              </h2>

              <p>
                Intervenciones programadas
                próximas a ejecutarse.
              </p>
            </div>

          </div>


          <div className="dashboard-proximos-lista">

            {proximosMantenimientos.map(
              mantenimiento => (

                <div
                  key={
                    mantenimiento.programacionId
                  }
                  className="dashboard-proximo-item"
                >

                  <div className="dashboard-proximo-unidad">

                    <strong>
                      PAD {mantenimiento.codigo}
                    </strong>

                    <span>
                      {mantenimiento.placa || '-'}
                    </span>

                  </div>


                  <div className="dashboard-proximo-info">

                    <span>
                      {mantenimiento.tipo}
                    </span>

                    <small>
                      {mantenimiento.descripcion ||
                        'Sin descripción'}
                    </small>

                    {mantenimiento.fechaVencimiento && (
                      <small>
                        Vence:{' '}
                        {new Date(
                          `${mantenimiento.fechaVencimiento}T00:00:00`
                        ).toLocaleDateString(
                          'es-PE'
                        )}
                      </small>
                    )}

                    {mantenimiento.situacion && (
                      <small>
                        {mantenimiento.situacion}
                      </small>
                    )}

                  </div>

                </div>

              )
            )}

            {proximosMantenimientos.length === 0 && (
              <div className="dashboard-sin-datos">
                No hay mantenimientos próximos.
              </div>
            )}

          </div>

        </div>

        <div className="dashboard-card dashboard-card-tendencia">

          <div className="dashboard-card-header">

            <div>
              <h2>
                Tendencia de mantenimientos
              </h2>

              <p>
                Comparación de órdenes preventivas
                y correctivas cerradas.
              </p>
            </div>

          </div>


          <div className="dashboard-chart-container">

            <ResponsiveContainer
              width="100%"
              height={300}
            >

              <BarChart
                data={datosTendencia}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="nombreMes"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="preventivos"
                  name="Preventivos"
                  fill="#12b76a"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="correctivos"
                  name="Correctivos"
                  fill="#f79009"
                  radius={[5, 5, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

    </div>

  )
}

export default DashboardPage