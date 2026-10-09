import { useNavigate } from 'react-router-dom'

function Topbar() {

  const navigate = useNavigate()

  const usuario = localStorage.getItem('usuario')
  const rol = localStorage.getItem('rol')

  const cerrarSesion = () => {

    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('rol')

    navigate('/login')
  }

  return (
    <header className="topbar">

      <div>
        <span className="topbar-user">
          {usuario}
        </span>

        <span className="topbar-role">
          {rol}
        </span>
      </div>

      <button
        className="logout-button"
        onClick={cerrarSesion}
      >
        Cerrar sesión
      </button>

    </header>
  )
}

export default Topbar