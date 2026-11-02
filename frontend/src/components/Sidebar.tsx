import { NavLink } from 'react-router-dom'
import logo from '../assets/ccentro_logo.png'
import { useAuth } from '../context/AuthContext'

function Sidebar() {

  const {
    tienePermiso
  } = useAuth()

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">

        <img
          src={logo}
          alt="Cruz del Centro"
          className="sidebar-brand-logo"
        />

        <h2>
          Cruz del Centro
        </h2>

        <span>
          Almacén y Mantenimiento
        </span>

      </div>


      <nav className="sidebar-menu">

        {/* DASHBOARD */}

        {tienePermiso('dashboard.leer') && (

          <NavLink to="/dashboard">
            Dashboard
          </NavLink>

        )}


        {/* UNIDADES */}

        {tienePermiso('unidad.leer') && (

          <NavLink to="/unidades">
            Unidades
          </NavLink>

        )}


        {/* INCIDENCIAS */}

        {tienePermiso('incidencia.leer') && (

          <NavLink to="/incidencias">
            Incidencias
          </NavLink>

        )}


        {/* MANTENIMIENTO */}

        {tienePermiso('mantenimiento.leer') && (

          <NavLink to="/mantenimiento">
            Mantenimiento
          </NavLink>

        )}


        {/* ÓRDENES DE TRABAJO */}

        {tienePermiso('orden.leer') && (

          <NavLink to="/ordenes-trabajo">
            Órdenes de trabajo
          </NavLink>

        )}


        {/* ALMACÉN */}

        {tienePermiso('inventario.leer') && (

          <NavLink to="/almacen">
            Almacén
          </NavLink>

        )}


        {/* HISTORIAL */}

        {tienePermiso('historial.leer') && (

          <NavLink to="/historial">
            Historial
          </NavLink>

        )}


        {/* REPORTES */}

        {tienePermiso('reporte.leer') && (

          <NavLink to="/reportes">
            Reportes
          </NavLink>

        )}


        {/* USUARIOS */}

        {tienePermiso('usuario.administrar') && (

          <NavLink to="/usuarios">
            Usuarios
          </NavLink>

        )}

      </nav>

    </aside>
  )
}

export default Sidebar