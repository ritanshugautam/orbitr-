import * as satellite from 'satellite.js'

let satrecList = []
let nameList = []
let colorList = []
let constellationList = []

const COLORS = {
  STARLINK: [0.31, 0.76, 0.97],
  GPS:      [1.00, 0.84, 0.00],
  ISS:      [1.00, 0.42, 0.21],
  GLONASS:  [0.88, 0.25, 0.98],
  GALILEO:  [0.41, 0.94, 0.68],
  ONEWEB:   [1.00, 0.25, 0.51],
  OTHER:    [0.80, 0.80, 0.80],
}

function getConst(name) {
  const u = (name || '').toUpperCase()
  if (u.includes('STARLINK')) return 'STARLINK'
  if (u.includes('GPS') || u.includes('NAVSTAR')) return 'GPS'
  if (u.includes('ISS') || u.includes('ZARYA')) return 'ISS'
  if (u.includes('GALILEO')) return 'GALILEO'
  if (u.includes('ONEWEB')) return 'ONEWEB'
  return 'OTHER'
}

self.onmessage = function(e) {
  const { type, payload } = e.data

  if (type === 'INIT') {
    const { ommArray } = payload
    satrecList = []
    nameList = []
    colorList = []
    constellationList = []

    for (const omm of ommArray) {
      try {
        let satrec
        if (omm.TLE_LINE1 && omm.TLE_LINE2) {
          satrec = satellite.twoline2satrec(omm.TLE_LINE1, omm.TLE_LINE2)
        } else {
          satrec = satellite.json2satrec(omm)
        }
        if (satrec.error !== 0) continue
        const name = omm.OBJECT_NAME || omm.OBJECT_ID || 'UNKNOWN'
        const constellation = getConst(name)
        satrecList.push(satrec)
        nameList.push(name)
        colorList.push(COLORS[constellation] || COLORS.OTHER)
        constellationList.push(constellation)
      } catch (err) {
        // skip bad records
      }
    }

    self.postMessage({
      type: 'READY',
      payload: { count: satrecList.length }
    })
  }

  if (type === 'PROPAGATE') {
    const activeConstellations = new Set(payload?.activeConstellations || Object.keys(COLORS))
    const now = new Date()
    const gmst = satellite.gstime(now)

    const count = satrecList.length
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const valid = new Uint8Array(count)

    const EARTH_RADIUS_KM = 6371
    const SCALE = 1.0 / EARTH_RADIUS_KM

    for (let i = 0; i < count; i++) {
      if (!activeConstellations.has(constellationList[i])) {
        valid[i] = 0
        continue
      }

      try {
        const pv = satellite.propagate(satrecList[i], now)
        if (!pv.position || isNaN(pv.position.x)) {
          valid[i] = 0
          continue
        }
        const geo = satellite.eciToGeodetic(pv.position, gmst)
        const lat = geo.latitude
        const lon = geo.longitude
        const alt = geo.height

        const r = (EARTH_RADIUS_KM + alt) * SCALE
        const x = r * Math.cos(lat) * Math.cos(lon)
        const y = r * Math.sin(lat)
        const z = -r * Math.cos(lat) * Math.sin(lon)

        positions[i * 3]     = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        const col = colorList[i]
        colors[i * 3]     = col[0]
        colors[i * 3 + 1] = col[1]
        colors[i * 3 + 2] = col[2]

        valid[i] = 1
      } catch (err) {
        valid[i] = 0
      }
    }

    self.postMessage(
      { type: 'POSITIONS', payload: { positions, colors, valid, count } },
      [positions.buffer, colors.buffer, valid.buffer]
    )
  }
}
