const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('dentalsys_token')

  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
  headers: getAuthHeaders(),
})
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function apiPost<T>(
  endpoint: string,
  body: unknown,
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
  'Content-Type': 'application/json',
  ...getAuthHeaders(),
},
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status}`)
  }

  return response.json() as Promise<T>
}
