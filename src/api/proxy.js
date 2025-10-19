/* eslint-env node */
import fetch from 'node-fetch'

export default async function handler(req, res) {
  try {
    const { resource, ...query } = req.query
    if (!resource) return res.status(400).json({ error: 'resource required' })

    const params = new URLSearchParams(query)
    params.set('key', process.env.VITE_API_KEY)

    const url = `http://109.73.206.144:6969/api/${resource}?${params.toString()}`

    const r = await fetch(url)
    const txt = await r.text()

    res.status(r.status)
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json')
    res.send(txt)
  } catch (err) {
    console.error('proxy error', err)
    res.status(500).json({ error: 'proxy internal error' })
  }
}
