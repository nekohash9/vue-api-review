/* eslint-env node */
// api/proxy.js (robust; put into /api folder)
export default async function handler(req, res) {
  try {
    console.log('api/proxy called, query=', req.query)
    const { resource, ...query } = req.query
    if (!resource) {
      console.warn('missing resource param')
      return res.status(400).json({ error: 'resource required' })
    }

    const params = new URLSearchParams(query)

    // логируем факт наличия ключа (не сам ключ!)
    const hasEnvKey = !!process.env.VITE_API_KEY
    console.log('VITE_API_KEY set in env?', hasEnvKey)

    // если есть ключ в env — подставляем его; если нет, используем то, что пришло в query
    if (hasEnvKey) params.set('key', process.env.VITE_API_KEY)
    else if (!params.has('key')) console.warn('No API key in env or query')

    const url = `http://109.73.206.144:6969/api/${resource}?${params.toString()}`
    console.log('proxy fetching url=', url)

    // Выполним fetch
    const controller = new AbortController()
    const timeoutMs = 15000
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    let r
    try {
      r = await fetch(url, { method: 'GET', signal: controller.signal })
    } catch (fetchErr) {
      console.error('fetch failed', fetchErr && fetchErr.message)
      clearTimeout(timeout)
      return res
        .status(502)
        .json({ error: 'upstream fetch failed', message: String(fetchErr && fetchErr.message) })
    }
    clearTimeout(timeout)

    const text = await r.text()
    // Если upstream вернул не 2xx — вернём код и часть тела
    if (!r.ok) {
      console.warn('upstream returned non-OK', r.status)
      // отдаем и status, и часть тела для отладки
      const snippet = text && text.length > 1000 ? text.slice(0, 1000) + '...[truncated]' : text
      return res
        .status(r.status)
        .json({ error: 'upstream error', status: r.status, body_snippet: snippet })
    }

    // Попробуем распарсить JSON
    try {
      const json = JSON.parse(text)
      return res.status(200).json(json)
    } catch (e) {
      // upstream вернул текст (не JSON) — вернём как plain text, но в JSON-обёртке, чтобы фронт мог прочитать
      return res.status(200).json({ data: null, raw_text: text })
    }
  } catch (err) {
    console.error('proxy internal error', err)
    // не возвращаем чувствительные данные
    return res
      .status(500)
      .json({ error: 'proxy internal error', message: String(err && err.message) })
  }
}
