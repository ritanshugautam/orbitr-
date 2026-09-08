import {
  FETCH_INTERVAL_MS,
  CACHE_KEY,
  CACHE_TIMESTAMP_KEY,
} from './constants.js'

// Relative URL — proxied by Vite in dev, by Vercel rewrites in prod
const API_URL = '/api/celestrak'

export async function loadSatelliteData(onStatus) {
  const cached = localStorage.getItem(CACHE_KEY)
  const timestamp = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || '0')
  const age = Date.now() - timestamp
  const cacheValid = cached && age < FETCH_INTERVAL_MS

  if (cacheValid) {
    onStatus('Using cached data (' + Math.round(age / 60000) + 'min old)')
    return JSON.parse(cached)
  }

  onStatus('Fetching satellite data...')
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error('Unexpected response shape')
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()))
    onStatus(`Loaded ${data.length.toLocaleString()} satellites`)
    return data
  } catch (err) {
    onStatus('Fetch failed: ' + err.message)
  }

  if (cached) {
    onStatus('Using stale cache — network unavailable')
    return JSON.parse(cached)
  }

  throw new Error(
    'Could not load satellite data. Check your connection and try refreshing.'
  )
}
