import { NavLink } from 'react-router-dom'

import logo from '../assets/ccentro_logo.png'

import { useAuth } from '../context/AuthContext'


interface SidebarProps {
  abierto: boolean
  cerrar: () => void
}


function Sidebar({
  abierto,
  cerrar
}: SidebarProps) {

  const {
    tienePermiso
  } = useAuth()


  return (

    <aside
      className={
        `sidebar ${abierto ? 'abierto' : ''}`
      }
    >

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


        {tienePermiso('dashboard.leer') && (

          <NavLink
            to="/dashboard"
            onClick={cerrar}
          >
            Dashboard
          </NavLink>

        )}


        {tienePermiso('unidad.leer') && (

          <NavLink
            to="/unidades"
            onClick={cerrar}
          >
            Unidades
          </NavLink>

        )}


        {tienePermiso('incidencia.leer') && (

          <NavLink
            to="/incidencias"
            onClick={cerrar}
          >
            Incidencias
          </NavLink>

        )}


        {tienePermiso('mantenimiento.leer') && (

          <NavLink
            to="/mantenimiento"
            onClick={cerrar}
          >
            Mantenimiento
          </NavLink>

        )}


        {tienePermiso('orden.leer') && (

          <NavLink
            to="/ordenes-trabajo"
            onClick={cerrar}
          >
            Órdenes de trabajo
          </NavLink>

        )}


        {tienePermiso('inventario.leer') && (

          <NavLink
            to="/almacen"
            onClick={cerrar}
          >
            Almacén
          </NavLink>

        )}


        {tienePermiso('historial.leer') && (

          <NavLink
            to="/historial"
            onClick={cerrar}
          >
            Historial
          </NavLink>

        )}


        {tienePermiso('reporte.leer') && (

          <NavLink
            to="/reportes"
            onClick={cerrar}
          >
            Reportes
          </NavLink>

        )}


        {tienePermiso('usuario.administrar') && (

          <NavLink
            to="/usuarios"
            onClick={cerrar}
          >
            Usuarios
          </NavLink>

        )}

      </nav>

    </aside>
  )
}

export default Sidebar