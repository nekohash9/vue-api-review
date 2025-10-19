import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://109.73.206.144:6969'
const DEFAULT_TOKEN = import.meta.env.VITE_API_KEY || null

const api = axios.create({ baseURL: BASE_URL, timeout: 30000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token') || DEFAULT_TOKEN
  if (!config.params) config.params = {}
  if (token) config.params.key = token
  return config
})

export async function fetchList(
  resource,
  { dateFrom, dateTo, page = 1, limit = 100, extra = {} } = {},
) {
  const params = { page, limit, ...extra }
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo

  const resp = await api.get(`/api/${resource}`, { params })
  const payload = resp.data || resp
  const items = payload.data || payload.items || []
  const meta = payload.meta || payload.pagination || {}
  // try to normalize
  const normalizedMeta = {
    current_page: meta.current_page || meta.page || params.page || 1,
    per_page: meta.per_page || meta.perPage || meta.limit || params.limit,
    total: meta.total || meta.count || (items ? items.length : 0),
    last_page:
      meta.last_page || Math.ceil((meta.total || items.length) / (meta.per_page || params.limit)),
  }
  return { items, meta: normalizedMeta, raw: payload, headers: resp.headers }
}

export default api
