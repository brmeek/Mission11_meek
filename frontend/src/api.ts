const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const normalizedApiBaseUrl = configuredApiBaseUrl.replace(/\/+$/, '')

export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with "/"')
  }

  return normalizedApiBaseUrl ? `${normalizedApiBaseUrl}${path}` : path
}
