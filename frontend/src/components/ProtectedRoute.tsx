import type {
  ReactNode
} from 'react'

import {
  Navigate
} from 'react-router-dom'

import {
  useAuth
} from '../context/AuthContext'


type Props = {
  children: ReactNode
  permiso?: string
  roles?: string[]
}


function ProtectedRoute({
  children,
  permiso,
  roles
}: Props) {

  const {
    autenticado,
    tienePermiso,
    tieneRol
  } = useAuth()


  if (!autenticado) {

    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  if (
    permiso &&
    !tienePermiso(permiso)
  ) {

    return (
      <Navigate
        to="/403"
        replace
      />
    )
  }


  if (
    roles &&
    !roles.some(
      rol =>
        tieneRol(rol)
    )
  ) {

    return (
      <Navigate
        to="/403"
        replace
      />
    )
  }


  return children
}

export default ProtectedRoute