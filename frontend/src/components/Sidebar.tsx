import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <h2>Cruz del Centro</h2>
        <span>Almacén y Mantenimiento</span>
      </div>

      <nav className="sidebar-menu">

        <NavLink to="/dashboard">
          Dashboard
        </NavLink>

        <NavLink to="/unidades">
          Unidades
        </NavLink>

        <NavLink to="/incidencias">
          Incidencias
        </NavLink>

        <NavLink to="/mantenimiento">
          Mantenimiento
        </NavLink>

        <NavLink to="/ordenes">
          Órdenes de trabajo
        </NavLink>

        <NavLink to="/almacen">
          Almacén
        </NavLink>

        <NavLink to="/historial">
          Historial
        </NavLink>

        <NavLink to="/reportes">
          Reportes
        </NavLink>

        <NavLink to="/usuarios">
          Usuarios
        </NavLink>

      </nav>

    </aside>
  )
}

export default Sidebar