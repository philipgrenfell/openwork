// API client for the bridge server

const API_BASE = '/api'

function withDirectory(path: string, directory?: string) {
  if (!directory) return path
  const hasQuery = path.includes('?')
  const separator = hasQuery ? '&' : '?'
  return `${path}${separator}directory=${encodeURIComponent(directory)}`
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(
      data.message || data.error || `Request failed with status ${response.status}`,
      response.status,
      data.code
    )
  }
  
  const text = await response.text()
  if (!text) return {} as T
  
  try {
    return JSON.parse(text)
  } catch {
    return text as T
  }
}

export async function get<T>(path: string, options?: { directory?: string }): Promise<T> {
  const response = await fetch(withDirectory(`${API_BASE}${path}`, options?.directory))
  return handleResponse<T>(response)
}

export async function post<T>(path: string, body?: unknown, options?: { directory?: string }): Promise<T> {
  const response = await fetch(withDirectory(`${API_BASE}${path}`, options?.directory), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

export async function patch<T>(path: string, body?: unknown, options?: { directory?: string }): Promise<T> {
  const response = await fetch(withDirectory(`${API_BASE}${path}`, options?.directory), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(response)
}

export async function del<T>(path: string, options?: { directory?: string }): Promise<T> {
  const response = await fetch(withDirectory(`${API_BASE}${path}`, options?.directory), {
    method: 'DELETE',
  })
  return handleResponse<T>(response)
}

export function buildApiUrl(path: string, options?: { directory?: string }) {
  return withDirectory(`${API_BASE}${path}`, options?.directory)
}
