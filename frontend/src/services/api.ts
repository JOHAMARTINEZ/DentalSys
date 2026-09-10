const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`)

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`)
  }

  return response.json() as Promise<T>
}
