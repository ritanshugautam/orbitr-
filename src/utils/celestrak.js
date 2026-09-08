import {
  FETCH_INTERVAL_MS,
  CACHE_KEY,
  CACHE_TIMESTAMP_KEY,
} from './constants.js'

export async function loadSatelliteData(onStatus) {
  // Check localStorage cache first (2hr TTL)
  const cached = localStorage.getItem(CACHE_KEY)
  const timestamp = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || '0')
  const age = Date.now() - timestamp
  const cacheValid = cached && age < FETCH_INTERVAL_MS

  if (cacheValid) {
    onStatus('Using cached data (' + Math.round(age / 60000) + 'min old)')
    return JSON.parse(cached)
  }

  onStatus('Loading satellite data...')

  // Strategy 1: static JSON baked at build time (production, served from CDN)
  try {
    const res = await fetch('/satellites.json')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 100) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()))
        onStatus(`Loaded ${data.length.toLocaleString()} satellites`)
        return data
      }
    }
  } catch (_) { /* not available in dev — fall through */ }

  // Strategy 2: Vite dev proxy → CelesTrak (local dev)
  onStatus('Fetching live data...')
  try {
    const res = await fetch('/api/celestrak')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error(`Expected array, got ${typeof data}`)
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()))
    onStatus(`Loaded ${data.length.toLocaleString()} satellites`)
    return data
  } catch (err) {
    onStatus('API fetch failed: ' + err.message)
  }

  // Strategy 3: stale cache as last resort
  if (cached) {
    onStatus('Using stale cache — network unavailable')
    return JSON.parse(cached)
  }

  throw new Error('No satellite data available. Try refreshing in a moment.')
}
