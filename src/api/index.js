// src/api/index.js  — Vercel proxy
import axios from 'axios'

const DEFAULT_TOKEN = import.meta.env.VITE_API_KEY || null

// baseURL пустой — вызовы идут к тому же хосту (Vercel), где живёт функция /api/proxy
const api = axios.create({ baseURL: '' })

// attach token (either from localStorage or env default)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token') || DEFAULT_TOKEN
  if (!config.params) config.params = {}
  if (token) config.params.key = token
  return config
})

// Универсальный fetchList — делает запрос к /api/proxy?resource={resource}&...
export async function fetchList(
  resource,
  { dateFrom, dateTo, page = 1, limit = 100, extra = {} } = {},
) {
  const params = { page, limit, ...extra }
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo

  // делаем запрос к Vercel function /api/proxy
  const resp = await api.get('/api/proxy', { params: { resource, ...params } })

  // ожидаем, что функция уже вернёт JSON (или текст), нормализуем ответ как раньше
  const payload = resp.data || resp
  const items = payload.data || payload.items || []
  const meta = payload.meta || payload.pagination || {}
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
