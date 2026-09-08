# Orbitr

Real-time 3D satellite tracking visualization. Renders ~16,000 active satellites orbiting Earth using live orbital data from CelesTrak, SGP4 physics propagation running in a Web Worker, and Three.js WebGL rendering. Satellites move continuously frame-by-frame with no backend and no API key.

## How it works

1. **Data**: CelesTrak GP catalog (OMM JSON format) fetched via a Vite/Vercel server-side proxy (no CORS issues, no third-party proxy dependencies), cached in localStorage for 2 hours per CelesTrak's usage policy.

2. **Physics**: satellite.js runs SGP4 orbit propagation in a Web Worker — calculates exact lat/lon/altitude for every satellite at the current timestamp. Runs every second. Transferable buffers (zero-copy) pass results back to the main thread.

3. **Rendering**: All satellites render as a single THREE.Points object (one GPU draw call). Position Float32Array is updated in-place — no object allocation per frame. Runs at 60 fps.

## Tech stack

- React 18 + Vite
- Three.js (WebGL, BufferGeometry, OrbitControls)
- satellite.js (SGP4/SDP4 orbit propagation)
- CelesTrak GP API (OMM JSON, ~16,000 satellites)
- Web Workers (off-thread propagation)
- Vercel (deployment + API proxy via rewrites)

## What you can see

- **Starlink** (cyan) — ~11,000 satellites forming a dense low-orbit shell at 550km
- **GPS** (gold) — 31 satellites in 6 orbital planes at 20,200km
- **ISS** (orange) — single dot at ~400km, fastest visual motion
- **Galileo** (green) — European navigation constellation
- **OneWeb** (pink) — broadband LEO constellation
- **Other** (grey) — thousands of additional tracked objects

## Running locally

```bash
git clone <repo>
cd orbitr
npm install
npm run dev
```

Open http://localhost:5173. No API keys. No environment variables. No backend.

## Data source

CelesTrak (celestrak.org) — public domain orbital data maintained by Dr T.S. Kelso. Fetch policy: max once per 2 hours per their usage policy. Data is cached in localStorage.

## Live demo

[VERCEL_URL]
