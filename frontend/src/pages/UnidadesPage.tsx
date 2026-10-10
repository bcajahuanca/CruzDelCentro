import { useEffect, useMemo, useState } from 'react'
import type { Unidad } from '../types/Unidad'
import type { UnidadDetalle } from '../types/UnidadDetalle'
import '../styles/unidades.css'
import {
  listarUnidades,
  obtenerUnidadPorId,
  actualizarUnidad
} from '../services/unidadService'

function UnidadesPage() {
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
    observaciones: ''
  })

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
        observaciones: data.observaciones ?? ''
      })

      setModoEdicion(false)
    } catch (err) {
      setError('Error al cargar el detalle de la unidad')
    } finally {
      setCargandoDetalle(false)
    }
  }

  const guardarCambios = async () => {
    if(!unidadSeleccionada) return

    try {

      const data = await actualizarUnidad(unidadSeleccionada.id, {
        placa: formEdicion.placa,
        tipoVehiculo: formEdicion.tipoVehiculo,
        anioFabricacion: formEdicion.anioFabricacion
          ? parseInt(formEdicion.anioFabricacion)
          : null,
        estado: formEdicion.estado,
        activo: formEdicion.activo,
        observaciones: formEdicion.observaciones
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

  if (cargando) {
    return <p>Cargando unidades...</p>
  }

  if (error) {
    return <p>{error}</p>
  }

  return (
    <div className="unidades-page">

      <div className="unidades-header">
        <div>
          <h1>Unidades</h1>
          <p>Consulta y administra las unidades registradas en la flota.</p>
        </div>

        <button className="btn-nueva-unidad">
          + Nueva unidad
        </button>
      </div>

      <div className="unidades-resumen">
        <div>
          <span>Total de unidades</span>
          <strong>{unidades.length}</strong>
        </div>

        <div>
          <span>Operativas</span>
          <strong>
            {unidades.filter((u) => u.estado === 'OPERATIVA').length}
          </strong>
        </div>

        <div>
          <span>En mantenimiento</span>
          <strong>
            {unidades.filter((u) => u.estado === 'EN_MANTENIMIENTO').length}
          </strong>
        </div>

        <div>
          <span>Fuera de servicio</span>
          <strong>
            {unidades.filter((u) => u.estado === 'FUERA_DE_SERVICIO').length}
          </strong>
        </div>
      </div>

      <div className="unidades-filtros">

        <input
          type="text"
          placeholder="Buscar por PAD, placa, marca o modelo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
        >
          <option value="TODOS">Todos los estados</option>
          <option value="OPERATIVA">Operativa</option>
          <option value="EN_MANTENIMIENTO">
            En mantenimiento
          </option>
          <option value="FUERA_DE_SERVICIO">
            Fuera de servicio
          </option>
        </select>

      </div>

      <div className="unidades-resultados">
        Mostrando {unidadesFiltradas.length} de {unidades.length} unidades
      </div>

      <div className="tabla-wrapper">

        <table className="unidades-table">

          <thead>
            <tr>
              <th>PAD</th>
              <th>Placa</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Tipo</th>
              <th>Año</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>

            {unidadesFiltradas.map((unidad) => (

              <tr key={unidad.id}>

                <td className="codigo-pad">
                  {unidad.codigo}
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

                <td>
                  <button 
                    className="btn-ver"
                    onClick={() => verDetalle(unidad.id)}
                  >
                    Ver
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
            className="modal-unidad"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Unidad {unidadSeleccionada.codigo}</h2>
                <p>{unidadSeleccionada.placa}</p>
              </div>

              <div className="modal-acciones">
                <button
                  className="btn-editar"
                  onClick={() => setModoEdicion(true)}
                >
                  Editar
                </button>

                <button
                  className="modal-cerrar"
                  onClick={() => setUnidadSeleccionada(null)}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="detalle-grid">
              {modoEdicion ? (
                <div className="form-edicion">

                  <div className="form-edicion-header">
                    <div>
                      <h3>Editar unidad</h3>
                      <p>Actualiza la información principal de la unidad.</p>
                    </div>
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
                      <span>Tipo de vehículo</span>
                      <input
                        type="text"
                        value={formEdicion.tipoVehiculo}
                        onChange={(e) =>
                          setFormEdicion({
                            ...formEdicion,
                            tipoVehiculo: e.target.value
                          })
                        }
                      />
                    </label>

                    <label className="campo-formulario">
                      <span>Año de fabricación</span>
                      <input
                        type="number"
                        value={formEdicion.anioFabricacion}
                        onChange={(e) =>
                          setFormEdicion({
                            ...formEdicion,
                            anioFabricacion: e.target.value
                          })
                        }
                      />
                    </label>

                    <label className="campo-formulario">
                      <span>Estado operativo</span>

                      <select
                        value={formEdicion.estado}
                        onChange={(e) =>
                          setFormEdicion({
                            ...formEdicion,
                            estado: e.target.value
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
                      placeholder="Agrega una observación sobre la unidad..."
                      value={formEdicion.observaciones}
                      onChange={(e) =>
                        setFormEdicion({
                          ...formEdicion,
                          observaciones: e.target.value
                        })
                      }
                    />
                  </label>

                  <div className="estado-activo">
                    <div>
                      <strong>Unidad activa</strong>
                      <p>
                        Indica si la unidad debe aparecer disponible dentro del sistema.
                      </p>
                    </div>

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={formEdicion.activo}
                        onChange={(e) =>
                          setFormEdicion({
                            ...formEdicion,
                            activo: e.target.checked
                          })
                        }
                      />

                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="acciones-edicion">

                    <button
                      className="btn-cancelar"
                      onClick={() => setModoEdicion(false)}
                    >
                      Cancelar
                    </button>

                    <button
                      className="btn-guardar"
                      onClick={guardarCambios}
                    >
                      Guardar cambios
                    </button>

                  </div>

                </div>
              ) : (
                <>
                  <div className="detalle-grid">

                    <div>
                      <span>PAD</span>
                      <strong>{unidadSeleccionada.codigo}</strong>
                    </div>

                    <div>
                      <span>Placa</span>
                      <strong>{unidadSeleccionada.placa}</strong>
                    </div>

                    <div>
                      <span>Marca</span>
                      <strong>{unidadSeleccionada.marca}</strong>
                    </div>

                    <div>
                      <span>Modelo</span>
                      <strong>{unidadSeleccionada.modelo}</strong>
                    </div>

                    <div>
                      <span>Tipo de vehículo</span>
                      <strong>{unidadSeleccionada.tipoVehiculo}</strong>
                    </div>

                    <div>
                      <span>Año</span>
                      <strong>
                        {unidadSeleccionada.anioFabricacion ?? 'Sin registrar'}
                      </strong>
                    </div>

                    <div>
                      <span>Estado</span>
                      <strong>
                        {unidadSeleccionada.estado === 'OPERATIVA' && 'Operativa'}
                        {unidadSeleccionada.estado === 'EN_MANTENIMIENTO' && 'En mantenimiento'}
                        {unidadSeleccionada.estado === 'FUERA_DE_SERVICIO' && 'Fuera de servicio'}
                      </strong>
                    </div>

                    <div>
                      <span>Activo</span>
                      <strong>
                        {unidadSeleccionada.activo ? 'Sí' : 'No'}
                      </strong>
                    </div>

                  </div>

                  <div className="detalle-extra">
                    <span>Observaciones</span>

                    <p>
                      {unidadSeleccionada.observaciones ||
                        'Sin observaciones registradas.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="detalle-extra">
              <span>Observaciones</span>

              <p>
                {unidadSeleccionada.observaciones ||
                  'Sin observaciones registradas.'}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default UnidadesPage