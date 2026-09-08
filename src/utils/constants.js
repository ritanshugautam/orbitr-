export const EARTH_RADIUS_KM = 6371
export const EARTH_RADIUS_SCENE = 1.0
export const SCALE = EARTH_RADIUS_SCENE / EARTH_RADIUS_KM

export const CONSTELLATION_COLORS = {
  STARLINK:    0x4FC3F7,
  GPS:         0xFFD700,
  ISS:         0xFF6B35,
  GLONASS:     0xE040FB,
  GALILEO:     0x69F0AE,
  ONEWEB:      0xFF4081,
  OTHER:       0xCCCCCC,
}

export const CONSTELLATION_RULES = {
  STARLINK: name => name.toUpperCase().includes('STARLINK'),
  GPS:      name => name.toUpperCase().includes('GPS') || name.toUpperCase().includes('NAVSTAR'),
  ISS:      name => name.toUpperCase().includes('ISS') || name.toUpperCase().includes('ZARYA'),
  GLONASS:  name => name.toUpperCase().includes('COSMOS') && false,
  GALILEO:  name => name.toUpperCase().includes('GALILEO'),
  ONEWEB:   name => name.toUpperCase().includes('ONEWEB'),
}

export function getConstellation(name) {
  for (const [key, test] of Object.entries(CONSTELLATION_RULES)) {
    if (test(name)) return key
  }
  return 'OTHER'
}

export const FETCH_INTERVAL_MS = 2 * 60 * 60 * 1000
export const CACHE_KEY = 'orbitr_tle_data'
export const CACHE_TIMESTAMP_KEY = 'orbitr_tle_timestamp'
