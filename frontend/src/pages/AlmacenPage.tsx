import {
  useEffect,
  useState
} from 'react'

import type {
  AlmacenExistencia,
  MovimientoRepuesto,
} from '../types/Almacen'

import {
  listarExistencias,
  listarMovimientos,
  registrarEntrada,
  registrarAjuste,
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

  const [tab, setTab] =
    useState<'REPUESTOS' | 'MOVIMIENTOS'>(
      'REPUESTOS'
    )

  const [movimientos, setMovimientos] =
    useState<MovimientoRepuesto[]>([])

  const [tipoMovimiento, setTipoMovimiento] =
    useState('TODOS')

  const [fechaDesde, setFechaDesde] =
    useState('')

  const [fechaHasta, setFechaHasta] =
    useState('')

  const [modalEntrada, setModalEntrada] =
    useState(false)

  const [guardandoEntrada, setGuardandoEntrada] =
    useState(false)

  const [mensajeEntrada, setMensajeEntrada] =
    useState('')

  const [formEntrada, setFormEntrada] =
    useState({
      repuestoId: '',
      almacenId: '1',
      cantidad: '',
      precioUnitario: '',
      proveedorId: '',
      motivo: ''
    })

  const [recarga, setRecarga] =
    useState(0)

  const [modalAjuste, setModalAjuste] =
    useState(false)

  const [guardandoAjuste, setGuardandoAjuste] =
    useState(false)

  const [mensajeAjuste, setMensajeAjuste] =
    useState('')

  const [formAjuste, setFormAjuste] =
    useState({
      repuestoId: '',
      almacenId: '1',
      tipo: 'AJUSTE_POSITIVO',
      cantidad: '',
      motivo: ''
    })

  useEffect(() => {

    const controller =
      new AbortController()

    const cargar = async () => {

      try {

        setCargando(true)
        setError('')

        if (tab === 'REPUESTOS') {

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

        } else {

          const data =
            await listarMovimientos(
              pagina,
              undefined,
              undefined,
              tipoMovimiento,
              fechaDesde,
              fechaHasta,
              controller.signal
            )

          if (controller.signal.aborted) {
            return
          }

          setMovimientos(
            data.registros
          )

          setTotalPaginas(
            data.totalPaginas
          )

          setTotalRegistros(
            data.totalRegistros
          )
        }

      } catch (error) {

        if (controller.signal.aborted) {
          return
        }

        console.error(error)

        setError(
          'No se pudo cargar el almacén'
        )

      } finally {

        if (!controller.signal.aborted) {
          setCargando(false)
        }

      }
    }

    cargar()

    return () =>
      controller.abort()

  }, [
    tab,
    pagina,
    busqueda,
    estadoStock,
    tipoMovimiento,
    fechaDesde,
    fechaHasta,
    recarga
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

  const guardarEntrada = async () => {

    try {

      setMensajeEntrada('')

      if (!formEntrada.repuestoId) {
        setMensajeEntrada(
          'Selecciona un repuesto'
        )
        return
      }

      if (
        !formEntrada.cantidad ||
        Number(formEntrada.cantidad) <= 0
      ) {
        setMensajeEntrada(
          'La cantidad debe ser mayor a cero'
        )
        return
      }

      if (
        formEntrada.precioUnitario === '' ||
        Number(formEntrada.precioUnitario) < 0
      ) {
        setMensajeEntrada(
          'Ingresa un precio válido'
        )
        return
      }

      if (!formEntrada.motivo.trim()) {
        setMensajeEntrada(
          'El motivo es obligatorio'
        )
        return
      }


      setGuardandoEntrada(true)


      await registrarEntrada({
        repuestoId:
          Number(formEntrada.repuestoId),

        almacenId:
          Number(formEntrada.almacenId),

        cantidad:
          Number(formEntrada.cantidad),

        precioUnitario:
          Number(formEntrada.precioUnitario),

        proveedorId:
          formEntrada.proveedorId
            ? Number(formEntrada.proveedorId)
            : null,

        motivo:
          formEntrada.motivo.trim()
      })


      setModalEntrada(false)

      setFormEntrada({
        repuestoId: '',
        almacenId: '1',
        cantidad: '',
        precioUnitario: '',
        proveedorId: '',
        motivo: ''
      })


      setRecarga(r => r + 1)

    } catch (error) {

      console.error(error)

      setMensajeEntrada(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar la entrada'
      )

    } finally {

      setGuardandoEntrada(false)
    }
  }

  const guardarAjuste = async () => {

    try {
      setMensajeAjuste('')

      if (!formAjuste.repuestoId) {
        setMensajeAjuste(
          'Selecciona un repuesto'
        )
        return
      }

      if (
        !formAjuste.cantidad ||
        Number(formAjuste.cantidad) <= 0
      ) {
        setMensajeAjuste(
          'La cantidad debe ser mayor a cero'
        )
        return
      }

      if (!formAjuste.motivo.trim()) {
        setMensajeAjuste(
          'El motivo es obligatorio'
        )
        return
      }

      setGuardandoAjuste(true)

      await registrarAjuste({
        repuestoId:
          Number(formAjuste.repuestoId),

        almacenId:
          Number(formAjuste.almacenId),

        tipo:
          formAjuste.tipo as
          | 'AJUSTE_POSITIVO'
          | 'AJUSTE_NEGATIVO',

        cantidad:
          Number(formAjuste.cantidad),

        motivo:
          formAjuste.motivo.trim()
      })

      setModalAjuste(false)

      setFormAjuste({
        repuestoId: '',
        almacenId: '1',
        tipo: 'AJUSTE_POSITIVO',
        cantidad: '',
        motivo: ''
      })

      setRecarga(r => r + 1)

    } catch (error) {

      console.error(error)

      setMensajeAjuste(
        error instanceof Error
          ? error.message
          : 'No se pudo realizar el ajuste'
      )

    } finally {
      setGuardandoAjuste(false)
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

        <div className="almacen-header-acciones">

          <button
            type="button"
            className="almacen-btn-secundario"
            onClick={() => {
              setMensajeAjuste('')
              setModalAjuste(true)
            }}
          >
            Ajustar stock
          </button>

          <button
            type="button"
            className="almacen-btn-principal"
            onClick={() => {
              setMensajeEntrada('')
              setModalEntrada(true)
            }}
          >
            + Registrar entrada
          </button>

        </div>
      </div>

      <div className="almacen-tabs">
        <button
          type="button"
          className={
            tab === 'REPUESTOS'
              ? 'almacen-tab activo'
              : 'almacen-tab'
          }
          onClick={() => {
            setTab('REPUESTOS')
            setPagina(0)
          }}
        >
          Repuestos
        </button>

        <button
          type="button"
          className={
            tab === 'MOVIMIENTOS'
              ? 'almacen-tab activo'
              : 'almacen-tab'
          }
          onClick={() => {
            setTab('MOVIMIENTOS')
            setPagina(0)
          }}
        >
          Movimientos
        </button>
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


      {tab === 'REPUESTOS' && (
        <div className="almacen-filtros">
          <input
            type="text"
            placeholder="Buscar por código o repuesto..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(0)
            }}
          />

          <select
            value={estadoStock}
            onChange={(e) => {
              setEstadoStock(e.target.value)
              setPagina(0)
            }}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="NORMAL">Normal</option>
            <option value="BAJO">Stock bajo</option>
            <option value="SIN_STOCK">Sin stock</option>
          </select>
        </div>
      )}

      {tab === 'MOVIMIENTOS' && (
        <div className="almacen-filtros">
          <select
            value={tipoMovimiento}
            onChange={(e) => {
              setTipoMovimiento(e.target.value)
              setPagina(0)
            }}
          >
            <option value="TODOS">Todos los movimientos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="DEVOLUCION">Devolución</option>
            <option value="AJUSTE_POSITIVO">Ajuste positivo</option>
            <option value="AJUSTE_NEGATIVO">Ajuste negativo</option>
          </select>

          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value)
              setPagina(0)
            }}
          />

          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => {
              setFechaHasta(e.target.value)
              setPagina(0)
            }}
          />
        </div>
      )}

      {tab === 'REPUESTOS' && (
        <>

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
        </>
      )}


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

      {modalEntrada && (

        <div
          className="almacen-modal-overlay"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {
              setModalEntrada(false)
            }
          }}
        >

          <div className="almacen-modal">

            <div className="almacen-modal-header">

              <div>
                <h2>
                  Registrar entrada
                </h2>

                <p>
                  Ingresa stock de repuestos
                  al almacén.
                </p>
              </div>


              <button
                type="button"
                className="almacen-modal-cerrar"
                onClick={() =>
                  setModalEntrada(false)
                }
              >
                ×
              </button>

            </div>


            <div className="almacen-modal-body">

              {mensajeEntrada && (

                <div className="almacen-modal-error">
                  {mensajeEntrada}
                </div>

              )}


              <div className="almacen-form-campo">

                <label>
                  Repuesto *
                </label>

                <select
                  value={
                    formEntrada.repuestoId
                  }
                  onChange={(e) =>
                    setFormEntrada({
                      ...formEntrada,
                      repuestoId:
                        e.target.value
                    })
                  }
                >

                  <option value="">
                    Selecciona un repuesto
                  </option>


                  {registros.map(
                    registro => (

                      <option
                        key={
                          registro.repuestoId
                        }
                        value={
                          registro.repuestoId
                        }
                      >
                        {registro.codigo}
                        {' - '}
                        {registro.nombre}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="almacen-form-campo">

                <label>
                  Almacén
                </label>

                <select
                  value={
                    formEntrada.almacenId
                  }
                  onChange={(e) =>
                    setFormEntrada({
                      ...formEntrada,
                      almacenId:
                        e.target.value
                    })
                  }
                >

                  <option value="1">
                    Principal
                  </option>

                </select>

              </div>


              <div className="almacen-form-grid">

                <div className="almacen-form-campo">

                  <label>
                    Cantidad *
                  </label>

                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={
                      formEntrada.cantidad
                    }
                    onChange={(e) =>
                      setFormEntrada({
                        ...formEntrada,
                        cantidad:
                          e.target.value
                      })
                    }
                    placeholder="0"
                  />

                </div>


                <div className="almacen-form-campo">

                  <label>
                    Precio unitario *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      formEntrada.precioUnitario
                    }
                    onChange={(e) =>
                      setFormEntrada({
                        ...formEntrada,
                        precioUnitario:
                          e.target.value
                      })
                    }
                    placeholder="0.00"
                  />

                </div>

              </div>


              <div className="almacen-form-campo">

                <label>
                  Proveedor ID
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    formEntrada.proveedorId
                  }
                  onChange={(e) =>
                    setFormEntrada({
                      ...formEntrada,
                      proveedorId:
                        e.target.value
                    })
                  }
                  placeholder="Opcional"
                />

              </div>


              <div className="almacen-form-campo">

                <label>
                  Motivo *
                </label>

                <textarea
                  rows={3}
                  value={
                    formEntrada.motivo
                  }
                  onChange={(e) =>
                    setFormEntrada({
                      ...formEntrada,
                      motivo:
                        e.target.value
                    })
                  }
                  placeholder="Ej. Compra y reposición de stock"
                />

              </div>

            </div>


            <div className="almacen-modal-footer">

              <button
                type="button"
                className="almacen-btn-secundario"
                disabled={
                  guardandoEntrada
                }
                onClick={() =>
                  setModalEntrada(false)
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="almacen-btn-principal"
                disabled={
                  guardandoEntrada
                }
                onClick={
                  guardarEntrada
                }
              >
                {guardandoEntrada
                  ? 'Registrando...'
                  : 'Registrar entrada'
                }
              </button>

            </div>

          </div>

        </div>

      )}

      {modalAjuste && (

        <div
          className="almacen-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setModalAjuste(false)
            }
          }}
        >

          <div className="almacen-modal">

            <div className="almacen-modal-header">

              <div>
                <h2>Ajustar inventario</h2>

                <p>
                  Corrige diferencias entre
                  el stock físico y el sistema.
                </p>
              </div>

              <button
                type="button"
                className="almacen-modal-cerrar"
                onClick={() =>
                  setModalAjuste(false)
                }
              >
                ×
              </button>

            </div>


            <div className="almacen-modal-body">

              {mensajeAjuste && (
                <div className="almacen-modal-error">
                  {mensajeAjuste}
                </div>
              )}


              <div className="almacen-form-campo">

                <label>Repuesto *</label>

                <select
                  value={formAjuste.repuestoId}
                  onChange={(e) =>
                    setFormAjuste({
                      ...formAjuste,
                      repuestoId: e.target.value
                    })
                  }
                >

                  <option value="">
                    Selecciona un repuesto
                  </option>

                  {registros.map(registro => (
                    <option
                      key={registro.repuestoId}
                      value={registro.repuestoId}
                    >
                      {registro.codigo}
                      {' - '}
                      {registro.nombre}
                      {' - Stock: '}
                      {registro.cantidad}
                    </option>
                  ))}

                </select>

              </div>


              <div className="almacen-form-campo">

                <label>Tipo de ajuste *</label>

                <select
                  value={formAjuste.tipo}
                  onChange={(e) =>
                    setFormAjuste({
                      ...formAjuste,
                      tipo: e.target.value
                    })
                  }
                >
                  <option value="AJUSTE_POSITIVO">
                    Ajuste positivo
                  </option>

                  <option value="AJUSTE_NEGATIVO">
                    Ajuste negativo
                  </option>
                </select>

              </div>


              <div className="almacen-form-campo">

                <label>Cantidad *</label>

                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={formAjuste.cantidad}
                  onChange={(e) =>
                    setFormAjuste({
                      ...formAjuste,
                      cantidad: e.target.value
                    })
                  }
                  placeholder="0"
                />

              </div>


              <div className="almacen-form-campo">

                <label>Motivo *</label>

                <textarea
                  rows={3}
                  value={formAjuste.motivo}
                  onChange={(e) =>
                    setFormAjuste({
                      ...formAjuste,
                      motivo: e.target.value
                    })
                  }
                  placeholder={
                    formAjuste.tipo === 'AJUSTE_NEGATIVO'
                      ? 'Ej. Diferencia encontrada en conteo físico'
                      : 'Ej. Unidades encontradas durante inventario'
                  }
                />

              </div>


              {formAjuste.tipo === 'AJUSTE_NEGATIVO' && (
                <div className="almacen-ajuste-advertencia">
                  El ajuste negativo reducirá el stock disponible.
                  El sistema impedirá dejar el inventario por debajo de cero.
                </div>
              )}

            </div>


            <div className="almacen-modal-footer">

              <button
                type="button"
                className="almacen-btn-secundario"
                disabled={guardandoAjuste}
                onClick={() =>
                  setModalAjuste(false)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="almacen-btn-principal"
                disabled={guardandoAjuste}
                onClick={guardarAjuste}
              >
                {guardandoAjuste
                  ? 'Guardando...'
                  : 'Confirmar ajuste'
                }
              </button>

            </div>

          </div>

        </div>
      )}

    </div>

  )
}

export default AlmacenPage