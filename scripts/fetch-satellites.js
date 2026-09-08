// Runs before `vite build` via the `prebuild` npm script.
// Fetches live CelesTrak OMM JSON and writes it to public/satellites.json
// so Vite bundles it as a static CDN asset — no runtime function needed.

import { writeFileSync } from 'fs'

const URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=JSON'

console.log('[orbitr] Fetching satellite data from CelesTrak...')

let data
try {
  const res = await fetch(URL, {
    headers: {
      'User-Agent': 'Orbitr/1.0 (satellite visualizer; build-time fetch)',
      'Accept': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  data = await res.json()
  if (!Array.isArray(data)) throw new Error('Response was not a JSON array')
} catch (err) {
  console.error('[orbitr] CelesTrak fetch failed:', err.message)
  console.error('[orbitr] Build will continue — app will try the API at runtime.')
  process.exit(0)  // don't block the build
}

writeFileSync('public/satellites.json', JSON.stringify(data))
console.log(`[orbitr] Saved ${data.length.toLocaleString()} satellites to public/satellites.json`)
