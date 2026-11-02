import {
  createContext,
  useContext,
  useMemo,
  useState
} from 'react'

type AuthUser = {
  correo: string | null
  nombre: string | null
  roles: string[]
  permisos: string[]
}

type AuthContextType = {
  usuario: AuthUser | null
  autenticado: boolean
  tieneRol: (rol: string) => boolean
  tienePermiso: (permiso: string) => boolean
  actualizarDesdeToken: (token: string) => void
  logout: () => void
}

const AuthContext =
  createContext<AuthContextType | null>(null)

function decodificarToken(
  token: string
) {

  try {

    const payload =
      token.split('.')[1]

    const decoded =
      JSON.parse(
        atob(
          payload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
        )
      )

    return decoded

  } catch {

    return null
  }

}

function construirUsuarioDesdeToken():
  AuthUser | null {

  const token =
    localStorage.getItem('token')

  if (!token) {
    return null
  }

  const payload =
    decodificarToken(token)

  if (!payload) {
    return null
  }

  return {
    correo:
      payload.sub ?? null,

    nombre:
      payload.nombre ?? null,

    roles:
      payload.roles ?? [],

    permisos:
      payload.permisos ?? []
  }
}

export function AuthProvider({
  children
}: {
  children: React.ReactNode
}) {

  const [
    usuario,
    setUsuario
  ] =
    useState<AuthUser | null>(
      construirUsuarioDesdeToken()
    )


  const actualizarDesdeToken = (
    token: string
  ) => {

    localStorage.setItem(
      'token',
      token
    )

    const payload =
      decodificarToken(token)

    if (!payload) {
      setUsuario(null)
      return
    }

    setUsuario({
      correo:
        payload.sub ?? null,

      nombre:
        payload.nombre ?? null,

      roles:
        payload.roles ?? [],

      permisos:
        payload.permisos ?? []
    })
  }


  const logout = () => {

    localStorage.removeItem(
      'token'
    )

    setUsuario(null)
  }


  const tieneRol = (
    rol: string
  ) => {

    return usuario
      ?.roles
      .includes(rol) ?? false
  }


  const tienePermiso = (
    permiso: string
  ) => {

    return usuario
      ?.permisos
      .includes(permiso) ?? false
  }


  const value =
    useMemo(
      () => ({
        usuario,

        autenticado:
          usuario !== null,

        tieneRol,

        tienePermiso,

        actualizarDesdeToken,

        logout
      }),
      [usuario]
    )


  return (

    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>

  )
}


export function useAuth() {

  const context =
    useContext(AuthContext)

  if (!context) {

    throw new Error(
      'useAuth debe usarse dentro de AuthProvider'
    )
  }

  return context
}