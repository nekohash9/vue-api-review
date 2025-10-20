/* eslint-env node */
import fetch from 'node-fetch' // или используй глобальный fetch, если среда поддерживает

export default async function handler(req, res) {
  try {
    const { resource, ...query } = req.query
    if (!resource) return res.status(400).json({ error: 'resource required' })

    const params = new URLSearchParams(query)
    params.set('key', process.env.VITE_API_KEY)

    const url = `http://109.73.206.144:6969/api/${resource}?${params.toString()}`

    const r = await fetch(url, { method: 'GET' })

    // Попытка спарсить JSON. Если не получится — вернуть текст.
    const text = await r.text()
    try {
      const json = JSON.parse(text)
      res.status(r.status).setHeader('Content-Type', 'application/json').send(JSON.stringify(json))
    } catch (err) {
      // если не JSON, отдадим текст как есть (и укажем тип text/plain)
      res.status(r.status).setHeader('Content-Type', 'text/plain; charset=utf-8').send(text)
    }
  } catch (err) {
    console.error('proxy error', err)
    res.status(500).json({ error: 'proxy internal error' })
  }
}
