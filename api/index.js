// src/api/index.js (debug-friendly proxy variant)
import axios from 'axios'

const DEFAULT_TOKEN = import.meta.env.VITE_API_KEY || null
const api = axios.create({ baseURL: '' }) // proxy повёрнут на тот же хост (/api/proxy)

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token') || DEFAULT_TOKEN
  if (!config.params) config.params = {}
  if (token) config.params.key = token
  // debug
  console.log('[API] request to', config.url, 'params=', config.params)
  return config
})

// helpful response interceptor for logging
api.interceptors.response.use(
  (resp) => {
    console.log('[API] response', resp.status, resp.config?.url)
    return resp
  },
  (err) => {
    console.error('[API] response error', err?.message, err?.response?.status, err?.response?.data)
    return Promise.reject(err)
  },
)

export async function fetchList(
  resource,
  { dateFrom, dateTo, page = 1, limit = 100, extra = {} } = {},
) {
  const params = { page, limit, ...extra }
  if (dateFrom) params.dateFrom = dateFrom
  if (dateTo) params.dateTo = dateTo

  // call proxy
  const resp = await api.get('/api/proxy', { params: { resource, ...params } })

  // Debug: full response log
  console.log('[API] raw resp object:', {
    status: resp.status,
    headers: resp.headers,
    dataType: typeof resp.data,
    dataSample: Array.isArray(resp.data) ? resp.data.slice(0, 2) : resp.data,
  })

  // If proxy returned plain text (string), try to parse JSON
  let payload = resp.data

  if (typeof payload === 'string') {
    // попробуем вытащить JSON из строки
    try {
      payload = JSON.parse(payload)
      console.log('[API] parsed payload from string to JSON')
    } catch (err) {
      // если не JSON — оставляем строку и логируем
      console.warn(
        '[API] payload is string and not valid JSON; payload:',
        payload.slice ? payload.slice(0, 500) : String(payload),
      )
    }
  }

  // Expose last raw payload for interactive debugging in console
  try {
    window.__LAST_RAW__ = payload
  } catch (e) {
    /* ignore (server env may not have window) */
  }

  // Normalize common shapes
  const items =
    (payload && (payload.data || payload.items)) || (Array.isArray(payload) ? payload : [])
  const meta = (payload && (payload.meta || payload.pagination)) || {}
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
