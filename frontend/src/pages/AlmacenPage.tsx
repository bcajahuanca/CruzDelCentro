import {
  useEffect,
  useState
} from 'react'

import type {
  AlmacenExistencia
} from '../types/Almacen'

import {
  listarExistencias
} from '../services/almacenService'

import '../styles/almacen.css'

function AlmacenPage() {

  const [registros, setRegistros] =
    useState<AlmacenExistencia[]>([])

  const [busqueda, setBusqueda] =
    useState('')

  const [estadoStock, setEstadoStock] =
    useState('TODOS')

  const [pagina, setPagina] =
    useState(0)

  const [totalPaginas, setTotalPaginas] =
    useState(0)

  const [totalRegistros, setTotalRegistros] =
    useState(0)

  const [totalRepuestos, setTotalRepuestos] =
    useState(0)

  const [stockBajo, setStockBajo] =
    useState(0)

  const [sinStock, setSinStock] =
    useState(0)

  const [
    movimientos30Dias,
    setMovimientos30Dias
  ] = useState(0)

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')


  useEffect(() => {

    const controller =
      new AbortController()

    const cargar = async () => {

      try {

        setCargando(true)
        setError('')

        const data =
          await listarExistencias(
            pagina,
            busqueda,
            undefined,
            estadoStock,
            controller.signal
          )

        if (controller.signal.aborted) {
          return
        }

        setRegistros(
          data.registros
        )

        setTotalPaginas(
          data.totalPaginas
        )

        setTotalRegistros(
          data.totalRegistros
        )

        setTotalRepuestos(
          data.totalRepuestos
        )

        setStockBajo(
          data.stockBajo
        )

        setSinStock(
          data.sinStock
        )

        setMovimientos30Dias(
          data.movimientos30Dias
        )

      } catch (error) {

        if (
          controller.signal.aborted
        ) return

        console.error(error)

        setError(
          'No se pudo cargar el almacén'
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

  }, [
    pagina,
    busqueda,
    estadoStock
  ])


  const mostrarEstado = (
    estado: string
  ) => {

    switch (estado) {

      case 'NORMAL':
        return 'Normal'

      case 'BAJO':
        return 'Stock bajo'

      case 'SIN_STOCK':
        return 'Sin stock'

      default:
        return estado
    }
  }


  return (

    <div className="page-container">

      <div className="almacen-header">

        <div>
          <h1>Almacén</h1>

          <p>
            Consulta existencias,
            niveles de stock y
            movimientos de repuestos.
          </p>
        </div>

      </div>


      {error && (
        <p className="almacen-error">
          {error}
        </p>
      )}


      <div className="almacen-resumen">

        <div>
          <span>
            Repuestos registrados
          </span>

          <strong>
            {totalRepuestos}
          </strong>
        </div>

        <div>
          <span>
            Stock bajo
          </span>

          <strong>
            {stockBajo}
          </strong>
        </div>

        <div>
          <span>
            Sin stock
          </span>

          <strong>
            {sinStock}
          </strong>
        </div>

        <div>
          <span>
            Movimientos últimos 30 días
          </span>

          <strong>
            {movimientos30Dias}
          </strong>
        </div>

      </div>


      <div className="almacen-filtros">

        <input
          type="text"
          placeholder="Buscar por código o repuesto..."
          value={busqueda}
          onChange={(e) => {

            setBusqueda(
              e.target.value
            )

            setPagina(0)
          }}
        />

        <select
          value={estadoStock}
          onChange={(e) => {

            setEstadoStock(
              e.target.value
            )

            setPagina(0)
          }}
        >
          <option value="TODOS">
            Todos los estados
          </option>

          <option value="NORMAL">
            Normal
          </option>

          <option value="BAJO">
            Stock bajo
          </option>

          <option value="SIN_STOCK">
            Sin stock
          </option>
        </select>

      </div>


      <p className="almacen-resultados">
        Mostrando {registros.length}
        {' '}de {totalRegistros}
        {' '}registros
      </p>


      <div className="almacen-tabla-wrapper">

        <table className="almacen-tabla">

          <thead>
            <tr>
              <th>Código</th>
              <th>Repuesto</th>
              <th>Almacén</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Unidad</th>
              <th>Estado</th>
            </tr>
          </thead>


          <tbody>

            {registros.map(
              registro => (

                <tr
                  key={
                    `${registro.repuestoId}-${registro.almacenId}`
                  }
                >

                  <td className="almacen-codigo">
                    {registro.codigo}
                  </td>

                  <td>
                    {registro.nombre}
                  </td>

                  <td>
                    {registro.almacen}
                  </td>

                  <td>
                    {registro.cantidad}
                  </td>

                  <td>
                    {registro.stockMinimo}
                  </td>

                  <td>
                    {registro.unidadMedida}
                  </td>

                  <td>

                    <span
                      className={
                        `almacen-badge ${registro.estadoStock.toLowerCase()}`
                      }
                    >
                      {mostrarEstado(
                        registro.estadoStock
                      )}
                    </span>

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>


        {!cargando &&
          registros.length === 0 && (

          <p className="almacen-vacio">
            No se encontraron repuestos.
          </p>

        )}

      </div>


      {!cargando &&
        totalPaginas > 1 && (

        <div className="almacen-paginacion">

          <button
            disabled={pagina === 0}
            onClick={() =>
              setPagina(
                p => p - 1
              )
            }
          >
            ← Anterior
          </button>


          {Array.from(
            {
              length:
                totalPaginas
            },
            (_, i) => i
          ).map(numero => (

            <button
              key={numero}
              className={
                pagina === numero
                  ? 'pagina-activa'
                  : ''
              }
              onClick={() =>
                setPagina(numero)
              }
            >
              {numero + 1}
            </button>

          ))}


          <button
            disabled={
              pagina >=
              totalPaginas - 1
            }
            onClick={() =>
              setPagina(
                p => p + 1
              )
            }
          >
            Siguiente →
          </button>

        </div>

      )}


      {cargando && (
        <p className="almacen-vacio">
          Cargando almacén...
        </p>
      )}

    </div>

  )
}

export default AlmacenPage