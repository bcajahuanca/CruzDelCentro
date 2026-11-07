import {
  useEffect,
  useMemo,
  useState
} from 'react'

import {
  Plus,
  Search,
  Pencil,
  UserCheck,
  UserX
} from 'lucide-react'

import type {
  Usuario,
  RolUsuario,
  ActualizarUsuarioRequest,
  CrearUsuarioRequest
} from '../types/Usuario'

import {
  listarUsuarios,
  listarRoles,
  actualizarUsuario,
  crearUsuario,
  cambiarEstadoUsuario
} from '../services/usuarioService'

import '../styles/usuarios.css'


export default function UsuariosPage() {

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([])

  const [roles, setRoles] =
    useState<RolUsuario[]>([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')

  const [busqueda, setBusqueda] =
    useState('')

  const [rolFiltro, setRolFiltro] =
    useState('TODOS')

  const [estadoFiltro, setEstadoFiltro] =
    useState('TODOS')

  const [modalAbierto, setModalAbierto] =
    useState(false)

  const [modoEdicion, setModoEdicion] =
    useState(false)

  const [usuarioEditando, setUsuarioEditando] =
    useState<Usuario | null>(null)

  const [guardando, setGuardando] =
    useState(false)

  const [mensaje, setMensaje] =
    useState('')

  const [form, setForm] =
    useState({
      nombres: '',
      apellidos: '',
      telefono: '',
      rolId: '',
      password: ''
    })

  useEffect(() => {

    const controller =
      new AbortController()

    const cargar = async () => {

      try {

        setCargando(true)
        setError('')

        const [
          dataUsuarios,
          dataRoles
        ] = await Promise.all([
          listarUsuarios(
            controller.signal
          ),
          listarRoles(
            controller.signal
          )
        ])

        if (
          controller.signal.aborted
        ) {
          return
        }

        setUsuarios(dataUsuarios)
        setRoles(dataRoles)

      } catch (error) {

        if (
          controller.signal.aborted
        ) {
          return
        }

        console.error(error)

        setError(
          'No se pudo cargar la información de usuarios'
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


  const usuariosFiltrados =
    useMemo(() => {

      const texto =
        busqueda
          .trim()
          .toLowerCase()

      return usuarios.filter(
        usuario => {

          const nombreCompleto =
            `${usuario.nombres} ${usuario.apellidos}`
              .toLowerCase()

          const coincideBusqueda =
            !texto ||
            nombreCompleto.includes(
              texto
            ) ||
            usuario.correo
              .toLowerCase()
              .includes(texto)


          const coincideRol =
            rolFiltro === 'TODOS' ||
            usuario.rolCodigo ===
            rolFiltro


          const coincideEstado =
            estadoFiltro === 'TODOS' ||
            (
              estadoFiltro ===
              'ACTIVO' &&
              usuario.activo
            ) ||
            (
              estadoFiltro ===
              'INACTIVO' &&
              !usuario.activo
            )


          return (
            coincideBusqueda &&
            coincideRol &&
            coincideEstado
          )
        }
      )

    }, [
      usuarios,
      busqueda,
      rolFiltro,
      estadoFiltro
    ])

  const abrirNuevoUsuario = () => {

    setModoEdicion(false)
    setUsuarioEditando(null)

    setForm({
      nombres: '',
      apellidos: '',
      telefono: '',
      rolId: '',
      password: ''
    })

    setMensaje('')
    setModalAbierto(true)
  }

  const abrirEditarUsuario = (
    usuario: Usuario
  ) => {

    setModoEdicion(true)
    setUsuarioEditando(usuario)

    setForm({
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono:
        usuario.telefono || '',
      rolId:
        usuario.rolId?.toString() || '',
      password: ''
    })

    setMensaje('')
    setModalAbierto(true)
  }

  const guardarUsuario =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault()

      if (
        !form.nombres.trim() ||
        !form.apellidos.trim() ||
        !form.rolId
      ) {
        setMensaje(
          'Completa los campos obligatorios.'
        )

        return
      }

      if (
        !modoEdicion &&
        !form.password.trim()
      ) {
        setMensaje(
          'La contraseña inicial es obligatoria.'
        )

        return
      }

      try {

        setGuardando(true)
        setMensaje('')

        if (
          modoEdicion &&
          usuarioEditando
        ) {

          const request:
            ActualizarUsuarioRequest = {

            nombres:
              form.nombres.trim(),

            apellidos:
              form.apellidos.trim(),

            telefono:
              form.telefono.trim(),

            rolId:
              Number(form.rolId),

            nuevaPassword:
              form.password
          }

          const actualizado =
            await actualizarUsuario(
              usuarioEditando.id,
              request
            )

          setUsuarios(
            anteriores =>
              anteriores.map(
                usuario =>
                  usuario.id ===
                    actualizado.id
                    ? actualizado
                    : usuario
              )
          )

        } else {

          const request:
            CrearUsuarioRequest = {

            nombres:
              form.nombres.trim(),

            apellidos:
              form.apellidos.trim(),

            telefono:
              form.telefono.trim(),

            rolId:
              Number(form.rolId),

            password:
              form.password
          }

          const nuevo =
            await crearUsuario(
              request
            )

          setUsuarios(
            anteriores => [
              ...anteriores,
              nuevo
            ]
          )
        }

        setModalAbierto(false)

      } catch (error) {

        console.error(error)

        setMensaje(
          modoEdicion
            ? 'No se pudo actualizar el usuario.'
            : 'No se pudo crear el usuario.'
        )

      } finally {

        setGuardando(false)

      }
    }

  const cambiarEstado =
    async (
      usuario: Usuario
    ) => {

      const nuevoEstado =
        !usuario.activo

      const confirmar =
        window.confirm(
          nuevoEstado
            ? `¿Deseas activar a ${usuario.nombres} ${usuario.apellidos}?`
            : `¿Deseas desactivar a ${usuario.nombres} ${usuario.apellidos}?`
        )

      if (!confirmar) {
        return
      }

      try {

        const actualizado =
          await cambiarEstadoUsuario(
            usuario.id,
            nuevoEstado
          )

        setUsuarios(
          anteriores =>
            anteriores.map(
              item =>
                item.id === actualizado.id
                  ? actualizado
                  : item
            )
        )

      } catch (error) {

        console.error(error)

        alert(
          'No se pudo cambiar el estado del usuario.'
        )
      }
    }

  if (cargando) {
    return (
      <div className="usuarios-page">
        Cargando usuarios...
      </div>
    )
  }


  return (
    <div className="usuarios-page">

      <div className="usuarios-header">

        <div>
          <h1>Usuarios</h1>

          <p>
            Gestiona los usuarios,
            roles y accesos al sistema.
          </p>
        </div>

        <button
          className="usuarios-btn-primary"
          type="button"
          onClick={abrirNuevoUsuario}
        >
          <Plus size={18} />

          Nuevo usuario
        </button>

      </div>


      {error && (
        <div className="usuarios-error">
          {error}
        </div>
      )}


      <div className="usuarios-card">

        <div className="usuarios-filtros">

          <div className="usuarios-buscador">

            <Search size={18} />

            <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={busqueda}
              onChange={
                e =>
                  setBusqueda(
                    e.target.value
                  )
              }
            />

          </div>


          <select
            value={rolFiltro}
            onChange={
              e =>
                setRolFiltro(
                  e.target.value
                )
            }
          >
            <option value="TODOS">
              Todos los roles
            </option>

            {roles.map(
              rol => (
                <option
                  key={rol.id}
                  value={rol.codigo}
                >
                  {rol.nombre}
                </option>
              )
            )}

          </select>


          <select
            value={estadoFiltro}
            onChange={
              e =>
                setEstadoFiltro(
                  e.target.value
                )
            }
          >
            <option value="TODOS">
              Todos los estados
            </option>

            <option value="ACTIVO">
              Activos
            </option>

            <option value="INACTIVO">
              Inactivos
            </option>
          </select>

        </div>


        <div className="usuarios-tabla-wrapper">

          <table className="usuarios-tabla">

            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>

              {usuariosFiltrados.map(
                usuario => (

                  <tr key={usuario.id}>

                    <td>
                      <div className="usuarios-nombre">

                        <strong>
                          {usuario.nombres}{' '}
                          {usuario.apellidos}
                        </strong>

                      </div>
                    </td>

                    <td>
                      {usuario.correo}
                    </td>

                    <td>
                      <span className="usuarios-rol">
                        {usuario.rolNombre ||
                          'Sin rol'}
                      </span>
                    </td>

                    <td>
                      {usuario.telefono ||
                        '-'}
                    </td>

                    <td>

                      <span
                        className={
                          usuario.activo
                            ? 'usuarios-estado activo'
                            : 'usuarios-estado inactivo'
                        }
                      >
                        {usuario.activo
                          ? 'Activo'
                          : 'Inactivo'}
                      </span>

                    </td>

                    <td>

                      <div className="usuarios-acciones">

                        <button
                          type="button"
                          className="usuarios-btn-icon"
                          title="Editar usuario"
                          onClick={() => abrirEditarUsuario(usuario)}
                        >
                          <Pencil size={17} />
                        </button>


                        <button
                          type="button"
                          className={
                            usuario.activo
                              ? 'usuarios-btn-icon danger'
                              : 'usuarios-btn-icon success'
                          }
                          title={
                            usuario.activo
                              ? 'Desactivar usuario'
                              : 'Activar usuario'
                          }
                          onClick={() => cambiarEstado(usuario)}
                        >

                          {usuario.activo
                            ? (
                              <UserX
                                size={17}
                              />
                            )
                            : (
                              <UserCheck
                                size={17}
                              />
                            )}

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )}


              {usuariosFiltrados.length ===
                0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="usuarios-vacio"
                    >
                      No se encontraron
                      usuarios.
                    </td>
                  </tr>
                )}

            </tbody>

          </table>

        </div>

      </div>

      {modalAbierto && (

        <div className="usuarios-modal-overlay">

          <div className="usuarios-modal">

            <div className="usuarios-modal-header">

              <div>
                <h2>
                  {modoEdicion
                    ? 'Editar usuario'
                    : 'Nuevo usuario'}
                </h2>

                <p>
                  {modoEdicion
                    ? 'Actualiza los datos y permisos del usuario.'
                    : 'Registra un nuevo usuario del sistema.'}
                </p>
              </div>

              <button
                type="button"
                className="usuarios-modal-cerrar"
                onClick={() =>
                  setModalAbierto(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={guardarUsuario}
              className="usuarios-form"
            >

              <div className="usuarios-form-grid">

                <div className="usuarios-campo">
                  <label>Nombres *</label>

                  <input
                    value={form.nombres}
                    onChange={
                      e =>
                        setForm({
                          ...form,
                          nombres:
                            e.target.value
                        })
                    }
                    placeholder="Ej. BRAD KENEDY"
                  />
                </div>


                <div className="usuarios-campo">
                  <label>Apellidos *</label>

                  <input
                    value={form.apellidos}
                    onChange={
                      e =>
                        setForm({
                          ...form,
                          apellidos:
                            e.target.value
                        })
                    }
                    placeholder="Ej. CAJAHUANCA CRUZ"
                  />
                </div>


                <div className="usuarios-campo">
                  <label>Teléfono</label>

                  <input
                    value={form.telefono}
                    onChange={
                      e =>
                        setForm({
                          ...form,
                          telefono:
                            e.target.value
                        })
                    }
                    placeholder="Opcional"
                  />
                </div>


                <div className="usuarios-campo">
                  <label>Rol *</label>

                  <select
                    value={form.rolId}
                    onChange={
                      e =>
                        setForm({
                          ...form,
                          rolId:
                            e.target.value
                        })
                    }
                  >

                    <option value="">
                      Seleccionar rol
                    </option>

                    {roles.map(
                      rol => (
                        <option
                          key={rol.id}
                          value={rol.id}
                        >
                          {rol.nombre}
                        </option>
                      )
                    )}

                  </select>
                </div>

              </div>


              {modoEdicion &&
                usuarioEditando && (

                  <div className="usuarios-correo-preview">

                    <span>
                      Usuario actual
                    </span>

                    <strong>
                      {usuarioEditando.correo}
                    </strong>

                    <small>
                      El usuario se actualizará
                      automáticamente si cambias
                      nombres o apellidos.
                    </small>

                  </div>

                )}


              <div className="usuarios-campo">

                <label>
                  {modoEdicion
                    ? 'Nueva contraseña'
                    : 'Contraseña inicial *'}
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={
                    e =>
                      setForm({
                        ...form,
                        password:
                          e.target.value
                      })
                  }
                  placeholder={
                    modoEdicion
                      ? 'Dejar vacío para conservar la actual'
                      : 'Ingresar contraseña inicial'
                  }
                />

                {modoEdicion && (
                  <small>
                    Si no deseas cambiarla,
                    deja este campo vacío.
                  </small>
                )}

              </div>


              {mensaje && (
                <div className="usuarios-form-error">
                  {mensaje}
                </div>
              )}


              <div className="usuarios-modal-actions">

                <button
                  type="button"
                  className="usuarios-btn-secondary"
                  onClick={() =>
                    setModalAbierto(false)
                  }
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="usuarios-btn-primary"
                  disabled={guardando}
                >
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Guardar cambios'
                      : 'Crear usuario'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  )
}