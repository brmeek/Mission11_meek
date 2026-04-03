const API_BASE_URL = 'https://bookstore-backend-hrceaafxeyd9akfy.westus2-01.azurewebsites.net'
const normalizedApiBaseUrl = API_BASE_URL.replace(/\/+$/, '')

export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error('API path must start with "/"')
  }

  return `${normalizedApiBaseUrl}${path}`
}
