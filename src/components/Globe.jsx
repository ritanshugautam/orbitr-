import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const CONSTELLATION_MAP = {
  showStarlink: 'STARLINK',
  showGPS: 'GPS',
  showISS: 'ISS',
  showGalileo: 'GALILEO',
  showOneWeb: 'ONEWEB',
  showOther: 'OTHER',
}

function getActiveConstellations(filters) {
  return Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k]) => CONSTELLATION_MAP[k])
    .filter(Boolean)
}

export default function Globe({ satelliteData, filters, onStats }) {
  const mountRef = useRef(null)
  const workerRef = useRef(null)
  const rendererRef = useRef(null)
  const animFrameRef = useRef(null)
  const positionsAttrRef = useRef(null)
  const colorsAttrRef = useRef(null)
  const pointsRef = useRef(null)
  const currentCountRef = useRef(0)
  // Track whether worker has finished INIT and is ready for PROPAGATE
  const [workerReady, setWorkerReady] = useState(false)
  const [status, setStatus] = useState('')

  // ── Scene setup (runs once on mount) ──────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000008)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 3)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.minDistance = 1.2
    controls.maxDistance = 10
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(5, 3, 5)
    scene.add(dir)

    // Earth
    const texture = new THREE.TextureLoader().load('/earth.jpg')
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 64, 64),
      new THREE.MeshPhongMaterial({ map: texture, shininess: 15 })
    ))

    // Atmosphere glow
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 32, 32),
      new THREE.MeshPhongMaterial({
        color: 0x4488ff, transparent: true, opacity: 0.08, side: THREE.BackSide,
      })
    ))

    // Starfield
    const starPos = new Float32Array(5000 * 3)
    for (let i = 0; i < 5000; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 50
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPos[i * 3 + 2] = r * Math.cos(phi)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    scene.add(new THREE.Points(starGeo,
      new THREE.PointsMaterial({ size: 0.05, color: 0xffffff, sizeAttenuation: false })
    ))

    // Satellite point cloud
    const MAX_SATS = 20000
    const positions = new Float32Array(MAX_SATS * 3).fill(0)
    const colors    = new Float32Array(MAX_SATS * 3).fill(0.5)
    const satGeo = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(positions, 3)
    const colAttr = new THREE.BufferAttribute(colors, 3)
    satGeo.setAttribute('position', posAttr)
    satGeo.setAttribute('color', colAttr)
    satGeo.setDrawRange(0, 0)
    const satMat = new THREE.PointsMaterial({
      size: 0.008, vertexColors: true, sizeAttenuation: true,
      transparent: true, opacity: 0.9,
    })
    const pts = new THREE.Points(satGeo, satMat)
    scene.add(pts)
    pointsRef.current = pts
    positionsAttrRef.current = posAttr
    colorsAttrRef.current = colAttr

    // Resize
    function onResize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Render loop
    let frameCount = 0
    let lastFpsTime = performance.now()
    function animate() {
      animFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
      frameCount++
      const now = performance.now()
      if (now - lastFpsTime > 1000) {
        onStats?.({ fps: frameCount, count: currentCountRef.current })
        frameCount = 0
        lastFpsTime = now
      }
    }
    animate()

    // Worker
    const worker = new Worker(
      new URL('../workers/propagator.js', import.meta.url),
      { type: 'module' }
    )
    worker.onmessage = (e) => {
      const { type, payload } = e.data

      if (type === 'READY') {
        setStatus(`${payload.count.toLocaleString()} satellites loaded`)
        setWorkerReady(true)   // triggers the propagation interval effect
      }

      if (type === 'POSITIONS') {
        const { positions: pos, colors: col, valid, count } = payload
        const pA = positionsAttrRef.current
        const cA = colorsAttrRef.current
        const p  = pointsRef.current
        if (!pA || !cA || !p) return
        pA.array.set(pos)
        cA.array.set(col)
        pA.needsUpdate = true
        cA.needsUpdate = true
        let validCount = 0
        for (let i = 0; i < count; i++) if (valid[i]) validCount++
        p.geometry.setDrawRange(0, count)
        currentCountRef.current = validCount
      }
    }
    workerRef.current = worker

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      worker.terminate()
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  // ── Send data to worker when it arrives ───────────────────────────────
  useEffect(() => {
    if (satelliteData && workerRef.current) {
      setWorkerReady(false)
      setStatus('Initialising propagator...')
      workerRef.current.postMessage({ type: 'INIT', payload: { ommArray: satelliteData } })
    }
  }, [satelliteData])

  // ── Single interval owner: runs when worker is ready or filters change ─
  useEffect(() => {
    if (!workerReady || !workerRef.current) return

    function propagate() {
      workerRef.current.postMessage({
        type: 'PROPAGATE',
        payload: { activeConstellations: getActiveConstellations(filters) },
      })
    }

    propagate()                                  // immediate first tick
    const id = setInterval(propagate, 1000)
    return () => clearInterval(id)
  }, [workerReady, filters])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#000008' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      {status && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          color: '#888', fontSize: '12px', fontFamily: 'monospace',
        }}>
          {status}
        </div>
      )}
    </div>
  )
}
