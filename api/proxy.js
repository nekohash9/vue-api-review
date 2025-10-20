/* eslint-env node */
import fetch from 'node-fetch'

export default async function handler(req, res) {
  try {
    const { resource, ...query } = req.query
    if (!resource) return res.status(400).json({ error: 'resource required' })

    const params = new URLSearchParams(query)

    // Подставляем ключ только если он задан в env
    if (process.env.VITE_API_KEY) {
      params.set('key', process.env.VITE_API_KEY)
    } else if (!params.has('key')) {
      // ни в env, ни в query — это может приводить к ошибке на API
      console.warn('No API key in env or query')
    }

    const url = `http://109.73.206.144:6969/api/${resource}?${params.toString()}`
    console.log('proxy fetching', url)

    const r = await fetch(url, { method: 'GET' })
    const text = await r.text()
    try {
      const json = JSON.parse(text)
      res.status(r.status).setHeader('Content-Type', 'application/json').send(JSON.stringify(json))
    } catch (err) {
      // вернём то, что пришло (HTML/текст) — чтобы было видно в ответе
      res.status(r.status).setHeader('Content-Type', 'text/plain; charset=utf-8').send(text)
    }
  } catch (err) {
    console.error('proxy error', err)
    res.status(500).json({ error: 'proxy internal error' })
  }
}
