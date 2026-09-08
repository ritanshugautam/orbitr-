import { EARTH_RADIUS_KM, SCALE } from './constants.js'

export function geoToXYZ(lat, lon, alt) {
  const r = (EARTH_RADIUS_KM + alt) * SCALE
  const x = r * Math.cos(lat) * Math.cos(lon)
  const y = r * Math.sin(lat)
  const z = -r * Math.cos(lat) * Math.sin(lon)
  return { x, y, z }
}

export function degToRad(deg) {
  return deg * (Math.PI / 180)
}
