import {
  useNavigate
} from 'react-router-dom'

function ForbiddenPage() {

  const navigate =
    useNavigate()

  return (

    <div
      style={{
        minHeight: '100vh',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        background: '#f8fafc'
      }}
    >

      <div
        style={{
          textAlign: 'center',

          background: 'white',

          padding: '40px',

          borderRadius: '12px',

          border:
            '1px solid #e2e8f0'
        }}
      >

        <h1>
          403
        </h1>

        <h2>
          Acceso no autorizado
        </h2>

        <p>
          No tienes permisos
          para acceder a esta sección.
        </p>

        <button
          onClick={() =>
            navigate('/')
          }
        >
          Volver
        </button>

      </div>

    </div>
  )
}

export default ForbiddenPage