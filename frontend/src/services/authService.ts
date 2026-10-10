const BASE_URL = import.meta.env.VITE_API_URL

export interface LoginRequest {
  correo: string
  password: string
}

export interface LoginResponse {
  mensaje?: string
  token: string
  usuario: string
  correo: string
  rol: string
}

export const login = async (
  datos: LoginRequest
): Promise<LoginResponse> => {

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datos)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)

    throw new Error(
      error?.mensaje || "Correo o contraseña incorrectos"
    )
  }

  return response.json()
}