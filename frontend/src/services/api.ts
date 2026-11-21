/* =========================================================
   CONEXIÓN CON EL BACKEND Y SESIÓN
   - apiGet / apiPost / apiPut / apiDelete agregan el token.
   - Si el backend responde con error, se lanza ApiError con
     el mensaje en español que envía el backend.
   - Si la sesión venció (401), se cierra la sesión y se
     vuelve al login.
========================================================= */

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'ODONTOLOGO' | 'PACIENTE'

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  RECEPCIONISTA: 'Recepcionista',
  ODONTOLOGO: 'Odontólogo',
  PACIENTE: 'Paciente',
}

export interface UsuarioSesion {
  idUsuario?: number
  username?: string
  correo?: string
  rut?: string
  nombres?: string
  apellidos?: string
  rol?: Rol
}

/* ---------- Sesión (localStorage) ---------- */

const CLAVES_SESION = [
  'dentalsys_token',
  'dentalsys_rol',
  'dentalsys_username',
  'dentalsys_usuario',
]

export function getToken(): string | null {
  return localStorage.getItem('dentalsys_token')
}

export function getRol(): Rol | null {
  return localStorage.getItem('dentalsys_rol') as Rol | null
}

export function getUsuarioSesion(): UsuarioSesion {
  try {
    const guardado = localStorage.getItem('dentalsys_usuario')
    if (guardado) {
      return JSON.parse(guardado) as UsuarioSesion
    }
  } catch {
    // dato dañado: se ignora
  }

  return {
    username: localStorage.getItem('dentalsys_username') ?? undefined,
    rol: getRol() ?? undefined,
  }
}

/** Nombre para mostrar: "Nombres Apellidos" o el usuario. */
export function getNombreSesion(): string {
  const usuario = getUsuarioSesion()
  const nombre = [usuario.nombres, usuario.apellidos]
    .filter(Boolean)
    .join(' ')
    .trim()

  return nombre || usuario.username || 'Usuario'
}

/** Borra todos los datos de la sesión (no borra "recordar usuario"). */
export function cerrarSesion(): void {
  CLAVES_SESION.forEach((clave) => localStorage.removeItem(clave))
}

/* ---------- Errores ---------- */

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Mensaje legible para mostrar en pantalla a partir de cualquier error. */
export function mensajeError(
  error: unknown,
  porDefecto = 'Ocurrió un error inesperado. Intenta nuevamente.',
): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof TypeError) {
    return 'No fue posible conectar con el servidor. Revisa que el backend esté encendido.'
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return porDefecto
}

async function leerMensaje(response: Response): Promise<string> {
  const texto = await response.text().catch(() => '')

  if (texto) {
    try {
      const json = JSON.parse(texto) as { message?: string; error?: string }
      const mensaje = json.message?.trim()

      if (mensaje && !mensaje.startsWith('Validation failed')) {
        return mensaje
      }

      if (mensaje) {
        return 'Revisa los datos ingresados.'
      }
    } catch {
      // No es JSON: el backend envió texto plano
      if (texto.length < 300) {
        return texto
      }
    }
  }

  switch (response.status) {
    case 400:
      return 'Revisa los datos ingresados.'
    case 403:
      return 'No tienes permiso para realizar esta acción.'
    case 404:
      return 'No se encontró la información solicitada.'
    case 409:
      return 'La operación no se pudo realizar porque los datos ya existen o están en uso.'
    default:
      return `Error del servidor (${response.status}).`
  }
}

/* ---------- Peticiones ---------- */

async function request<T>(
  method: string,
  endpoint: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Sesión vencida o inválida: volver al login
  if (response.status === 401 && token) {
    cerrarSesion()
    window.location.assign('/login?sesion=expirada')
    throw new ApiError(401, 'Tu sesión expiró. Inicia sesión nuevamente.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, await leerMensaje(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const texto = await response.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}

export function apiGet<T>(endpoint: string): Promise<T> {
  return request<T>('GET', endpoint)
}

export function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>('POST', endpoint, body ?? {})
}

export function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  return request<T>('PUT', endpoint, body ?? {})
}

export function apiDelete<T>(endpoint: string): Promise<T> {
  return request<T>('DELETE', endpoint)
}
