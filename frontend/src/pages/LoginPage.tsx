import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/logint.css'

function LoginPage() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!correo || !password) {
      setMensaje('Completa todos los campos')
      return
    }

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('usuario', data.usuario)
        localStorage.setItem('rol', data.rol)

        navigate('/dashboard')
      } else {
        setMensaje(data.mensaje)
      }
    } catch (error) {
      console.error(error)
      setMensaje('No se pudo conectar con el servidor')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">

        <h1>Cruz del Centro</h1>

        <p className="login-subtitle">
          Sistema de Almacén y Mantenimiento
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Correo electrónico</label>

            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@cruzdelcentro.com"
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
            />
          </div>

          {mensaje && (
            <p className="login-message">
              {mensaje}
            </p>
          )}

          <button type="submit" className="login-button">
            Iniciar sesión
          </button>

        </form>

        <button className="forgot-password">
          ¿Olvidaste tu contraseña?
        </button>

      </div>
    </div>
  )
}

export default LoginPage