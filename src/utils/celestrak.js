import {
  FETCH_INTERVAL_MS,
  CACHE_KEY,
  CACHE_TIMESTAMP_KEY,
} from './constants.js'

export async function loadSatelliteData(onStatus) {
  // Check localStorage cache first (2hr TTL) — only used for the API path
  const cached = localStorage.getItem(CACHE_KEY)
  const timestamp = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || '0')
  const age = Date.now() - timestamp
  const cacheValid = cached && age < FETCH_INTERVAL_MS

  if (cacheValid) {
    onStatus('Using cached data (' + Math.round(age / 60000) + 'min old)')
    return JSON.parse(cached)
  }

  onStatus('Loading satellite data...')

  // Strategy 1: static JSON baked at build time and served from CDN.
  // Do NOT cache in localStorage — the file is 6.7MB which exceeds the
  // 5MB Chromium quota. The browser HTTP cache handles repeat visits.
  try {
    const res = await fetch('/satellites.json')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 100) {
        onStatus(`Loaded ${data.length.toLocaleString()} satellites`)
        return data
      }
    }
  } catch (err) {
    // Not available in dev without running the prebuild — fall through
  }

  // Strategy 2: Vite dev proxy → CelesTrak (local dev only).
  // The response is smaller-subset-cacheable; safe to localStorage here
  // only if it fits (we skip setItem on quota error).
  onStatus('Fetching live data...')
  try {
    const res = await fetch('/api/celestrak')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (!Array.isArray(data)) throw new Error(`Expected array, got ${typeof data}`)
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()))
    } catch (_) { /* QuotaExceededError — skip cache silently */ }
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
